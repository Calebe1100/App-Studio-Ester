import { GRID_END, GRID_START, SLOT_MINUTES, TIMEZONE } from "@/lib/constants";

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

export function addDaysISO(date: string, amount: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return next.toISOString().slice(0, 10);
}

export function formatLongDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

export function toMinutes(hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(hhmm: string, minutes: number) {
  return fromMinutes(toMinutes(hhmm) + minutes);
}

export function timeSlots() {
  const slots: string[] = [];
  for (let minute = toMinutes(GRID_START); minute < toMinutes(GRID_END); minute += SLOT_MINUTES) {
    slots.push(fromMinutes(minute));
  }
  return slots;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
