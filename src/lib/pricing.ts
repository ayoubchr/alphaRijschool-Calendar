export type Transmission = "AUTOMAAT" | "MANUEEL";

export interface PackageLike {
  hours: number;
  priceAutomaat: number;
  priceManueel: number;
  registrationFee: number;
}

function transmissionPrice(pkg: PackageLike, transmission: Transmission): number {
  return transmission === "AUTOMAAT" ? pkg.priceAutomaat : pkg.priceManueel;
}

export function packagePrice(pkg: PackageLike, transmission: Transmission): number {
  return transmissionPrice(pkg, transmission) + pkg.registrationFee;
}

/**
 * Deposit in cents: package price per hour, plus the registration fee.
 * A practical exam has no lesson hours, so its deposit is half the package price plus the fee.
 */
export function depositAmount(pkg: PackageLike, transmission: Transmission): number {
  const base = transmissionPrice(pkg, transmission);
  const divisor = pkg.hours > 0 ? pkg.hours : 2;
  return Math.round(base / divisor) + pkg.registrationFee;
}
