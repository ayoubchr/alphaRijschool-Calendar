"use client";

import { type FormEvent, useEffect, useState } from "react";
import { deleteDossier, updateDossier } from "./actions";
import { DossierPlanning } from "./DossierPlanning";

export interface DossierLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  instructorId: string;
  instructorName: string;
  canChange: boolean;
}

export interface DossierRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  hoursRemaining: number;
  packageId: string;
  packageName: string;
  transmission: string;
  transmissionCode: "AUTOMAAT" | "MANUEEL";
  lessonCount: number;
  finished: boolean;
  lessons: DossierLesson[];
}

export function DossiersView({ dossiers: initial }: { dossiers: DossierRow[] }) {
  const [dossiers, setDossiers] = useState(initial);
  const [tab, setTab] = useState<"active" | "finished">("active");
  const [editing, setEditing] = useState<DossierRow | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<DossierRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDossiers(initial);
  }, [initial]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    const result = await updateDossier({
      id: editing.id,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
      hoursRemaining: Number(form.get("hoursRemaining")),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const hoursRemaining = Number(form.get("hoursRemaining"));
    const hasUpcoming = editing.lessons.some((lesson) => lesson.status !== "COMPLETED" && new Date(lesson.startAt).getTime() >= Date.now());
    const next = {
      ...editing,
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      phone: String(form.get("phone") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      hoursRemaining,
      finished: hoursRemaining < 2 && !hasUpcoming,
    };
    setDossiers((current) => current.map((item) => (item.id === next.id ? next : item)));
    setEditing(null);
  }

  async function confirmDelete() {
    if (!removing) return;
    setSaving(true);
    setError(null);
    const result = await deleteDossier(removing.id);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDossiers((current) => current.filter((item) => item.id !== removing.id));
    setRemoving(null);
  }

  const shown = dossiers.filter((dossier) => (tab === "finished" ? dossier.finished : !dossier.finished));
  const activeCount = dossiers.filter((dossier) => !dossier.finished).length;
  const finishedCount = dossiers.length - activeCount;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#111827]">Dossiers</h1>
      <p className="mb-4 mt-1 text-sm text-[#58595b]">Standaard zie je alleen dossiers met tegoed of komende lessen. Afgeronde dossiers blijven bewaard, maar staan apart.</p>
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTab("active")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "active" ? "bg-[#111827] text-white" : "border border-black/10 bg-white"}`}>Actief ({activeCount})</button>
        <button type="button" onClick={() => setTab("finished")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "finished" ? "bg-[#111827] text-white" : "border border-black/10 bg-white"}`}>Afgerond ({finishedCount})</button>
      </div>
      {error && <p className="mb-4 text-sm text-[#ed1c24]">{error}</p>}
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
        {shown.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#58595b]">{tab === "finished" ? "Er zijn nog geen afgeronde dossiers." : "Er zijn geen actieve dossiers."}</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {shown.map((dossier) => (
              <li key={dossier.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-[#111827]">{dossier.firstName} {dossier.lastName}</p>
                  <p className="text-sm text-[#58595b]">{dossier.packageName} · {dossier.transmission} · {dossier.hoursRemaining} uur over · {dossier.lessonCount} lessen</p>
                  <p className="text-sm text-[#58595b]">{dossier.email} · {dossier.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPlanningId(dossier.id)} className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold">Planning</button>
                  <button type="button" onClick={() => setEditing(dossier)} className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold">Bewerken</button>
                  <button type="button" onClick={() => setRemoving(dossier)} className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#ed1c24]">Verwijderen</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {planningId && dossiers.find((item) => item.id === planningId) && (
        <DossierPlanning dossier={dossiers.find((item) => item.id === planningId)!} onClose={() => setPlanningId(null)} />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setEditing(null)}>
          <form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-extrabold text-[#111827]">{editing.firstName} {editing.lastName}</h2>
            <p className="mt-1 text-sm text-[#58595b]">{editing.packageName} · {editing.transmission}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">Voornaam<input name="firstName" defaultValue={editing.firstName} required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" /></label>
              <label className="text-sm font-medium">Achternaam<input name="lastName" defaultValue={editing.lastName} required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" /></label>
              <label className="text-sm font-medium sm:col-span-2">E-mail<input name="email" type="email" defaultValue={editing.email} required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" /></label>
              <label className="text-sm font-medium">Telefoon<input name="phone" defaultValue={editing.phone} required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" /></label>
              <label className="text-sm font-medium">Resterende uren<input name="hoursRemaining" type="number" min={0} step="0.5" defaultValue={editing.hoursRemaining} required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" /></label>
              <label className="text-sm font-medium sm:col-span-2">Adres<input name="address" defaultValue={editing.address} required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm font-semibold">Terug</button>
              <button type="submit" disabled={saving} className="rounded-full bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Opslaan…" : "Opslaan"}</button>
            </div>
          </form>
        </div>
      )}

      {removing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => { if (!saving) setRemoving(null); }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-extrabold text-[#111827]">Dossier verwijderen?</h2>
            <p className="mt-2 text-sm text-[#58595b]">Het dossier van {removing.firstName} {removing.lastName} verdwijnt, samen met {removing.lessonCount} lessen en de betalingen. Dit kan niet ongedaan worden gemaakt.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRemoving(null)} disabled={saving} className="rounded-full px-4 py-2 text-sm font-semibold">Terug</button>
              <button type="button" onClick={confirmDelete} disabled={saving} className="rounded-full bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Bezig…" : "Verwijderen"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
