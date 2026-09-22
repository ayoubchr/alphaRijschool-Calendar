import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the hero heading and a link to the booking wizard", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Welkom bij Alpha Rijschool/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Boek een les/i })).toHaveAttribute("href", "/boeken");
  });
});
