import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useReminders } from "@/hooks/use-reminders";
import { requestNotificationPermission } from "@/lib/notifications";
import { format } from "date-fns";
import { AlarmClock, Bell, Clock, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function TimeField({ value, onChange, onRemove }: { value: string; onChange: (v: string) => void; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="w-[140px]" />
      {onRemove && (
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove time">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function Index() {
  const { reminders, upcoming, addReminder, removeReminder, togglePause, snooze, markTaken, updateReminder } = useReminders();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>(["09:00"]);
  const [repeat, setRepeat] = useState<"once" | "daily">("daily");
  const [sendSms, setSendSms] = useState(false);
  const [phone, setPhone] = useState("");
  // Patient details
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");

  useEffect(() => {
    if (Notification && Notification.permission !== "granted") {
      requestNotificationPermission();
    }
  }, []);

  const canSendSms = sendSms && phone.trim().length > 0;

  function reset() {
    setName("");
    setDosage("");
    setTimes(["09:00"]);
    setRepeat("daily");
    setSendSms(false);
    setPhone("");
    setPatientName("");
    setPatientAge("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a medicine name");
      return;
    }
    // parse age
    const ageNum = patientAge ? Number(patientAge) : null;
    addReminder({
      name: name.trim(),
      dosage: dosage.trim(),
      times: times.filter(Boolean),
      repeat,
      sendSms: canSendSms,
      phone: phone.trim(),
      patientName: patientName.trim() || undefined,
      patientAge: ageNum,
    });
    reset();
  }

  const hasDeniedNotifications = typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied";

  return (
    <main className="container px-4 py-12">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-transparent p-6 shadow-xl">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-cyan-200 to-blue-300 opacity-40 blur-3xl transform rotate-45" />
            <div className="relative z-10 grid gap-4 md:grid-cols-2 md:items-center">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full bg-white/60 px-3 py-1 text-sm font-semibold text-muted-foreground shadow-sm">
                  <Bell className="h-4 w-4 text-cyan-600" /> Digital Pillbox
                </div>
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Never miss a dose again</h1>
                <p className="mt-3 text-muted-foreground text-lg max-w-xl">Add medicines, link them to patients, and receive timely reminders via local notifications or SMS. Beautiful, reliable and simple.</p>
                {hasDeniedNotifications && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">Notifications are blocked. Enable them in your browser settings to get alerts.</div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/20 p-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Smart scheduling</div>
                      <div className="text-xs opacity-90">Daily or one-time reminders, with snooze and taken tracking.</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <div className="text-xs opacity-90">Secure local storage</div>
                    <div className="text-xs opacity-90">Optional SMS alerts (Twilio)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <CardHeader>
              <CardTitle>New Reminder</CardTitle>
              <CardDescription>Medicine, dosage and times. Choose once or daily.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Medicine</Label>
                  <Input id="name" placeholder="e.g. Amoxicillin" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input id="dosage" placeholder="e.g. 500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
                  <div>
                    <Label htmlFor="patientName">Patient name</Label>
                    <Input id="patientName" placeholder="e.g. John Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="patientAge">Age</Label>
                    <Input id="patientAge" type="number" placeholder="e.g. 34" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Times</Label>
                  <div className="flex flex-col gap-2">
                    {times.map((t, i) => (
                      <TimeField key={i} value={t} onChange={(v) => setTimes((prev) => prev.map((x, idx) => (idx === i ? v : x)))} onRemove={times.length > 1 ? () => setTimes((prev) => prev.filter((_, idx) => idx !== i)) : undefined} />
                    ))}
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setTimes((prev) => [...prev, "13:00"]) }>
                      <Plus className="h-4 w-4" /> Add time
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${repeat === "daily" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>Daily</span>
                    <Switch checked={repeat === "daily"} onCheckedChange={(v) => setRepeat(v ? "daily" : "once")} />
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${repeat === "once" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>Once</span>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Optional SMS (requires server config)</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={sendSms} onCheckedChange={setSendSms} id="sms" />
                      <Label htmlFor="sms">Send SMS too</Label>
                    </div>
                    <Input type="tel" placeholder="+1 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!sendSms} />
                  </div>
                  {!sendSms && (
                    <p className="mt-2 text-xs text-muted-foreground">Local notifications work immediately. To enable SMS, deploy and configure TWILIO env vars.</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlarmClock className="h-4 w-4" />
                    <span>Reminders will ring at the times you set.</span>
                  </div>
                  <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg">Schedule</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Your next reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcoming.length === 0 && (
                  <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No upcoming reminders. Add one on the left.</div>
                )}
                {upcoming.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border bg-white/60 dark:bg-card p-3 hover:shadow-xl transition">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold truncate">{r.name}</p>
                          {r.patientName && (
                            <span className="text-xs text-muted-foreground">• {r.patientName}{r.patientAge ? `, ${r.patientAge}y` : ""}</span>
                          )}
                          {r.dosage && <Badge variant="secondary">{r.dosage}</Badge>}
                          {r.repeat === "daily" ? <Badge>Daily</Badge> : <Badge variant="outline">Once</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">Next at {r.nextAt ? format(r.nextAt, "EEE, MMM d • h:mm a") : "n/a"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => snooze(r.id, 10)}>Snooze 10m</Button>
                      <Button variant="secondary" size="sm" onClick={() => markTaken(r.id)}>Taken</Button>
                      <Button variant="ghost" size="icon" onClick={() => togglePause(r.id)} aria-label="Pause or resume">
                        {r.paused ? <span className="text-xs">Resume</span> : <span className="text-xs">Pause</span>}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeReminder(r.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {reminders.length > 0 && (
                <p className="mt-4 text-center text-xs text-muted-foreground">Total reminders: {reminders.length}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
