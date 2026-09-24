"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEuro } from "@/lib/money";
import { depositAmount } from "@/lib/pricing";
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
      <h1 className="mb-6 text-2xl font-extrabold text-[#111827]">Samenvatting</h1>
      <div className="space-y-2 rounded-[10px] bg-[#f9f9f9] p-5 text-sm">
        <p><strong>Pakket:</strong> {selectedPackage.name} ({transmission === "AUTOMAAT" ? "automaat" : "manueel"})</p>
        <p><strong>Lesmoment:</strong> {new Date(slot.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })}</p>
        <p><strong>Instructeur:</strong> {slot.instructorName}</p>
        <p><strong>Naam:</strong> {details.firstName} {details.lastName}</p>
        <p><strong>Voorschot:</strong> {formatEuro(depositAmount(selectedPackage, transmission))}</p>
      </div>
      {error && <p className="mt-4 text-sm text-[#ed1c24]">{error}</p>}

      <label className="mt-6 flex items-start gap-2">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span className="text-sm">
          Ik ga akkoord met de{" "}
          <Link href="/algemene-voorwaarden" className="font-semibold text-[#ed1c24] underline" target="_blank">
            algemene voorwaarden
          </Link>{" "}
          en het reglement van Alpha Rijschool.
        </span>
      </label>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={!accepted || submitting}
          onClick={handleConfirm}
          className="rounded-[10px] bg-[#ed1c24] px-6 py-3 font-semibold text-white transition hover:bg-[#111827] disabled:opacity-40"
        >
          {submitting ? "Bezig..." : "Bevestig en betaal voorschot"}
        </button>
      </div>
    </div>
  );
}
