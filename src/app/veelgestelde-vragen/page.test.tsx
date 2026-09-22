import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FaqPage from "./page";

describe("FaqPage", () => {
  it("renders at least one question", () => {
    render(<FaqPage />);
    expect(screen.getByText(/M12/)).toBeInTheDocument();
  });
});
