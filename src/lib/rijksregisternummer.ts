// A Belgian rijksregisternummer is 11 digits, often written with dot/dash separators
// (e.g. "85.07.30-033.28"). This is a basic format check only — it does not validate the
// checksum/date-of-birth encoding rules, just that the value plausibly is one.
const ALLOWED_CHARACTERS = /^[0-9.\-]+$/;

/**
 * Strips optional `.`/`-` separators and returns the 11 remaining digits, or null if the value
 * doesn't reduce to exactly 11 digits (or contains characters other than digits/separators).
 */
export function normalizeRijksregisternummer(value: string): string | null {
  const trimmed = value.trim();
  if (!ALLOWED_CHARACTERS.test(trimmed)) return null;
  const digits = trimmed.replace(/[.\-]/g, "");
  return digits.length === 11 ? digits : null;
}

export function isValidRijksregisternummer(value: string): boolean {
  return normalizeRijksregisternummer(value) !== null;
}
