import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInMilliseconds, isAfter, isBefore, set } from "date-fns";
import { notify } from "@/lib/notifications";
import { toast } from "sonner";

export type RepeatType = "once" | "daily";

export interface HistoryEntry {
  type: "fired" | "taken" | "snoozed" | "paused" | "resumed" | "missed" | "note";
  at: number;
  meta?: any;
}

export interface Reminder {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // HH:mm (24h)
  repeat: RepeatType;
  nextAt: number | null; // epoch ms
  paused: boolean;
  // Patient details
  patientName?: string;
  patientAge?: number | null;
  sendSms?: boolean;
  phone?: string;
  notes?: string;
  history?: HistoryEntry[];
  createdAt: number;
  lastFiredAt?: number;
}

const STORAGE_KEY = "pillbox.reminders.v1";

function parseHHMMToDate(hhmm: string, base: Date): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
}

function nextOccurrence(times: string[], repeat: RepeatType, from: Date): Date | null {
  const sorted = [...times].sort();
  for (const t of sorted) {
    const candidate = parseHHMMToDate(t, from);
    if (isAfter(candidate, from) || candidate.getTime() === from.getTime()) {
      return candidate;
    }
  }
  if (repeat === "daily") {
    const tomorrow = new Date(from);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return parseHHMMToDate(sorted[0], tomorrow);
  }
  return null;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Reminder[];
      return parsed.map((r) => ({ ...r, paused: !!r.paused }));
    } catch {
      return [];
    }
  });

  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  function schedule(rem: Reminder) {
    if (rem.paused || rem.nextAt == null) return;
    const now = new Date();
    const delay = Math.max(0, differenceInMilliseconds(new Date(rem.nextAt), now));
    clearTimer(rem.id);
    timers.current[rem.id] = window.setTimeout(async () => {
      try {
        await notify({
          title: `Time to take ${rem.name}`,
          body: rem.dosage ? `Dosage: ${rem.dosage}` : undefined,
        });
        // Dispatch an in-app event so UI can show a popup with actions
        try {
          const payload = {
            id: rem.id,
            name: rem.name,
            dosage: rem.dosage,
            patientName: rem.patientName,
            patientAge: rem.patientAge,
            phone: rem.phone,
            notes: rem.notes,
            history: rem.history ?? [],
            nextAt: rem.nextAt,
          };
          window.dispatchEvent(new CustomEvent("pillbox:reminder-fired", { detail: payload }));
          // push fired history
          setReminders((prev) => prev.map((r) => (r.id === rem.id ? { ...r, history: [ ...(r.history || []), { type: "fired", at: Date.now() } ] } : r)));
        } catch (e) {
          // ignore
        }

        if (rem.sendSms && rem.phone) {
          try {
            const resp = await fetch("/api/sms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to: rem.phone, message: `Time to take ${rem.name}${rem.dosage ? ` (${rem.dosage})` : ""}` }),
            });
            if (!resp.ok) {
              const data = await resp.json().catch(() => ({}));
              console.warn("SMS send failed:", data?.error || resp.statusText);
            }
          } catch (e) {
            console.warn("SMS request error", e);
          }
        }
      } finally {
        setReminders((prev) => {
          const next = [...prev];
          const idx = next.findIndex((r) => r.id === rem.id);
          if (idx === -1) return prev;
          const r = next[idx];
          r.lastFiredAt = Date.now();
          if (r.repeat === "daily") {
            const n = nextOccurrence(r.times, r.repeat, new Date());
            r.nextAt = n ? n.getTime() : null;
            toast.success(`Scheduled next dose for ${r.name}`);
            schedule(r);
          } else {
            // one-time reminder completes
            toast.success(`Completed one-time reminder for ${r.name}`);
            next.splice(idx, 1);
          }
          return [...next];
        });
      }
    }, delay);
  }

  function clearTimer(id: string) {
    const t = timers.current[id];
    if (t) {
      clearTimeout(t);
      delete timers.current[id];
    }
  }

  useEffect(() => {
    // re-schedule all on list changes
    reminders.forEach((r) => schedule(r));
    return () => {
      Object.values(timers.current).forEach((t) => clearTimeout(t));
      timers.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders.length]);

  // On mount, check for missed reminders and compute nextAt where needed
  useEffect(() => {
    setReminders((prev) => {
      const now = new Date();
      return prev.map((r) => {
        if (r.paused) return r;
        if (r.nextAt == null) {
          const n = nextOccurrence(r.times, r.repeat, now);
          return { ...r, nextAt: n ? n.getTime() : null };
        }
        // If nextAt is in the past, roll forward
        if (isBefore(new Date(r.nextAt), now)) {
          const n = nextOccurrence(r.times, r.repeat, now);
          return { ...r, nextAt: n ? n.getTime() : null };
        }
        return r;
      });
    });

    // Register API implementation for global UI components
    function pushHistory(id: string, entry: HistoryEntry) {
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, history: [ ...(r.history || []), entry ] } : r)));
    }

    function markMissed(id: string) {
      pushHistory(id, { type: "missed", at: Date.now() });
      toast.error("Reminder marked as missed");
    }

    function addNote(id: string, note: string) {
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, notes: note, history: [ ...(r.history || []), { type: "note", at: Date.now(), meta: { note } } ] } : r)));
      toast.success("Note added");
    }

    (async () => {
      try {
        const mod = await import("@/lib/reminder-api");
        mod.ReminderAPI.set({
          snooze,
          markTaken,
          remove: removeReminder,
          togglePause,
          markMissed,
          addNote,
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      try {
        // clear implementation on unmount
        // dynamic import to avoid circular deps
        import("@/lib/reminder-api").then((m) => m.ReminderAPI.clear()).catch(() => {});
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = useMemo(() => {
    return [...reminders]
      .filter((r) => !r.paused && r.nextAt != null)
      .sort((a, b) => (a.nextAt! - b.nextAt!));
  }, [reminders]);

  function addReminder(input: Omit<Reminder, "id" | "createdAt" | "nextAt" | "paused"> & { patientName?: string; patientAge?: number | null }) {
    const id = crypto.randomUUID();
    const now = new Date();
    const n = nextOccurrence(input.times, input.repeat, now);
    const rem: Reminder = {
      id,
      name: input.name,
      dosage: input.dosage,
      times: input.times,
      repeat: input.repeat,
      sendSms: input.sendSms,
      phone: input.phone,
      patientName: input.patientName,
      patientAge: input.patientAge ?? null,
      createdAt: Date.now(),
      paused: false,
      nextAt: n ? n.getTime() : null,
    };
    setReminders((prev) => [...prev, rem]);
    toast.success(`Reminder added for ${input.name}`);
  }

  function removeReminder(id: string) {
    clearTimer(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  function togglePause(id: string) {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)));
  }

  function snooze(id: string, minutes: number) {
    setReminders((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const when = Date.now() + minutes * 60_000;
      const h = [ ...(r.history || []), { type: "snoozed", at: Date.now(), meta: { minutes } } ];
      return { ...r, nextAt: when, history: h };
    }));
    toast(`Snoozed for ${minutes} min`);
  }

  function markTaken(id: string) {
    setReminders((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.id === id);
      if (idx === -1) return prev;
      const r = next[idx];
      r.lastFiredAt = Date.now();
      r.history = [ ...(r.history || []), { type: "taken", at: Date.now() } ];
      if (r.repeat === "daily") {
        const n = nextOccurrence(r.times, r.repeat, new Date());
        r.nextAt = n ? n.getTime() : null;
        toast.success(`Great! Next dose for ${r.name} scheduled.`);
      } else {
        next.splice(idx, 1);
        toast.success(`Completed one-time reminder for ${r.name}`);
      }
      return next;
    });
  }

  function updateReminder(id: string, patch: Partial<Reminder>) {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return {
    reminders,
    upcoming,
    addReminder,
    removeReminder,
    togglePause,
    snooze,
    markTaken,
    updateReminder,
  } as const;
}
