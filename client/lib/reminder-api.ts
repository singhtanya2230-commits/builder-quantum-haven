type Impl = {
  snooze: (id: string, minutes: number) => void;
  markTaken: (id: string) => void;
  remove: (id: string) => void;
  togglePause: (id: string) => void;
} | null;

let impl: Impl = null;

export const ReminderAPI = {
  set(i: Impl) {
    impl = i;
  },
  clear() {
    impl = null;
  },
  snooze(id: string, minutes: number) {
    if (!impl) return console.warn("ReminderAPI not initialized");
    return impl!.snooze(id, minutes);
  },
  markTaken(id: string) {
    if (!impl) return console.warn("ReminderAPI not initialized");
    return impl!.markTaken(id);
  },
  remove(id: string) {
    if (!impl) return console.warn("ReminderAPI not initialized");
    return impl!.remove(id);
  },
  togglePause(id: string) {
    if (!impl) return console.warn("ReminderAPI not initialized");
    return impl!.togglePause(id);
  },
};
