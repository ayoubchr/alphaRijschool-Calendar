"use client";

import { StatusBadge } from "@/app/admin/(dashboard)/StatusBadge";
import type { DossierDetails } from "@/lib/admin/dossierDetails";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-black/5 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#58595b]">{label}</dt>
      <dd className="text-sm font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

export function DossierDetailsModal({ dossier, onClose }: { dossier: DossierDetails; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="dossier-details-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h2 id="dossier-details-title" className="text-lg font-extrabold text-[#111827]">{dossier.firstName} {dossier.lastName}</h2>
        <p className="mt-1 text-sm text-[#58595b]">{dossier.packageName} · {dossier.transmission}</p>
        <dl className="mt-4">
          <Row label="E-mail" value={dossier.email} />
          <Row label="Telefoon" value={dossier.phone} />
          <Row label="Adres" value={dossier.address} />
          <Row label="Geboortedatum" value={dossier.dateOfBirth} />
          <Row label="Rijksregisternummer" value={dossier.nationalRegisterNumber ?? "Niet opgegeven"} />
          <Row label="Resterende uren" value={String(dossier.hoursRemaining)} />
          <Row label="Ingeschreven op" value={dossier.createdAt} />
        </dl>
        <h3 className="mt-5 text-sm font-extrabold text-[#111827]">Lessen</h3>
        {dossier.lessons.length === 0 ? (
          <p className="mt-2 text-sm text-[#58595b]">Nog geen les ingepland.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {dossier.lessons.map((lesson) => (
              <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-[#111827]">{lesson.when} · {lesson.instructorName}</span>
                <StatusBadge status={lesson.status} />
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-5 text-sm font-extrabold text-[#111827]">Betalingen</h3>
        {dossier.payments.length === 0 ? (
          <p className="mt-2 text-sm text-[#58595b]">Nog geen betaling.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {dossier.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-[#111827]">{payment.label} {payment.amount} · {payment.createdAt}</span>
                <StatusBadge status={payment.status} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white">Sluiten</button>
        </div>
      </div>
    </div>
  );
}
