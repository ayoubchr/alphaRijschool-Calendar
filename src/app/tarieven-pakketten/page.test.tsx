import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/packages", () => ({
  getActivePackages: vi.fn().mockResolvedValue([
    { id: "p1", name: "20-Uur Pakket", description: "Basisopleiding.", hours: 20, priceAutomaat: 155000, priceManueel: 145000, registrationFee: 2500, isSingleLesson: false },
  ]),
}));

describe("TarievenPakkettenPage", () => {
  it("lists each package with a booking link carrying its id", async () => {
    const { default: TarievenPakkettenPage } = await import("./page");
    render(await TarievenPakkettenPage());

    expect(screen.getByText("20-Uur Pakket")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Schrijf je nu in/i })).toHaveAttribute("href", "/boeken?package=p1");
  });
});
