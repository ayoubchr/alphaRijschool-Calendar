import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransmissionStep } from "./TransmissionStep";

const pkg = { id: "p1", name: "Pakket 1", description: "x", hours: 10, priceAutomaat: 10000, priceManueel: 9000, registrationFee: 2500, isSingleLesson: false };

describe("TransmissionStep", () => {
  it("reports the chosen transmission with its price", () => {
    const onSelect = vi.fn();
    render(<TransmissionStep selectedPackage={pkg} onSelect={onSelect} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText(/Automaat/));
    expect(onSelect).toHaveBeenCalledWith("AUTOMAAT");
  });
});
