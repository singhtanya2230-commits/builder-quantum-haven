import type { RequestHandler } from "express";

export const sendSms: RequestHandler = async (req, res) => {
  const { to, message } = req.body as { to?: string; message?: string };
  if (!to || !message) {
    return res
      .status(400)
      .json({ success: false, error: "Missing 'to' or 'message'" });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return res.status(400).json({
      success: false,
      error:
        "SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.",
    });
  }

  try {
    const basic = Buffer.from(`${sid}:${token}`).toString("base64");
    const form = new URLSearchParams({ To: to, From: from, Body: message });
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const resp = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ success: false, error: data?.message || "Failed to send" });
    }
    return res.status(200).json({ success: true, id: data.sid });
  } catch (e: any) {
    return res
      .status(500)
      .json({ success: false, error: e?.message || "Unknown error" });
  }
};
