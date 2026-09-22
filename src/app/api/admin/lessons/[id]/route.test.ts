import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { role: "ADMIN" } }),
}));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function setupLesson(startAt: Date) {
  const pkg = await prisma.package.create({ data: { name: "x", description: "x", hours: 2, priceAutomaat: 100, priceManueel: 100, registrationFee: 0 } });
  const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
  const dossier = await prisma.dossier.create({ data: { email: "x@example.com", firstName: "x", lastName: "x", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 } });
  const lesson = await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt, endAt: new Date(startAt.getTime() + 2 * 3600_000), status: "PLANNED" } });
  return lesson;
}

describe("PATCH /api/admin/lessons/[id]", () => {
  it("confirms a planned lesson", async () => {
    const lesson = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "confirm" }) }) as any, { params: { id: lesson.id } });
    expect(response.status).toBe(200);
    const updated = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
    expect(updated.status).toBe("CONFIRMED");
  });

  it("cancels a lesson booked more than 48 hours out", async () => {
    const lesson = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }) as any, { params: { id: lesson.id } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.refundEligible).toBe(true);
  });

  it("reports no refund when cancelling within 48 hours", async () => {
    const lesson = await setupLesson(new Date(Date.now() + 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }) as any, { params: { id: lesson.id } });
    const body = await response.json();
    expect(body.refundEligible).toBe(false);
  });

  it("rejects an unauthenticated request", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const lesson = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "confirm" }) }) as any, { params: { id: lesson.id } });
    expect(response.status).toBe(401);
  });
});
