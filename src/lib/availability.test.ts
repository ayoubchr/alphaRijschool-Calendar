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

  it("anchors slot times to Brussels wall-clock (CEST, UTC+2) regardless of the server process's own timezone", () => {
    // Node reads `process.env.TZ` once at startup, so this test can't flip the process timezone
    // mid-run to fully simulate a UTC server. Instead it asserts against the absolute UTC instant
    // (toISOString()) rather than local getters like getHours() — this is the part of the contract
    // that must NOT depend on the server's local timezone. If computeAvailableSlots regressed to
    // naive setHours()/getDay() (which read/write in the server's local timezone), this assertion
    // would only happen to pass on a machine whose local timezone is already Europe/Brussels, and
    // would silently produce times 1-2 hours off on a UTC (e.g. Vercel) server.
    //
    // Manual verification: running `TZ=UTC npx vitest run src/lib/availability.test.ts` should
    // produce identical results to the default run, since the implementation no longer reads the
    // server's local timezone at all.
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      exceptions: [],
      bookedLessons: [],
      // A Monday in September (CEST, UTC+2 in Brussels), expressed as unambiguous UTC instants
      // spanning the full Brussels calendar day so this test doesn't depend on local parsing.
      rangeStart: new Date("2026-09-27T22:00:00.000Z"), // 2026-09-28T00:00 Brussels (CEST)
      rangeEnd: new Date("2026-09-28T21:59:59.000Z"), // 2026-09-28T23:59:59 Brussels (CEST)
      lessonDurationMinutes: 120,
    });

    expect(slots).toHaveLength(1);
    // 09:00 Brussels wall-clock during CEST (UTC+2) must be 07:00 UTC, not 09:00 UTC.
    expect(slots[0].startAt.toISOString()).toBe("2026-09-28T07:00:00.000Z");
    expect(slots[0].endAt.toISOString()).toBe("2026-09-28T09:00:00.000Z");
  });

  it("anchors slot times to Brussels wall-clock (CET, UTC+1) in winter", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      exceptions: [],
      bookedLessons: [],
      // Monday 2026-01-05 is in CET (UTC+1) in Brussels.
      rangeStart: new Date("2026-01-04T23:00:00.000Z"), // 2026-01-05T00:00 Brussels (CET)
      rangeEnd: new Date("2026-01-05T22:59:59.000Z"), // 2026-01-05T23:59:59 Brussels (CET)
      lessonDurationMinutes: 120,
    });

    expect(slots).toHaveLength(1);
    // 09:00 Brussels wall-clock during CET (UTC+1) must be 08:00 UTC.
    expect(slots[0].startAt.toISOString()).toBe("2026-01-05T08:00:00.000Z");
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
