"use client";

import { formatEuro } from "@/lib/money";
import type { PackageDTO } from "./PackageStep";

interface TransmissionStepProps {
  selectedPackage: PackageDTO;
  onSelect: (transmission: "AUTOMAAT" | "MANUEEL") => void;
  onBack: () => void;
}

export function TransmissionStep({ selectedPackage, onSelect, onBack }: TransmissionStepProps) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Kies je transmissie</h1>
      <p className="mb-6 text-sm text-[#58595b]">{selectedPackage.name}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => onSelect("AUTOMAAT")} className="rounded-[10px] border border-black/10 bg-white p-6 text-left shadow-sm transition hover:border-[#ed1c24] hover:shadow-md">
          <span className="block text-lg font-extrabold">Automaat</span>
          <span className="mt-2 block text-2xl font-bold text-[#ed1c24]">{formatEuro(selectedPackage.priceAutomaat)}</span>
        </button>
        <button onClick={() => onSelect("MANUEEL")} className="rounded-[10px] border border-black/10 bg-white p-6 text-left shadow-sm transition hover:border-[#ed1c24] hover:shadow-md">
          <span className="block text-lg font-extrabold">Manueel</span>
          <span className="mt-2 block text-2xl font-bold text-[#ed1c24]">{formatEuro(selectedPackage.priceManueel)}</span>
        </button>
      </div>
      <button onClick={onBack} className="mt-6 text-sm text-gray-500">&larr; Terug</button>
    </div>
  );
}
