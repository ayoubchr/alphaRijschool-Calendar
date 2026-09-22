import { randomBytes } from "crypto";

export const MAGIC_LINK_TTL_HOURS = 24;

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString("hex");
}

export function magicLinkExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000);
}

export function isMagicLinkValid(
  link: { expiresAt: Date; usedAt: Date | null },
  now: Date = new Date()
): boolean {
  if (link.usedAt) return false;
  return link.expiresAt > now;
}
