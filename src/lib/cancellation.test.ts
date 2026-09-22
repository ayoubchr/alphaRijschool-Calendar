import { describe, it, expect } from "vitest";
import { canCancelWithRefund } from "./cancellation";

describe("canCancelWithRefund", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("is true when more than 48 hours before the lesson", () => {
    const lessonStart = new Date("2026-01-04T00:00:01Z");
    expect(canCancelWithRefund(lessonStart, now)).toBe(true);
  });

  it("is false when less than 48 hours before the lesson", () => {
    const lessonStart = new Date("2026-01-02T00:00:00Z");
    expect(canCancelWithRefund(lessonStart, now)).toBe(false);
  });
});
