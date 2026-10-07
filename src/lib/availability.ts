export type AvailabilityKind = "LESSON" | "EXAM" | "EXAM_PREP";

export interface AvailabilityRule {
  weekday: number;
  startTime: string;
  endTime: string;
  kind?: AvailabilityKind;
}

export interface AvailabilityException {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  kind?: AvailabilityKind;
}

export interface BookedLesson {
  startAt: Date;
  endAt: Date;
}

export interface Slot {
  startAt: Date;
  endAt: Date;
}

/** Starts land on a quarter, but a pupil picks the whole block, not a start inside it. */
const SLOT_STEP_MINUTES = 15;

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
  /** Exam packages only see exam blocks, and each block is booked as a whole. */
  blockKind?: AvailabilityKind;
}): Slot[] {
  const { bookedLessons, rangeStart, rangeEnd, lessonDurationMinutes, weekdayFilter } = params;
  const blockKind = params.blockKind ?? "LESSON";
  const wholeBlock = blockKind === "EXAM" || blockKind === "EXAM_PREP";
  const rules = params.rules.filter((rule) => (rule.kind ?? "LESSON") === blockKind);
  const exceptions = params.exceptions.filter((exception) => {
    const allDayOff = !exception.isAvailable && parseTimeToMinutes(exception.startTime) === 0 && parseTimeToMinutes(exception.endTime) >= 1439;
    return allDayOff || (exception.kind ?? "LESSON") === blockKind;
  });
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
      // Each saved block is one lesson start (08:15–10:15 stays 08:15). A longer
      // block still steps per lesson, not per quarter, so neighbours are not invented.
      const starts = wholeBlock ? [windowStartMin] : Array.from(
        { length: Math.floor((windowEndMin - windowStartMin) / lessonDurationMinutes) },
        (_, index) => windowStartMin + index * lessonDurationMinutes,
      );
      for (const slotStartMin of starts) {
        if (slotStartMin % SLOT_STEP_MINUTES !== 0) continue;
        const slotLength = wholeBlock ? windowEndMin - windowStartMin : lessonDurationMinutes;
        if (!wholeBlock && slotStartMin + slotLength > windowEndMin) continue;
        const slotStart = brusselsWallTimeToUtc(year, month, day, slotStartMin);
        const slotEnd = brusselsWallTimeToUtc(year, month, day, slotStartMin + slotLength);
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

        slots.push({ startAt: slotStart, endAt: slotEnd });
      }
    }
  }

  const offered = wholeBlock ? slots : collapseQuarterStarts(slots, lessonDurationMinutes);
  return offered.filter(
    (slot) => !bookedLessons.some((lesson) => overlaps(slot.startAt, slot.endAt, lesson.startAt, lesson.endAt))
  );
}

/**
 * A painted stretch of quarters (08:00, 08:15, …) is one availability period.
 * The pupil gets whole lessons of the package length from the start of that
 * period, for example 08:00–10:00 and 10:00–12:00, and cannot shift the start.
 * One saved block, such as 09:15–11:15, stays that block.
 */
function collapseQuarterStarts(slots: Slot[], lessonDurationMinutes: number): Slot[] {
  const durationMs = lessonDurationMinutes * 60 * 1000;
  const quarterMs = SLOT_STEP_MINUTES * 60 * 1000;
  const unique = new Map<number, Slot>();
  for (const slot of slots) unique.set(slot.startAt.getTime(), slot);
  const sorted = [...unique.values()].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const groups: Slot[][] = [];
  for (const slot of sorted) {
    const last = groups[groups.length - 1];
    const previous = last?.[last.length - 1];
    if (previous && slot.startAt.getTime() - previous.startAt.getTime() === quarterMs) last.push(slot);
    else groups.push([slot]);
  }

  const blocks: Slot[] = [];
  for (const group of groups) {
    const first = group[0];
    if (group.length === 1) {
      blocks.push(first);
      continue;
    }
    const visualEnd = group[group.length - 1].startAt.getTime() + quarterMs;
    if (visualEnd - first.startAt.getTime() < durationMs) {
      blocks.push(first);
      continue;
    }
    for (let start = first.startAt.getTime(); start + durationMs <= visualEnd; start += durationMs) {
      blocks.push({ startAt: new Date(start), endAt: new Date(start + durationMs) });
    }
  }
  return blocks;
}
