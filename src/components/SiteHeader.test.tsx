import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("shows the brand name and a link to the booking wizard", () => {
    render(<SiteHeader />);
    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Boek Nu/i })).toHaveAttribute("href", "/boeken");
  });
});
