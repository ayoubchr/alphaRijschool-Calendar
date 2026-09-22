import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonCalendar } from "./LessonCalendar";

describe("LessonCalendar", () => {
  it("renders one event per slot and reports a click", () => {
    const onSelectSlot = vi.fn();
    const slots = [
      { startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" },
      { startAt: "2026-09-28T11:00:00.000Z", endAt: "2026-09-28T13:00:00.000Z" },
    ];

    render(<LessonCalendar slots={slots} selectedSlot={null} onSelectSlot={onSelectSlot} />);

    const events = screen.getAllByText("Beschikbaar");
    expect(events).toHaveLength(2);

    fireEvent.click(events[0]);
    expect(onSelectSlot).toHaveBeenCalledWith(slots[0]);
  });
});
