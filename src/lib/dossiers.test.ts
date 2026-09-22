import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./prisma";
import { resetDatabase } from "../test/resetDatabase";
import { findDossierByMagicLinkToken } from "./dossiers";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function createDossierWithLink(overrides: Partial<{ expiresAt: Date; usedAt: Date | null }> = {}) {
  const pkg = await prisma.package.create({
    data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500 },
  });
  const dossier = await prisma.dossier.create({
    data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 },
  });
  await prisma.magicLink.create({
    data: { dossierId: dossier.id, token: "abc123", expiresAt: overrides.expiresAt ?? new Date(Date.now() + 3600_000), usedAt: overrides.usedAt ?? null },
  });
  return dossier;
}

describe("findDossierByMagicLinkToken", () => {
  it("returns the dossier for a valid token", async () => {
    const dossier = await createDossierWithLink();
    const found = await findDossierByMagicLinkToken("abc123");
    expect(found?.id).toBe(dossier.id);
  });

  it("returns null for an expired token", async () => {
    await createDossierWithLink({ expiresAt: new Date(Date.now() - 3600_000) });
    expect(await findDossierByMagicLinkToken("abc123")).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    expect(await findDossierByMagicLinkToken("does-not-exist")).toBeNull();
  });
});
