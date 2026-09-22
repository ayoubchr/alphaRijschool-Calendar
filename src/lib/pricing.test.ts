import { describe, it, expect } from "vitest";
import { packagePrice, depositAmount } from "./pricing";

const pkg = { priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500 };

describe("packagePrice", () => {
  it("adds the registration fee to the automaat price", () => {
    expect(packagePrice(pkg, "AUTOMAAT")).toBe(18500);
  });
  it("adds the registration fee to the manueel price", () => {
    expect(packagePrice(pkg, "MANUEEL")).toBe(17500);
  });
});

describe("depositAmount", () => {
  it("equals the single lesson price without the registration fee", () => {
    expect(depositAmount(pkg, "AUTOMAAT")).toBe(16000);
    expect(depositAmount(pkg, "MANUEEL")).toBe(15000);
  });
});
