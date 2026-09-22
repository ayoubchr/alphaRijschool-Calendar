import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";
import { getDossierOverview } from "./dossierQuery";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("getDossierOverview", () => {
  it("includes package name and payment status", async () => {
    const pkg = await prisma.package.create({ data: { name: "20-Uur Pakket", description: "x", hours: 20, priceAutomaat: 100, priceManueel: 100, registrationFee: 0 } });
    const dossier = await prisma.dossier.create({ data: { email: "x@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 18 } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_1", amount: 16000, type: "DEPOSIT", status: "PAID" } });

    const overview = await getDossierOverview();
    expect(overview[0].package.name).toBe("20-Uur Pakket");
    expect(overview[0].payments[0].status).toBe("PAID");
  });
});
