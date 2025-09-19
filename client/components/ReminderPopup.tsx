import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Clock, Check, X, Pause, Trash2, MessageCircle } from "lucide-react";
import { ReminderAPI } from "@/lib/reminder-api";
import { format } from "date-fns";

type HistoryItem = {
  type: string;
  at: number;
  meta?: any;
};

type FiredDetail = {
  id: string;
  name: string;
  dosage?: string;
  patientName?: string;
  patientAge?: number | null;
  phone?: string;
  notes?: string;
  history?: HistoryItem[];
  nextAt?: number | null;
};

export default function ReminderPopup() {
  const [payload, setPayload] = useState<FiredDetail | null>(null);
  const [visible, setVisible] = useState(false);
  const [missed, setMissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    let timer: any;
    function handler(e: Event) {
      const ev = e as CustomEvent<FiredDetail>;
      setPayload(ev.detail);
      setVisible(true);
      setMissed(false);
      setNoteText(ev.detail.notes ?? "");
      // auto-hide after 30s visually but keep popup for missed handling
      timer = setTimeout(() => setVisible(false), 30000);
      // start 30 min missed timer
      setTimeout(
        () => {
          // if still not acknowledged
          if (
            ev.detail &&
            !ev.detail.history?.some((h) => h.type === "taken")
          ) {
            setMissed(true);
            ReminderAPI.markMissed && ReminderAPI.markMissed(ev.detail.id);
          }
        },
        30 * 60 * 1000,
      );
    }
    window.addEventListener("pillbox:reminder-fired", handler as EventListener);
    return () => {
      window.removeEventListener(
        "pillbox:reminder-fired",
        handler as EventListener,
      );
      clearTimeout(timer);
    };
  }, []);

  const takenToday = useMemo(() => {
    if (!payload) return 0;
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();
    return (payload.history || []).filter(
      (h) => h.type === "taken" && h.at >= start,
    ).length;
  }, [payload]);

  const totalToday = payload ? (payload.nextAt ? 1 : 0) : 0; // fallback: at least 1
  // If repeat daily and times present in history meta? We don't have times here — approximate using history fired count
  const firedToday = payload
    ? (payload.history || []).filter(
        (h) =>
          h.type === "fired" &&
          new Date(h.at).toDateString() === new Date().toDateString(),
      ).length
    : 0;

  if (!payload) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[1000] w-[360px] transform-gpu transition-all ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <Card className={`p-4 ${missed ? "border-red-400" : ""}`}>
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 flex h-12 w-12 flex-none items-center justify-center rounded-xl text-white ${missed ? "bg-red-500" : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}
          >
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold leading-tight">
                  {payload.name}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{payload.dosage}</span>
                  {payload.patientName && (
                    <span>
                      • {payload.patientName}
                      {payload.patientAge ? `, ${payload.patientAge}y` : ""}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Scheduled:{" "}
                  {payload.nextAt
                    ? format(payload.nextAt, "EEE, MMM d • h:mm a")
                    : "Now"}
                </div>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setVisible(false);
                  setPayload(null);
                }}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  ReminderAPI.snooze(payload.id, 10);
                  setVisible(false);
                }}
              >
                <Clock className="h-4 w-4" /> Snooze 10m
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  ReminderAPI.markTaken(payload.id);
                  setVisible(false);
                }}
              >
                <Check className="h-4 w-4" /> Taken
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  ReminderAPI.togglePause(payload.id);
                }}
              >
                <Pause className="h-4 w-4" /> Pause
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  ReminderAPI.remove(payload.id);
                  setVisible(false);
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>

            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-sm font-medium">
                  {takenToday}/{Math.max(1, firedToday || totalToday)} taken
                  today
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/40">
                <div
                  className={`h-2 rounded-full ${takenToday > 0 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{
                    width: `${Math.min(100, Math.round((takenToday / Math.max(1, firedToday || totalToday)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm text-muted-foreground">Notes</label>
              <div className="mt-1 flex gap-2">
                <input
                  className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    ReminderAPI.addNote &&
                      ReminderAPI.addNote(payload.id, noteText);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm font-semibold">History</div>
              <div className="mt-2 max-h-28 overflow-auto text-sm text-muted-foreground">
                {(payload.history || [])
                  .slice()
                  .reverse()
                  .map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <div>
                        <div
                          className={`text-xs ${h.type === "taken" ? "text-green-600" : h.type === "snoozed" ? "text-orange-600" : h.type === "missed" ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          {h.type.toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(h.at).toLocaleString()}
                        </div>
                      </div>
                      {h.meta?.minutes && (
                        <div className="text-xs text-muted-foreground">
                          {h.meta.minutes}m
                        </div>
                      )}
                    </div>
                  ))}
                {(payload.history || []).length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No history yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!payload.phone) return;
                  setSending(true);
                  try {
                    const resp = await fetch("/api/sms", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        to: payload.phone,
                        message: `Reminder: ${payload.name} ${payload.dosage || ""}`,
                      }),
                    });
                    if (!resp.ok) throw new Error("sms failed");
                  } catch (e) {
                    // ignore
                  } finally {
                    setSending(false);
                  }
                }}
              >
                <MessageCircle className="h-4 w-4" /> Send SMS
              </Button>
              <div className="text-xs text-muted-foreground">
                Enable SMS/WhatsApp if server configured.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
