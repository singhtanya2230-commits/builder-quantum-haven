import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Clock, Check, X } from "lucide-react";
import { ReminderAPI } from "@/lib/reminder-api";

type FiredDetail = {
  id: string;
  name: string;
  dosage?: string;
  patientName?: string;
  patientAge?: number | null;
  phone?: string;
};

export default function ReminderPopup() {
  const [payload, setPayload] = useState<FiredDetail | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const ev = e as CustomEvent<FiredDetail>;
      setPayload(ev.detail);
      // auto-hide after 30s
      setTimeout(() => setPayload(null), 30000);
    }
    window.addEventListener("pillbox:reminder-fired", handler as EventListener);
    return () => window.removeEventListener("pillbox:reminder-fired", handler as EventListener);
  }, []);

  if (!payload) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] w-[340px]">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{payload.name}</div>
                <div className="text-xs text-muted-foreground">{payload.dosage}</div>
                {payload.patientName && (
                  <div className="text-xs text-muted-foreground">Patient: {payload.patientName}{payload.patientAge ? `, ${payload.patientAge}y` : ""}</div>
                )}
              </div>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setPayload(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { ReminderAPI.snooze(payload.id, 10); setPayload(null); }}>
                <Clock className="h-4 w-4" /> Snooze
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { ReminderAPI.markTaken(payload.id); setPayload(null); }}>
                <Check className="h-4 w-4" /> Taken
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { ReminderAPI.remove(payload.id); setPayload(null); }}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
