"use client";

import { type FormEvent, useState } from "react";
import { createTheoryDay, deleteTheoryDay } from "./actions";

export interface TheoryDayRow {
  id: string;
  startAt: string;
  endAt: string;
}

const STARTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const BRUSSELS = "Europe/Brussels";
const DAY = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "long", day: "numeric", month: "long", year: "numeric" });
const TIME = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit" });

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function label(day: TheoryDayRow) {
  return `${capitalize(DAY.format(new Date(day.startAt)))} · ${TIME.format(new Date(day.startAt))}–${TIME.format(new Date(day.endAt))}`;
}

export function TheoryDaysView({ days: initial }: { days: TheoryDayRow[] }) {
  const [days, setDays] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const now = Date.now();
  const upcoming = days.filter((day) => new Date(day.endAt).getTime() > now);
  const past = days.filter((day) => new Date(day.endAt).getTime() <= now);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setSaving(true);
    const result = await createTheoryDay({
      date: String(form.get("date") ?? ""),
      startTime: String(form.get("startTime") ?? ""),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDays((current) => [...current, result.day].sort((a, b) => a.startAt.localeCompare(b.startAt)));
    (event.target as HTMLFormElement).reset();
  }

  async function onDelete(id: string) {
    setError(null);
    setSaving(true);
    const result = await deleteTheoryDay(id);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDays((current) => current.filter((day) => day.id !== id));
    setConfirmId(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ed1c24]">Theorie</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#111827]">Theoriedagen</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#58595b]">
        Plan hier de dagen waarop theorieles gegeven wordt.
      </p>

      <form onSubmit={onCreate} className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <label className="text-sm font-semibold text-[#111827]">
          Datum
          <input name="date" type="date" required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2 font-normal outline-none focus:border-[#111827]" />
        </label>
        <label className="text-sm font-semibold text-[#111827]">
          Startuur
          <select name="startTime" required defaultValue="09:00" className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2 font-normal outline-none focus:border-[#111827]">
            {STARTS.map((start) => (
              <option key={start} value={start}>{start}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={saving} className="rounded-[10px] bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:opacity-60">
          Dag toevoegen
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-[#ed1c24]">{error}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-[#111827]">Gepland</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-[#58595b]">Nog geen theoriedagen. Studenten zien dan geen momenten om te kiezen.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((day) => (
              <li key={day.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
                <p className="font-semibold text-[#111827]">{label(day)}</p>
                {confirmId === day.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <button type="button" disabled={saving} onClick={() => onDelete(day.id)} className="font-semibold text-[#ed1c24]">Verwijderen</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="text-[#58595b]">Annuleren</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmId(day.id)} className="text-sm font-semibold text-[#58595b] hover:text-[#ed1c24]">Verwijderen</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#58595b]">Voorbij</h2>
          <ul className="mt-3 space-y-2">
            {past.map((day) => (
              <li key={day.id} className="rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm text-[#58595b]">{label(day)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
