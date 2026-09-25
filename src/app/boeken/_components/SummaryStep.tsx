"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEuro } from "@/lib/money";
import { depositBreakdown } from "@/lib/pricing";
import type { PackageDTO } from "./PackageStep";
import type { BookingSlot } from "./CalendarStep";
import type { BookingDetails } from "./DetailsStep";

interface SummaryStepProps {
  selectedPackage: PackageDTO;
  transmission: "AUTOMAAT" | "MANUEEL";
  slots: BookingSlot[];
  details: BookingDetails;
  onBack: () => void;
}

export function SummaryStep({ selectedPackage, transmission, slots, details, onBack }: SummaryStepProps) {
  const payment = depositBreakdown(selectedPackage, transmission);
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
          slots: slots.map((slot) => ({ instructorId: slot.instructorId, startAt: slot.startAt, endAt: slot.endAt })),
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
        <p><strong>Lessen ({slots.length}):</strong></p>
        <ul className="list-disc pl-5">
          {slots.map((slot) => (
            <li key={`${slot.instructorId}-${slot.startAt}`}>
              {new Date(slot.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })} · {slot.instructorName}
            </li>
          ))}
        </ul>
        <p><strong>Naam:</strong> {details.firstName} {details.lastName}</p>
        <div className="border-t border-black/10 pt-3">
          <p className="mb-2 text-[#58595b]">
            {payment.lessonLabel === "Eerste les"
              ? "Je betaalt nu de eerste les van 2 uur en de inschrijvingskosten. De rest van het pakket volgt later."
              : "Je betaalt nu het praktijkexamen en de inschrijvingskosten."}
          </p>
          <p className="flex justify-between"><span>{payment.lessonLabel}</span><span>{formatEuro(payment.lessonAmount)}</span></p>
          <p className="flex justify-between"><span>Inschrijvingskosten</span><span>{formatEuro(payment.registrationFee)}</span></p>
          <p className="mt-2 flex justify-between font-extrabold text-[#111827]"><span>Nu te betalen</span><span>{formatEuro(payment.total)}</span></p>
        </div>
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
          {submitting ? "Bezig..." : payment.lessonLabel === "Eerste les" ? "Betaal eerste les en inschrijving" : "Betaal examen en inschrijving"}
        </button>
      </div>
    </div>
  );
}
