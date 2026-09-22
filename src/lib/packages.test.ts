import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./prisma";
import { resetDatabase } from "../test/resetDatabase";
import { getActivePackages, getSingleLessonPackage } from "./packages";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("getActivePackages", () => {
  it("returns only active packages", async () => {
    await prisma.package.create({ data: { name: "Actief", description: "x", hours: 1, priceAutomaat: 100, priceManueel: 100, registrationFee: 0, active: true } });
    await prisma.package.create({ data: { name: "Inactief", description: "x", hours: 1, priceAutomaat: 100, priceManueel: 100, registrationFee: 0, active: false } });

    const packages = await getActivePackages();
    expect(packages).toHaveLength(1);
    expect(packages[0].name).toBe("Actief");
  });
});

describe("getSingleLessonPackage", () => {
  it("throws when no single-lesson package is configured", async () => {
    await expect(getSingleLessonPackage()).rejects.toThrow();
  });

  it("returns the package flagged as single lesson", async () => {
    await prisma.package.create({ data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true } });
    const pkg = await getSingleLessonPackage();
    expect(pkg.name).toBe("Losse Rijles");
  });
});
