"use client";

import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/money";

export interface PackageDTO {
  id: string;
  name: string;
  description: string;
  hours: number;
  priceAutomaat: number;
  priceManueel: number;
  registrationFee: number;
  isSingleLesson: boolean;
}

interface PackageStepProps {
  selectedPackageId: string | null;
  onPackagesLoaded: (packages: PackageDTO[]) => void;
  onSelect: (pkg: PackageDTO) => void;
}

export function PackageStep({ selectedPackageId, onPackagesLoaded, onSelect }: PackageStepProps) {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data: PackageDTO[]) => {
        setPackages(data);
        setLoading(false);
        onPackagesLoaded(data);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ed1c24]/20 border-t-[#ed1c24]" role="status" aria-label="Pakketten laden" />
        <p className="text-sm text-[#58595b]">Pakketten laden…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Kies je pakket</h1>
      <p className="mb-6 text-sm text-[#58595b]">Kies het pakket dat bij je past.</p>
      <ul className="grid gap-4">
        {packages.map((pkg) => {
          const selected = pkg.id === selectedPackageId;
          return (
          <li key={pkg.id}>
            <button
              onClick={() => onSelect(pkg)}
              aria-pressed={selected}
              className={`w-full rounded-[10px] border bg-white p-5 text-left shadow-sm transition hover:border-[#ed1c24] hover:shadow-md ${
                selected ? "border-[#ed1c24] ring-2 ring-[#ed1c24]" : "border-black/10"
              }`}
            >
              {selected && <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#ed1c24]">Geselecteerd</span>}
              <span className="block text-lg font-extrabold text-[#111827]">{pkg.name}</span>
              <span className="mt-1 block text-sm leading-relaxed text-[#58595b]">{pkg.description}</span>
              <span className="mt-4 block space-y-2 rounded-lg bg-[#f9fafb] p-4 text-sm">
                <span className="flex items-center justify-between">
                  <span className="font-semibold text-[#111827]">Automaat</span>
                  <span className="font-bold text-[#111827]">{formatEuro(pkg.priceAutomaat)}</span>
                </span>
                <span className="flex items-center justify-between">
                  <span className="font-semibold text-[#111827]">Manueel</span>
                  <span className="font-bold text-[#111827]">{formatEuro(pkg.priceManueel)}</span>
                </span>
                <span className="flex items-center justify-between border-t border-black/10 pt-2 text-xs text-[#58595b]">
                  <span>Inschrijvingskosten</span>
                  <span className="font-semibold">+ {formatEuro(pkg.registrationFee)}</span>
                </span>
              </span>
            </button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
