"use client";

import { useEffect, useState } from "react";

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
  preselectedPackageId: string | null;
  onSelect: (pkg: PackageDTO) => void;
}

export function PackageStep({ preselectedPackageId, onSelect }: PackageStepProps) {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data: PackageDTO[]) => {
        setPackages(data);
        setLoading(false);
        const preselected = data.find((p) => p.id === preselectedPackageId);
        if (preselected) onSelect(preselected);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPackageId]);

  if (loading) return <p>Pakketten laden...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kies je pakket</h1>
      <ul className="space-y-4">
        {packages.map((pkg) => (
          <li key={pkg.id}>
            <button onClick={() => onSelect(pkg)} className="w-full rounded-lg border p-4 text-left hover:border-red-600">
              <span className="block font-semibold">{pkg.name}</span>
              <span className="block text-sm text-gray-600">{pkg.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
