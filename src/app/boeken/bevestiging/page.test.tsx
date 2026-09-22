import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import BevestigingPage from "./page";

afterEach(() => cleanup());

describe("BevestigingPage", () => {
  it("renders a thank-you message referencing the confirmation email", () => {
    render(<BevestigingPage searchParams={{ dossier: "dossier123" }} />);
    expect(screen.getByRole("heading", { name: /bedankt/i })).toBeInTheDocument();
    expect(screen.getByText(/bevestigingsmail/i)).toBeInTheDocument();
    expect(screen.getByText(/dossier123/)).toBeInTheDocument();
  });

  it("renders without a dossier query param", () => {
    render(<BevestigingPage searchParams={{}} />);
    expect(screen.getByRole("heading", { name: /bedankt/i })).toBeInTheDocument();
  });
});
