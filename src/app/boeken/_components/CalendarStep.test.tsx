import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CalendarStep } from "./CalendarStep";

vi.mock("@/components/LessonCalendar", () => ({
  LessonCalendar: ({ slots, onSelectSlot }: any) => (
    <button onClick={() => onSelectSlot(slots[0])}>Kies eerste slot ({slots.length})</button>
  ),
}));

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve([
        { instructorId: "i1", instructorName: "Jan", slots: [{ startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }] },
      ]),
  }) as any;
});

describe("CalendarStep", () => {
  it("loads slots and confirms the chosen one", async () => {
    const onConfirm = vi.fn();
    render(<CalendarStep packageId="p1" onConfirm={onConfirm} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/Kies eerste slot/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Kies eerste slot/));
    fireEvent.click(screen.getByText("Volgende"));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ instructorId: "i1", instructorName: "Jan" })
    );
  });
});
