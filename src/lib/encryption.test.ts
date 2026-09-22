import { describe, it, expect, beforeAll } from "vitest";
import { encryptField, decryptField } from "./encryption";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
});

describe("encryptField / decryptField", () => {
  it("round-trips a value", () => {
    const encrypted = encryptField("85073003328");
    expect(decryptField(encrypted)).toBe("85073003328");
  });

  it("produces different ciphertext for the same input each time", () => {
    const a = encryptField("85073003328");
    const b = encryptField("85073003328");
    expect(a).not.toBe(b);
  });

  it("throws when the ciphertext has been tampered with", () => {
    const encrypted = encryptField("85073003328");
    const [iv, authTag, data] = encrypted.split(":");
    const tamperedData = data.slice(0, -2) + (data.slice(-2) === "00" ? "01" : "00");
    const tampered = [iv, authTag, tamperedData].join(":");
    expect(() => decryptField(tampered)).toThrow();
  });
});
