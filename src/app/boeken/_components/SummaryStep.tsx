"use client";

import { useState } from "react";
import type { PackageDTO } from "./PackageStep";
import type { BookingSlot } from "./CalendarStep";
import type { BookingDetails } from "./DetailsStep";

interface SummaryStepProps {
  selectedPackage: PackageDTO;
  transmission: "AUTOMAAT" | "MANUEEL";
  slot: BookingSlot;
  details: BookingDetails;
  onBack: () => void;
}

export function SummaryStep({ selectedPackage, transmission, slot, details, onBack }: SummaryStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          transmission,
          instructorId: slot.instructorId,
          slots: [{ startAt: slot.startAt, endAt: slot.endAt }],
          details,
        }),
      });

      if (!response.ok) throw new Error("Boeking mislukt, probeer opnieuw.");

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Samenvatting</h1>
      <p><strong>Pakket:</strong> {selectedPackage.name} ({transmission === "AUTOMAAT" ? "automaat" : "manueel"})</p>
      <p><strong>Lesmoment:</strong> {new Date(slot.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })}</p>
      <p><strong>Naam:</strong> {details.firstName} {details.lastName}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="mt-6 flex items-start gap-2">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span className="text-sm">Ik ga akkoord met de algemene voorwaarden en het reglement van Alpha Rijschool.</span>
      </label>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={!accepted || submitting}
          onClick={handleConfirm}
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? "Bezig..." : "Bevestig en betaal voorschot"}
        </button>
      </div>
    </div>
  );
}
