import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PackageStep } from "./PackageStep";

const packages = [
  { id: "p1", name: "Pakket 1", description: "Beschrijving 1", hours: 10, priceAutomaat: 100, priceManueel: 90, registrationFee: 25, isSingleLesson: false },
  { id: "p2", name: "Pakket 2", description: "Beschrijving 2", hours: 2, priceAutomaat: 160, priceManueel: 150, registrationFee: 25, isSingleLesson: true },
];

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(packages) }) as any;
});

describe("PackageStep", () => {
  it("lists fetched packages and reports a selection", async () => {
    const onSelect = vi.fn();
    render(<PackageStep preselectedPackageId={null} onSelect={onSelect} />);

    await waitFor(() => expect(screen.getByText("Pakket 1")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Pakket 1"));
    expect(onSelect).toHaveBeenCalledWith(packages[0]);
  });

  it("auto-selects the preselected package once loaded", async () => {
    const onSelect = vi.fn();
    render(<PackageStep preselectedPackageId="p2" onSelect={onSelect} />);
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(packages[1]));
  });
});
