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
});
