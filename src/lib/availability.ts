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

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToDate(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(0, minutes, 0, 0);
  return d;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function toIsoDate(day: Date): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

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

  for (const day = new Date(rangeStart); day <= rangeEnd; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekdayFilter && weekdayFilter.length > 0 && !weekdayFilter.includes(weekday)) {
      continue;
    }

    const isoDate = toIsoDate(day);
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
        const slotStart = minutesToDate(day, slotStartMin);
        const slotEnd = minutesToDate(day, slotStartMin + lessonDurationMinutes);
        if (slotStart < rangeStart || slotEnd > rangeEnd) continue;

        const blockedByException = dayExceptions.some(
          (e) =>
            !e.isAvailable &&
            overlaps(
              slotStart, slotEnd,
              minutesToDate(day, parseTimeToMinutes(e.startTime)),
              minutesToDate(day, parseTimeToMinutes(e.endTime))
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
