import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

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

export interface DepositBreakdown {
  lessonLabel: string;
  lessonAmount: number;
  registrationFee: number;
  total: number;
}

/**
 * What the student pays now: the first 2-hour lesson, plus the registration fee.
 * A practical exam has no lesson hours, so that part is half the package price.
 */
export function depositBreakdown(pkg: PackageLike, transmission: Transmission): DepositBreakdown {
  const base = transmissionPrice(pkg, transmission);
  const lessonAmount =
    pkg.hours > 0
      ? Math.round((base / pkg.hours) * Math.min(LESSON_BLOCK_MINUTES / 60, pkg.hours))
      : Math.round(base / 2);
  return {
    lessonLabel: pkg.hours > 0 ? "Eerste les" : "Praktijkexamen",
    lessonAmount,
    registrationFee: pkg.registrationFee,
    total: lessonAmount + pkg.registrationFee,
  };
}

export function depositAmount(pkg: PackageLike, transmission: Transmission): number {
  return depositBreakdown(pkg, transmission).total;
}
