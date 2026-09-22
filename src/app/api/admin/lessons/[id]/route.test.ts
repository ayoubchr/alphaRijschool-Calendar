import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { role: "ADMIN" } }),
}));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function setupLesson(startAt: Date, hoursRemaining = 2) {
  const pkg = await prisma.package.create({ data: { name: "x", description: "x", hours: 2, priceAutomaat: 100, priceManueel: 100, registrationFee: 0 } });
  const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
  const dossier = await prisma.dossier.create({ data: { email: "x@example.com", firstName: "x", lastName: "x", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining } });
  const lesson = await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt, endAt: new Date(startAt.getTime() + 2 * 3600_000), status: "PLANNED" } });
  return { lesson, dossier, instructor };
}

describe("PATCH /api/admin/lessons/[id]", () => {
  it("confirms a planned lesson", async () => {
    const { lesson } = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "confirm" }) }) as any, { params: { id: lesson.id } });
    expect(response.status).toBe(200);
    const updated = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
    expect(updated.status).toBe("CONFIRMED");
  });

  it("cancels a lesson booked more than 48 hours out and restores hoursRemaining", async () => {
    const { lesson, dossier } = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000), 2);
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }) as any, { params: { id: lesson.id } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.refundEligible).toBe(true);

    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    expect(updatedDossier.hoursRemaining).toBe(4);
  });

  it("reports no refund when cancelling within 48 hours and does not restore hoursRemaining", async () => {
    const { lesson, dossier } = await setupLesson(new Date(Date.now() + 3600_000), 2);
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }) as any, { params: { id: lesson.id } });
    const body = await response.json();
    expect(body.refundEligible).toBe(false);

    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    expect(updatedDossier.hoursRemaining).toBe(2);
  });

  it("rejects an unauthenticated request", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const { lesson } = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "confirm" }) }) as any, { params: { id: lesson.id } });
    expect(response.status).toBe(401);
  });

  it("reschedules a lesson to a free slot", async () => {
    const { lesson } = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const newStart = new Date(Date.now() + 8 * 24 * 3600_000);
    const newEnd = new Date(newStart.getTime() + 2 * 3600_000);
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "reschedule", startAt: newStart.toISOString(), endAt: newEnd.toISOString() }),
      }) as any,
      { params: { id: lesson.id } }
    );
    expect(response.status).toBe(200);
  });

  it("returns 409 when rescheduling onto a slot that overlaps another lesson for the same instructor", async () => {
    const { lesson, instructor, dossier } = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const conflictStart = new Date(Date.now() + 9 * 24 * 3600_000);
    const conflictEnd = new Date(conflictStart.getTime() + 2 * 3600_000);
    await prisma.lesson.create({
      data: {
        dossierId: dossier.id, instructorId: instructor.id, packageId: dossier.packageId!,
        startAt: conflictStart, endAt: conflictEnd, status: "PLANNED",
      },
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "reschedule", startAt: conflictStart.toISOString(), endAt: conflictEnd.toISOString() }),
      }) as any,
      { params: { id: lesson.id } }
    );
    expect(response.status).toBe(409);
  });

  it("does not report a non-overlap reschedule failure as a false 409 (previously an un-narrowed catch-all)", async () => {
    // The reschedule action previously used a bare `catch { return 409 }`, which would
    // incorrectly report ANY failure (a reversed-time request, a dropped connection, a record
    // that no longer exists, etc.) as a false "slot taken" conflict. It must now apply the same
    // narrowing already used (and tested) for the bookings and dossier-lessons routes: only the
    // Postgres overlap-exclusion violation (P2039 / 23P01) becomes a 409; anything else
    // propagates as a genuine error.
    const { lesson } = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");

    const updateSpy = vi.spyOn(prisma.lesson, "update").mockRejectedValueOnce(new Error("connection reset"));

    const newStart = new Date(Date.now() + 8 * 24 * 3600_000);
    const newEnd = new Date(newStart.getTime() + 2 * 3600_000);
    await expect(
      PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ action: "reschedule", startAt: newStart.toISOString(), endAt: newEnd.toISOString() }),
        }) as any,
        { params: { id: lesson.id } }
      )
    ).rejects.toThrow(/connection reset/);

    updateSpy.mockRestore();
  });
});
