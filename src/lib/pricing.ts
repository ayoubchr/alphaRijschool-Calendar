export type Transmission = "AUTOMAAT" | "MANUEEL";

export interface PackageLike {
  priceAutomaat: number;
  priceManueel: number;
  registrationFee: number;
}

export function packagePrice(pkg: PackageLike, transmission: Transmission): number {
  const base = transmission === "AUTOMAAT" ? pkg.priceAutomaat : pkg.priceManueel;
  return base + pkg.registrationFee;
}

export function depositAmount(singleLessonPackage: PackageLike, transmission: Transmission): number {
  return transmission === "AUTOMAAT" ? singleLessonPackage.priceAutomaat : singleLessonPackage.priceManueel;
}
