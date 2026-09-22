import { describe, it, expect } from "vitest";
import { isValidRijksregisternummer, normalizeRijksregisternummer } from "./rijksregisternummer";

describe("rijksregisternummer", () => {
  it("accepts a plain 11-digit number", () => {
    expect(isValidRijksregisternummer("85073003328")).toBe(true);
    expect(normalizeRijksregisternummer("85073003328")).toBe("85073003328");
  });

  it("accepts the conventional dotted/dashed format and normalizes it to 11 digits", () => {
    expect(isValidRijksregisternummer("85.07.30-033.28")).toBe(true);
    expect(normalizeRijksregisternummer("85.07.30-033.28")).toBe("85073003328");
  });

  it("rejects a value with too few or too many digits", () => {
    expect(isValidRijksregisternummer("8507300332")).toBe(false);
    expect(isValidRijksregisternummer("850730033281")).toBe(false);
  });

  it("rejects non-numeric or garbage input", () => {
    expect(isValidRijksregisternummer("not-a-number")).toBe(false);
    expect(isValidRijksregisternummer("")).toBe(false);
  });
});
