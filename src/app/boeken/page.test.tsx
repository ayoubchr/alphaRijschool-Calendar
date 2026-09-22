import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

vi.mock("./_components/PackageStep", () => ({
  PackageStep: ({ onSelect }: any) => (
    <button onClick={() => onSelect({ id: "p1", name: "Pakket 1", isSingleLesson: true, priceAutomaat: 100, priceManueel: 100 })}>
      Kies pakket 1
    </button>
  ),
}));
vi.mock("./_components/TransmissionStep", () => ({
  TransmissionStep: ({ onSelect }: any) => <button onClick={() => onSelect("AUTOMAAT")}>Kies automaat</button>,
}));

import BookingWizardPage from "./page";

describe("BookingWizardPage", () => {
  it("moves from the package step to the transmission step", () => {
    render(<BookingWizardPage />);
    fireEvent.click(screen.getByText("Kies pakket 1"));
    expect(screen.getByText("Kies automaat")).toBeInTheDocument();
  });
});
