import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SummaryStep } from "./SummaryStep";

const pkg = { id: "p1", name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true };
const slot = { startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z", instructorId: "i1", instructorName: "Jan" };
const details = { firstName: "Jan", lastName: "Jansen", email: "jan@example.com", phone: "x", address: "x", dateOfBirth: "2000-01-01" };

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ checkoutUrl: "https://mollie.test/pay/tr_1" }) }) as any;
  delete (window as any).location;
  (window as any).location = { href: "" };
});

afterEach(() => {
  cleanup();
});

describe("SummaryStep", () => {
  it("requires accepting the terms before confirming", () => {
    render(<SummaryStep selectedPackage={pkg} transmission="AUTOMAAT" slot={slot} details={details} onBack={vi.fn()} />);
    expect(screen.getByText(/Bevestig en betaal voorschot/)).toBeDisabled();
  });

  it("posts the booking and redirects to the checkout URL once confirmed", async () => {
    render(<SummaryStep selectedPackage={pkg} transmission="AUTOMAAT" slot={slot} details={details} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText(/Bevestig en betaal voorschot/));

    await waitFor(() => expect(window.location.href).toBe("https://mollie.test/pay/tr_1"));
    expect(fetch).toHaveBeenCalledWith("/api/bookings", expect.objectContaining({ method: "POST" }));
  });
});
