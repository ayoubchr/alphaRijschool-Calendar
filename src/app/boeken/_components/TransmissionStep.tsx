"use client";

import type { PackageDTO } from "./PackageStep";

interface TransmissionStepProps {
  selectedPackage: PackageDTO;
  onSelect: (transmission: "AUTOMAAT" | "MANUEEL") => void;
  onBack: () => void;
}

export function TransmissionStep({ selectedPackage, onSelect, onBack }: TransmissionStepProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kies je transmissie</h1>
      <div className="flex gap-4">
        <button onClick={() => onSelect("AUTOMAAT")} className="flex-1 rounded-lg border p-4 hover:border-red-600">
          Automaat &mdash; &euro;{(selectedPackage.priceAutomaat / 100).toFixed(2)}
        </button>
        <button onClick={() => onSelect("MANUEEL")} className="flex-1 rounded-lg border p-4 hover:border-red-600">
          Manueel &mdash; &euro;{(selectedPackage.priceManueel / 100).toFixed(2)}
        </button>
      </div>
      <button onClick={onBack} className="mt-6 text-sm text-gray-500">&larr; Terug</button>
    </div>
  );
}
