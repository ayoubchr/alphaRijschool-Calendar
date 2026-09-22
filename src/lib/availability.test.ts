import { describe, it, expect } from "vitest";
import { computeAvailableSlots } from "./availability";

describe("computeAvailableSlots", () => {
  it("generates 2-hour slots within a single availability window", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "13:00" }],
      exceptions: [],
      bookedLessons: [],
      rangeStart: new Date("2026-09-28T00:00:00"), // maandag
      rangeEnd: new Date("2026-09-28T23:59:59"),
      lessonDurationMinutes: 120,
    });
    expect(slots).toHaveLength(2);
    expect(slots[0].startAt.getHours()).toBe(9);
    expect(slots[1].startAt.getHours()).toBe(11);
  });

  it("excludes slots that overlap an existing booking", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "13:00" }],
      exceptions: [],
      bookedLessons: [{ startAt: new Date("2026-09-28T09:00:00"), endAt: new Date("2026-09-28T11:00:00") }],
      rangeStart: new Date("2026-09-28T00:00:00"),
      rangeEnd: new Date("2026-09-28T23:59:59"),
      lessonDurationMinutes: 120,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].startAt.getHours()).toBe(11);
  });

  it("respects a weekday filter", () => {
    const slots = computeAvailableSlots({
      rules: [
        { weekday: 1, startTime: "09:00", endTime: "11:00" },
        { weekday: 2, startTime: "09:00", endTime: "11:00" },
      ],
      exceptions: [],
      bookedLessons: [],
      rangeStart: new Date("2026-09-28T00:00:00"),
      rangeEnd: new Date("2026-09-29T23:59:59"),
      lessonDurationMinutes: 120,
      weekdayFilter: [1],
    });
    expect(slots).toHaveLength(1);
  });

  it("blocks a day fully covered by an unavailable exception", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      exceptions: [{ date: "2026-09-28", startTime: "00:00", endTime: "23:59", isAvailable: false }],
      bookedLessons: [],
      rangeStart: new Date("2026-09-28T00:00:00"),
      rangeEnd: new Date("2026-09-28T23:59:59"),
      lessonDurationMinutes: 120,
    });
    expect(slots).toHaveLength(0);
  });
});
