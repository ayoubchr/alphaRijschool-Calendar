"use client";

import Link from "next/link";
import { useState } from "react";
import { isTheoryPackage } from "@/lib/lessonBlocks";
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

const BRUSSELS = "Europe/Brussels";
const DATE = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short", day: "numeric", month: "long" });
const TIME = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit" });
const BIRTH = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long", year: "numeric" });

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBirth(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return BIRTH.format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function SummaryStep({ selectedPackage, transmission, slots, details, onBack }: SummaryStepProps) {
  const payment = depositBreakdown(selectedPackage, transmission);
  const theory = isTheoryPackage(selectedPackage);
  const moments = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentNote =
    payment.lessonLabel === "Eerste theoriedag"
      ? "Je betaalt nu de eerste theoriedag en de inschrijving."
      : payment.lessonLabel === "Eerste les"
        ? "Je betaalt nu de eerste les en de inschrijving. De rest volgt later."
        : "Je betaalt nu het praktijkexamen en de inschrijving.";

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

  const facts = [
    ["Naam", `${details.firstName} ${details.lastName}`],
    ["E-mail", details.email],
    ["Telefoon", details.phone],
    ["Adres", details.address],
    ["Geboortedatum", formatBirth(details.dateOfBirth)],
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#111827]">Controleer je inschrijving</h1>
      <p className="mt-2 text-sm text-[#58595b]">Kijk de gegevens na. Daarna ga je naar de betaling.</p>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-[10px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#58595b]">Pakket</h2>
            <p className="mt-2 text-lg font-extrabold text-[#111827]">{selectedPackage.name}</p>
            <p className="mt-1 text-sm text-[#58595b]">
              {theory ? "2 dagen van 6 uur" : `${transmission === "AUTOMAAT" ? "Automaat" : "Manueel"} · ${selectedPackage.hours} uur`}
            </p>
          </section>

          <section className="rounded-[10px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#58595b]">
              {theory ? "Theoriedagen" : `Momenten · ${moments.length}`}
            </h2>
            <ul className="mt-3 divide-y divide-black/5">
              {moments.map((slot) => (
                <li key={`${slot.instructorId}-${slot.startAt}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#111827]">{capitalize(DATE.format(new Date(slot.startAt)))}</span>
                    {!theory && (
                      <span className="rounded-full bg-[#f4f4f5] px-2.5 py-0.5 text-xs font-semibold text-[#111827]">
                        {slot.instructorName}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-[#58595b]">
                    {TIME.format(new Date(slot.startAt))}–{TIME.format(new Date(slot.endAt))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[10px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#58595b]">Gegevens</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className={label === "Adres" ? "sm:col-span-2" : undefined}>
                  <dt className="text-xs font-semibold text-[#58595b]">{label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-[#111827]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="rounded-[10px] border border-black/10 bg-[#f9f9f9] p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#58595b]">Nu te betalen</h2>
          <p className="mt-2 text-3xl font-extrabold text-[#111827]">{formatEuro(payment.total)}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#58595b]">{paymentNote}</p>
          <dl className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt>{payment.lessonLabel}</dt>
              <dd className="font-semibold">{formatEuro(payment.lessonAmount)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Inschrijving</dt>
              <dd className="font-semibold">{formatEuro(payment.registrationFee)}</dd>
            </div>
          </dl>

          <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" />
            <span>
              Ik ga akkoord met de{" "}
              <Link href="/algemene-voorwaarden" className="font-semibold text-[#ed1c24] underline" target="_blank">
                algemene voorwaarden
              </Link>
              .
            </span>
          </label>

          {error && <p className="mt-3 text-sm text-[#ed1c24]">{error}</p>}

          <button
            type="button"
            disabled={!accepted || submitting}
            onClick={handleConfirm}
            className="mt-4 w-full rounded-[10px] bg-[#ed1c24] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:opacity-40"
          >
            {submitting ? "Bezig..." : `Betalen ${formatEuro(payment.total)}`}
          </button>
          <button type="button" onClick={onBack} className="mt-3 w-full text-sm font-semibold text-[#58595b]">
            Terug naar gegevens
          </button>
        </aside>
      </div>
    </div>
  );
}
