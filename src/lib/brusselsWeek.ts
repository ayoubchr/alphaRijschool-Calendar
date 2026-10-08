const BRUSSELS = "Europe/Brussels";

function brusselsParts(instant: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRUSSELS,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function brusselsOffsetMinutes(instant: Date): number {
  const p = brusselsParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** A Brussels wall-clock date and time, as a UTC instant. `time` is `HH:mm`. */
export function brusselsDateAndTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset1 = brusselsOffsetMinutes(guess);
  const utcMillis1 = guess.getTime() - offset1 * 60000;
  const offset2 = brusselsOffsetMinutes(new Date(utcMillis1));
  return new Date(offset2 === offset1 ? utcMillis1 : guess.getTime() - offset2 * 60000);
}

/** Midnight at the start of a Brussels calendar day, as a UTC instant. */
export function brusselsMidnight(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offset1 = brusselsOffsetMinutes(guess);
  const utcMillis1 = guess.getTime() - offset1 * 60000;
  const offset2 = brusselsOffsetMinutes(new Date(utcMillis1));
  return new Date(offset2 === offset1 ? utcMillis1 : guess.getTime() - offset2 * 60000);
}

export function brusselsYmd(instant: Date): { year: number; month: number; day: number } {
  const { year, month, day } = brusselsParts(instant);
  return { year, month, day };
}

export function brusselsDateKey(instant: Date): string {
  const { year, month, day } = brusselsYmd(instant);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addCalendarDays(year: number, month: number, day: number, delta: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + delta));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** Monday 00:00 Europe/Brussels of the week that contains `anchor`. */
export function startOfBrusselsWeek(anchor: Date): Date {
  const { year, month, day } = brusselsYmd(anchor);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: BRUSSELS, weekday: "short" }).format(anchor);
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const mondayOffset = index === 0 ? -6 : 1 - index;
  const monday = addCalendarDays(year, month, day, mondayOffset);
  return brusselsMidnight(monday.year, monday.month, monday.day);
}

/** A lesson can be planned from tomorrow onward, in Europe/Brussels. */
export function isTooSoonToPlan(startAt: Date, now = new Date()) {
  return brusselsDateKey(startAt) <= brusselsDateKey(now);
}

export function addBrusselsDays(midnight: Date, days: number): Date {
  const { year, month, day } = brusselsYmd(midnight);
  const next = addCalendarDays(year, month, day, days);
  return brusselsMidnight(next.year, next.month, next.day);
}

/** How far a pupil may look ahead when booking or planning. */
export const PLANNING_MONTHS_AHEAD = 8;

export function addBrusselsMonths(anchor: Date, months: number): Date {
  const { year, month, day } = brusselsYmd(anchor);
  const shifted = new Date(Date.UTC(year, month - 1 + months, day));
  return brusselsMidnight(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/** Monday of the last week a pupil can open, 8 months from now. */
export function latestPlanningWeek(now = new Date()): Date {
  return startOfBrusselsWeek(addBrusselsMonths(now, PLANNING_MONTHS_AHEAD));
}
