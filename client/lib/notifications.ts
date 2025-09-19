import { toast } from "sonner";

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied" as const;
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  return await Notification.requestPermission();
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.65);
  } catch {
    // ignore
  }
}

export async function notify(opts: { title: string; body?: string }) {
  if (typeof window === "undefined") return;
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(opts.title, { body: opts.body, icon: "/placeholder.svg" });
    } catch {
      toast(opts.title, { description: opts.body });
    }
  } else {
    toast(opts.title, { description: opts.body });
  }
  beep();
}
