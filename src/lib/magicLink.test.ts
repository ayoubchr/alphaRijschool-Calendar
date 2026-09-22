import { describe, it, expect } from "vitest";
import { generateMagicLinkToken, magicLinkExpiryDate, isMagicLinkValid, MAGIC_LINK_TTL_HOURS } from "./magicLink";

describe("generateMagicLinkToken", () => {
  it("produces a 64-character hex string, different each time", () => {
    const a = generateMagicLinkToken();
    const b = generateMagicLinkToken();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("magicLinkExpiryDate", () => {
  it("is TTL hours after now", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = magicLinkExpiryDate(now);
    expect(expiry.getTime() - now.getTime()).toBe(MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000);
  });
});

describe("isMagicLinkValid", () => {
  const now = new Date("2026-01-02T00:00:00Z");
  it("is false when already used", () => {
    expect(isMagicLinkValid({ expiresAt: new Date("2026-01-03T00:00:00Z"), usedAt: now }, now)).toBe(false);
  });
  it("is false when expired", () => {
    expect(isMagicLinkValid({ expiresAt: new Date("2026-01-01T00:00:00Z"), usedAt: null }, now)).toBe(false);
  });
  it("is true when unused and not expired", () => {
    expect(isMagicLinkValid({ expiresAt: new Date("2026-01-03T00:00:00Z"), usedAt: null }, now)).toBe(true);
  });
});
