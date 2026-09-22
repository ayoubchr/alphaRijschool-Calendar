import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";
import { GET } from "./route";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("GET /api/availability", () => {
  it("returns available slots for an instructor's weekly rule", async () => {
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await prisma.availabilityRule.create({ data: { instructorId: instructor.id, weekday: 1, startTime: "09:00", endTime: "13:00" } });

    const url = `http://localhost/api/availability?packageId=${pkg.id}&from=2026-09-28T00:00:00.000Z&to=2026-09-28T23:59:59.000Z`;
    const response = await GET(new Request(url) as any);
    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].instructorId).toBe(instructor.id);
    expect(body[0].slots).toHaveLength(2);
  });

  it("returns 400 when required params are missing", async () => {
    const response = await GET(new Request("http://localhost/api/availability") as any);
    expect(response.status).toBe(400);
  });

  it("excludes an instructor whose fixed transmission does not match the requested one", async () => {
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const automaatOnly = await prisma.instructor.create({ data: { name: "Automaat Jan", transmission: "AUTOMAAT" } });
    const manueelOnly = await prisma.instructor.create({ data: { name: "Manueel Piet", transmission: "MANUEEL" } });
    const both = await prisma.instructor.create({ data: { name: "Both Ella", transmission: "BOTH" } });
    for (const instructor of [automaatOnly, manueelOnly, both]) {
      await prisma.availabilityRule.create({ data: { instructorId: instructor.id, weekday: 1, startTime: "09:00", endTime: "13:00" } });
    }

    const url = `http://localhost/api/availability?packageId=${pkg.id}&from=2026-09-28T00:00:00.000Z&to=2026-09-28T23:59:59.000Z&transmission=MANUEEL`;
    const response = await GET(new Request(url) as any);
    const body = await response.json();

    const instructorIds = body.map((entry: any) => entry.instructorId);
    expect(instructorIds).toContain(manueelOnly.id);
    expect(instructorIds).toContain(both.id);
    expect(instructorIds).not.toContain(automaatOnly.id);
  });

  it("includes an AUTOMAAT-only instructor when AUTOMAAT is requested, and excludes MANUEEL-only", async () => {
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const automaatOnly = await prisma.instructor.create({ data: { name: "Automaat Jan", transmission: "AUTOMAAT" } });
    const manueelOnly = await prisma.instructor.create({ data: { name: "Manueel Piet", transmission: "MANUEEL" } });
    for (const instructor of [automaatOnly, manueelOnly]) {
      await prisma.availabilityRule.create({ data: { instructorId: instructor.id, weekday: 1, startTime: "09:00", endTime: "13:00" } });
    }

    const url = `http://localhost/api/availability?packageId=${pkg.id}&from=2026-09-28T00:00:00.000Z&to=2026-09-28T23:59:59.000Z&transmission=AUTOMAAT`;
    const response = await GET(new Request(url) as any);
    const body = await response.json();

    const instructorIds = body.map((entry: any) => entry.instructorId);
    expect(instructorIds).toContain(automaatOnly.id);
    expect(instructorIds).not.toContain(manueelOnly.id);
  });
});
