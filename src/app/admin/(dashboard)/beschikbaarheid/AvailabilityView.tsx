"use client";

import { type FormEvent, useState } from "react";
import { addBrusselsDays, brusselsDateKey, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { addInstructor, deleteInstructor, saveDaySlots, saveWeeklySlots } from "./actions";

export interface AvailabilityInstructor {
  id: string;
  name: string;
  transmission: "AUTOMAAT" | "MANUEEL" | "BOTH";
  active: boolean;
  availabilityRules: { id: string; weekday: number; startTime: string; endTime: string }[];
  availabilityExceptions: { id: string; date: string; startTime: string; endTime: string; isAvailable: boolean }[];
}

const SLOT_STARTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
const WEEKDAYS = [
  { day: 1, label: "Ma" },
  { day: 2, label: "Di" },
  { day: 3, label: "Wo" },
  { day: 4, label: "Do" },
  { day: 5, label: "Vr" },
  { day: 6, label: "Za" },
  { day: 0, label: "Zo" },
];
const TRANSMISSION_LABEL = { AUTOMAAT: "Automaat", MANUEEL: "Manueel", BOTH: "Beide" };
const BRUSSELS = "Europe/Brussels";
const DAY_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric" });

const fieldClass = "mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2 outline-none transition focus:border-[#111827]";
const buttonClass = "rounded-[10px] bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:opacity-60";

function slotEnd(start: string) {
  const [hour, minute] = start.split(":").map(Number);
  return `${String(hour + 2).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function weekdayOf(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

function openStarts(instructor: AvailabilityInstructor, dateKey: string) {
  const weekday = weekdayOf(dateKey);
  const open = new Set(
    instructor.availabilityRules
      .filter((rule) => rule.weekday === weekday && SLOT_STARTS.includes(rule.startTime.slice(0, 5)))
      .map((rule) => rule.startTime.slice(0, 5))
  );
  for (const item of instructor.availabilityExceptions.filter((exception) => exception.date === dateKey)) {
    const start = item.startTime.slice(0, 5);
    if (item.isAvailable) open.add(start);
    else open.delete(start);
  }
  return open;
}

export function AvailabilityView({
  isAdmin,
  instructors: initialInstructors,
}: {
  isAdmin: boolean;
  instructors: AvailabilityInstructor[];
}) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [selectedId, setSelectedId] = useState(initialInstructors[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(() => startOfBrusselsWeek(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [deleting, setDeleting] = useState<AvailabilityInstructor | null>(null);

  const selected = instructors.find((instructor) => instructor.id === selectedId) ?? instructors[0] ?? null;
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const todayKey = brusselsDateKey(new Date());

  async function handleAddInstructor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setSaving(true);
    const result = await addInstructor({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      transmission: String(form.get("transmission") ?? "BOTH"),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInstructors((prev) => [...prev, result.instructor].sort((a, b) => a.name.localeCompare(b.name, "nl")));
    setSelectedId(result.instructor.id);
    (event.target as HTMLFormElement).reset();
  }

  async function saveDay(dateKey: string, starts: string[]) {
    if (!selected) return;
    const previous = selected.availabilityExceptions;
    const slots = starts.map((startTime) => ({ startTime, endTime: slotEnd(startTime) }));
    const covered = new Set(
      selected.availabilityRules.filter((rule) => rule.weekday === weekdayOf(dateKey)).map((rule) => rule.startTime.slice(0, 5))
    );
    const wanted = new Set(starts);
    const overrides = [
      ...starts.filter((start) => !covered.has(start)).map((startTime) => ({ id: `${dateKey}-${startTime}`, date: dateKey, startTime, endTime: slotEnd(startTime), isAvailable: true })),
      ...Array.from(covered).filter((start) => !wanted.has(start)).map((startTime) => ({ id: `${dateKey}-off-${startTime}`, date: dateKey, startTime, endTime: slotEnd(startTime), isAvailable: false })),
    ];
    setError(null);
    setInstructors((prev) =>
      prev.map((instructor) =>
        instructor.id === selected.id
          ? { ...instructor, availabilityExceptions: [...instructor.availabilityExceptions.filter((item) => item.date !== dateKey), ...overrides] }
          : instructor
      )
    );
    setSaving(true);
    const result = await saveDaySlots({ instructorId: selected.id, date: dateKey, slots });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      setInstructors((prev) => prev.map((instructor) => (instructor.id === selected.id ? { ...instructor, availabilityExceptions: previous } : instructor)));
      return;
    }
    setInstructors((prev) =>
      prev.map((instructor) =>
        instructor.id === selected.id
          ? {
              ...instructor,
              availabilityExceptions: [...instructor.availabilityExceptions.filter((item) => item.date !== dateKey), ...result.exceptions],
            }
          : instructor
      )
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Beschikbaarheid</h1>
      <p className="mb-6 max-w-3xl text-sm text-[#58595b]">
        Klik losse lesblokken aan voor één datum, of gebruik ‘Elke week’ om dezelfde uren meteen voor elke maandag, dinsdag, … in te stellen.
      </p>
      {error && <p className="mb-4 text-sm text-[#ed1c24]">{error}</p>}

      {isAdmin && (
        <form onSubmit={handleAddInstructor} className="mb-6 grid gap-4 rounded-[10px] border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
          <label className="block text-sm font-medium">
            Nieuwe instructeur
            <input name="name" required placeholder="Naam" className={fieldClass} />
          </label>
          <label className="block text-sm font-medium">
            E-mail
            <input name="email" type="email" required placeholder="instructeur@alpha-rijschool.be" className={fieldClass} />
          </label>
          <label className="block text-sm font-medium">
            Transmissie
            <select name="transmission" defaultValue="BOTH" className={fieldClass}>
              <option value="BOTH">Beide</option>
              <option value="AUTOMAAT">Automaat</option>
              <option value="MANUEEL">Manueel</option>
            </select>
          </label>
          <button type="submit" disabled={saving} className={buttonClass}>Toevoegen</button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {instructors.map((instructor) => {
            const active = instructor.id === selected?.id;
            return (
              <div
                key={instructor.id}
                className={`flex items-center rounded-full text-sm font-semibold ${
                  active ? "bg-[#111827] text-white" : "border border-black/10 bg-white text-[#111827]"
                }`}
              >
                <button type="button" onClick={() => setSelectedId(instructor.id)} className="rounded-full py-2 pl-4 pr-2">
                  {instructor.name}
                  <span className={active ? "text-white/70" : "text-[#58595b]"}> · {TRANSMISSION_LABEL[instructor.transmission]}</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    aria-label={`${instructor.name} verwijderen`}
                    onClick={() => setDeleting(instructor)}
                    className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full text-base leading-none ${
                      active ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-[#58595b] hover:bg-[#fff5f5] hover:text-[#ed1c24]"
                    }`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {selected && (
          <button type="button" onClick={() => setWeeklyOpen(true)} className="rounded-[10px] border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#111827]">
            Elke week instellen
          </button>
        )}
      </div>

      {selected && weeklyOpen && (
        <WeeklyModal
          rules={selected.availabilityRules}
          saving={saving}
          onClose={() => setWeeklyOpen(false)}
          onSave={async (weekdays, starts) => {
            setSaving(true);
            setError(null);
            const result = await saveWeeklySlots({
              instructorId: selected.id,
              weekdays,
              slots: starts.map((startTime) => ({ startTime, endTime: slotEnd(startTime) })),
            });
            setSaving(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setInstructors((prev) =>
              prev.map((instructor) =>
                instructor.id === selected.id ? { ...instructor, availabilityRules: result.rules, availabilityExceptions: result.exceptions } : instructor
              )
            );
            setWeeklyOpen(false);
          }}
        />
      )}

      {deleting && isAdmin && (
        <ConfirmModal
          title={`${deleting.name} verwijderen?`}
          body="Het rooster van deze instructeur verdwijnt. Dit kan niet ongedaan worden gemaakt."
          confirmLabel="Verwijderen"
          saving={saving}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            setSaving(true);
            setError(null);
            const result = await deleteInstructor(deleting.id);
            setSaving(false);
            if (!result.ok) {
              setError(result.error);
              setDeleting(null);
              return;
            }
            const next = instructors.filter((instructor) => instructor.id !== deleting.id);
            setInstructors(next);
            setSelectedId((current) => (current === deleting.id ? next[0]?.id ?? "" : current));
            setDeleting(null);
          }}
        />
      )}

      {selected && (
        <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-3">
            <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => setWeekStart(addBrusselsDays(weekStart, -7))}>← Vorige</button>
            <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => setWeekStart(startOfBrusselsWeek(new Date()))}>Vandaag</button>
            <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => setWeekStart(addBrusselsDays(weekStart, 7))}>Volgende →</button>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-[88px_repeat(7,minmax(0,1fr))]">
              <div className="border-b border-r border-black/5 bg-[#f9f9f9]" />
              {days.map((day) => {
                const dateKey = brusselsDateKey(day);
                const open = openStarts(selected, dateKey);
                const allOn = SLOT_STARTS.every((start) => open.has(start));
                return (
                  <button
                    key={dateKey}
                    type="button"
                    disabled={saving}
                    onClick={() => saveDay(dateKey, allOn ? [] : [...SLOT_STARTS])}
                    className={`border-b border-r border-black/5 px-2 py-3 text-center last:border-r-0 ${dateKey === todayKey ? "bg-[#fff5f5]" : "bg-[#f9f9f9]"}`}
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-[#58595b]">{DAY_LABEL.format(day)}</span>
                    <span className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${dateKey === todayKey ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                      {DAY_NUMBER.format(day)}
                    </span>
                  </button>
                );
              })}
              {SLOT_STARTS.map((start) => (
                <SlotRow
                  key={start}
                  start={start}
                  days={days}
                  instructor={selected}
                  saving={saving}
                  onToggle={(dateKey, nextStarts) => saveDay(dateKey, nextStarts)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyModal({
  rules,
  saving,
  onClose,
  onSave,
}: {
  rules: AvailabilityInstructor["availabilityRules"];
  saving: boolean;
  onClose: () => void;
  onSave: (weekdays: number[], starts: string[]) => void;
}) {
  const [weekdays, setWeekdays] = useState(() => Array.from(new Set(rules.map((rule) => rule.weekday))));
  const [starts, setStarts] = useState(() =>
    SLOT_STARTS.filter((start) => rules.some((rule) => rule.startTime.slice(0, 5) === start))
  );

  function toggleDay(day: number) {
    setWeekdays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function toggleSlot(start: string) {
    setStarts((current) => (current.includes(start) ? current.filter((item) => item !== start) : [...current, start]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="weekly-title">
      <div className="w-full max-w-lg rounded-[10px] bg-white p-5 shadow-lg">
        <h2 id="weekly-title" className="text-lg font-extrabold text-[#111827]">Elke week</h2>
        <p className="mt-1 text-sm text-[#58595b]">De gekozen uren gelden voortaan elke week op die dagen. Een losse klik in de kalender past daarna alleen die ene datum aan.</p>
        <p className="mt-4 text-sm font-semibold text-[#111827]">Dagen</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((item) => (
            <button
              key={item.day}
              type="button"
              aria-pressed={weekdays.includes(item.day)}
              onClick={() => toggleDay(item.day)}
              className={`h-10 w-12 rounded-[10px] text-sm font-semibold ${weekdays.includes(item.day) ? "bg-[#111827] text-white" : "border border-black/10 text-[#58595b]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-[#111827]">Uren</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLOT_STARTS.map((start) => (
            <button
              key={start}
              type="button"
              aria-pressed={starts.includes(start)}
              onClick={() => toggleSlot(start)}
              className={`rounded-[10px] px-3 py-2 text-sm font-semibold ${starts.includes(start) ? "bg-[#111827] text-white" : "border border-black/10 text-[#58595b]"}`}
            >
              {start}–{slotEnd(start)}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Annuleren</button>
          <button type="button" disabled={saving || weekdays.length === 0 || starts.length === 0} onClick={() => onSave(weekdays, starts)} className={buttonClass}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  saving,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-[10px] bg-white p-5 shadow-lg">
        <h2 id="confirm-title" className="text-lg font-extrabold text-[#111827]">{title}</h2>
        <p className="mt-2 text-sm text-[#58595b]">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Annuleren</button>
          <button type="button" disabled={saving} onClick={onConfirm} className={buttonClass}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  start,
  days,
  instructor,
  saving,
  onToggle,
}: {
  start: string;
  days: Date[];
  instructor: AvailabilityInstructor;
  saving: boolean;
  onToggle: (dateKey: string, nextStarts: string[]) => void;
}) {
  return (
    <>
      <div className="border-b border-r border-black/5 px-2 py-3 text-xs font-semibold text-[#58595b]">{start}–{slotEnd(start)}</div>
      {days.map((day) => {
        const dateKey = brusselsDateKey(day);
        const open = openStarts(instructor, dateKey);
        const on = open.has(start);
        return (
          <button
            key={dateKey}
            type="button"
            disabled={saving}
            aria-pressed={on}
            onClick={() => {
              const next = new Set(open);
              if (next.has(start)) next.delete(start);
              else next.add(start);
              onToggle(dateKey, SLOT_STARTS.filter((slot) => next.has(slot)));
            }}
            className={`min-h-11 border-b border-r border-black/5 last:border-r-0 ${on ? "bg-[#111827]" : "bg-white hover:bg-[#f4f4f5]"}`}
          />
        );
      })}
    </>
  );
}
