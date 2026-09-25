export interface AvailabilityRule {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityException {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BookedLesson {
  startAt: Date;
  endAt: Date;
}

export interface Slot {
  startAt: Date;
  endAt: Date;
}

const GRID_STARTS = new Set(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]);

const BRUSSELS_TZ = "Europe/Brussels";

// Formats an instant's wall-clock date/time as it reads in Europe/Brussels, regardless of the
// server process's own local timezone. Used both to find the Brussels offset for a given instant
// (see brusselsWallTimeToUtc below) and to read off a Brussels calendar day.
const brusselsPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BRUSSELS_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function brusselsParts(instant: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = brusselsPartsFormatter.formatToParts(instant);
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

/** The UTC-minus-Brussels offset (in minutes) in effect at a given instant (e.g. 120 during CEST, 60 during CET). */
function brusselsOffsetMinutes(instant: Date): number {
  const p = brusselsParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** The Brussels calendar day (year/month/day, per Brussels wall-clock) that a given instant falls on. */
function brusselsCalendarDay(instant: Date): { year: number; month: number; day: number } {
  const { year, month, day } = brusselsParts(instant);
  return { year, month, day };
}

/**
 * Converts a Brussels wall-clock time (given as a calendar day plus minutes-since-midnight) into
 * the actual UTC instant it represents — correctly accounting for CET/CEST, independent of the
 * server process's own timezone. This is the inverse of brusselsOffsetMinutes: since the offset
 * itself depends on the instant (DST), we resolve it with one correction pass, which is exact
 * except in the (irrelevant for this app's business hours) hour that repeats/is skipped on the
 * DST transition night itself.
 */
function brusselsWallTimeToUtc(year: number, month: number, day: number, minutesOfDay: number): Date {
  const hour = Math.floor(minutesOfDay / 60);
  const minute = minutesOfDay % 60;
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset1 = brusselsOffsetMinutes(guess);
  const utcMillis1 = guess.getTime() - offset1 * 60000;
  const offset2 = brusselsOffsetMinutes(new Date(utcMillis1));
  const utcMillis = offset2 === offset1 ? utcMillis1 : guess.getTime() - offset2 * 60000;
  return new Date(utcMillis);
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function isoDateOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Computes available lesson slots within a date range, respecting rules, exceptions, and bookings.
 *
 * IMPORTANT: All "calendar day" and "HH:mm" arithmetic (which weekday a rule applies to, which
 * date an exception matches, what wall-clock time a rule's startTime/endTime means) is anchored to
 * the Europe/Brussels timezone explicitly, not to the server process's local timezone. This makes
 * the function's output identical no matter where it runs (UTC server, Brussels server, a laptop
 * in another timezone, etc.) — a "09:00" rule always means 09:00 Brussels wall-clock time, and the
 * returned Slot.startAt/endAt are the correct absolute UTC instants for that wall-clock time
 * (accounting for CET/CEST). `rangeStart`, `rangeEnd`, and `bookedLessons` are compared as ordinary
 * absolute instants, so callers can pass any correctly-constructed Date/instant for those.
 *
 * @param params Query parameters
 * @returns Array of available Slot objects
 */
export function computeAvailableSlots(params: {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  bookedLessons: BookedLesson[];
  rangeStart: Date;
  rangeEnd: Date;
  lessonDurationMinutes: number;
  weekdayFilter?: number[];
}): Slot[] {
  const { rules, exceptions, bookedLessons, rangeStart, rangeEnd, lessonDurationMinutes, weekdayFilter } = params;
  const slots: Slot[] = [];

  const startDay = brusselsCalendarDay(rangeStart);
  const endDay = brusselsCalendarDay(rangeEnd);
  const dayCursorEnd = Date.UTC(endDay.year, endDay.month - 1, endDay.day);

  for (
    let dayCursor = Date.UTC(startDay.year, startDay.month - 1, startDay.day);
    dayCursor <= dayCursorEnd;
    dayCursor += 24 * 60 * 60 * 1000
  ) {
    // dayCursor is used purely as a Y/M/D calendar counter (encoded as a UTC-midnight timestamp so
    // that adding exactly one day is always unambiguous) — it is never treated as a real instant.
    const cursorDate = new Date(dayCursor);
    const year = cursorDate.getUTCFullYear();
    const month = cursorDate.getUTCMonth() + 1;
    const day = cursorDate.getUTCDate();
    const weekday = cursorDate.getUTCDay();

    if (weekdayFilter && weekdayFilter.length > 0 && !weekdayFilter.includes(weekday)) {
      continue;
    }

    const isoDate = isoDateOf(year, month, day);
    const dayExceptions = exceptions.filter((e) => e.date === isoDate);
    const blockedAllDay = dayExceptions.some(
      (e) => !e.isAvailable && parseTimeToMinutes(e.startTime) === 0 && parseTimeToMinutes(e.endTime) >= 1439
    );
    if (blockedAllDay) continue;

    const windows = [
      ...rules.filter((r) => r.weekday === weekday).map((r) => ({ start: r.startTime, end: r.endTime })),
      ...dayExceptions.filter((e) => e.isAvailable).map((e) => ({ start: e.startTime, end: e.endTime })),
    ];

    for (const window of windows) {
      const windowStartMin = parseTimeToMinutes(window.start);
      const windowEndMin = parseTimeToMinutes(window.end);

      for (
        let slotStartMin = windowStartMin;
        slotStartMin + lessonDurationMinutes <= windowEndMin;
        slotStartMin += lessonDurationMinutes
      ) {
        const startLabel = `${String(Math.floor(slotStartMin / 60)).padStart(2, "0")}:${String(slotStartMin % 60).padStart(2, "0")}`;
        if (!GRID_STARTS.has(startLabel)) continue;

        const slotStart = brusselsWallTimeToUtc(year, month, day, slotStartMin);
        const slotEnd = brusselsWallTimeToUtc(year, month, day, slotStartMin + lessonDurationMinutes);
        if (slotStart < rangeStart || slotEnd > rangeEnd) continue;

        const blockedByException = dayExceptions.some(
          (e) =>
            !e.isAvailable &&
            overlaps(
              slotStart, slotEnd,
              brusselsWallTimeToUtc(year, month, day, parseTimeToMinutes(e.startTime)),
              brusselsWallTimeToUtc(year, month, day, parseTimeToMinutes(e.endTime))
            )
        );
        if (blockedByException) continue;

        const blockedByBooking = bookedLessons.some((l) => overlaps(slotStart, slotEnd, l.startAt, l.endAt));
        if (blockedByBooking) continue;

        slots.push({ startAt: slotStart, endAt: slotEnd });
      }
    }
  }

  return slots;
}
