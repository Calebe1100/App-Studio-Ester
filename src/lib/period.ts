import { addDaysISO } from "@/lib/time";

export function startOfWeekISO(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysISO(date, offset);
}

export function endOfWeekISO(date: string) {
  return addDaysISO(startOfWeekISO(date), 6);
}

export function startOfMonthISO(date: string) {
  return `${date.slice(0, 8)}01`;
}

export function endOfMonthISO(date: string) {
  const [year, month] = date.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();
  return `${date.slice(0, 8)}${String(last).padStart(2, "0")}`;
}

export function inDateRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}
