import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OverOnsPage from "./page";

describe("OverOnsPage", () => {
  it("renders the page heading", () => {
    render(<OverOnsPage />);
    expect(screen.getByRole("heading", { name: "Over ons" })).toBeInTheDocument();
  });
});
