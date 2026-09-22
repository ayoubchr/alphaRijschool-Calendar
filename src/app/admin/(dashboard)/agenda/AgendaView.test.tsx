import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendaView } from "./AgendaView";

describe("AgendaView", () => {
  it("lists each lesson with student, instructor and status", () => {
    render(
      <AgendaView
        lessons={[
          {
            id: "l1",
            startAt: new Date("2026-09-28T09:00:00Z"),
            endAt: new Date("2026-09-28T11:00:00Z"),
            status: "CONFIRMED",
            dossier: { firstName: "Jan", lastName: "Jansen" },
            instructor: { name: "Piet" },
          },
        ]}
      />
    );
    expect(screen.getByText(/Jan Jansen/)).toBeInTheDocument();
    expect(screen.getByText("Piet")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
  });
});
