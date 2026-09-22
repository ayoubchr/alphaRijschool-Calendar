import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { BookingsView } from "./BookingsView";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const baseLesson = {
  id: "lesson1",
  startAt: new Date("2026-09-28T09:00:00.000Z"),
  endAt: new Date("2026-09-28T11:00:00.000Z"),
  status: "PLANNED",
  dossier: { firstName: "Jan", lastName: "Jansen" },
  instructor: { name: "Piet" },
};

describe("BookingsView", () => {
  it("shows a refund-restored notice when cancelling a refund-eligible lesson", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "CANCELLED", refundEligible: true }),
      })
    );

    render(<BookingsView lessons={[baseLesson]} />);
    fireEvent.click(screen.getByText("Annuleren"));

    await waitFor(() => expect(screen.getByText(/tegoed hersteld/i)).toBeInTheDocument());
  });

  it("shows a deposit-forfeited notice when cancelling a non-refund-eligible lesson", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "CANCELLED", refundEligible: false }),
      })
    );

    render(<BookingsView lessons={[baseLesson]} />);
    fireEvent.click(screen.getByText("Annuleren"));

    await waitFor(() => expect(screen.getByText(/voorschot vervalt/i)).toBeInTheDocument());
  });
});
