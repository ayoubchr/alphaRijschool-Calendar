"use client";

import { type FormEvent, type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import { IoCheckmark } from "react-icons/io5";
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
        Sleep over de blokken om ze in één beweging open of dicht te zetten. Eén klik blijft werken. ‘Elke week’ zet dezelfde uren op elke maandag, dinsdag, …
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
          instructors={isAdmin ? instructors.map((instructor) => ({ id: instructor.id, name: instructor.name })) : [{ id: selected.id, name: selected.name }]}
          currentId={selected.id}
          saving={saving}
          onClose={() => setWeeklyOpen(false)}
          onSave={async (instructorIds, weekdays, starts) => {
            setSaving(true);
            setError(null);
            const slots = starts.map((startTime) => ({ startTime, endTime: slotEnd(startTime) }));
            for (const instructorId of instructorIds) {
              const result = await saveWeeklySlots({ instructorId, weekdays, slots });
              if (!result.ok) {
                setSaving(false);
                setError(result.error);
                return;
              }
              setInstructors((prev) =>
                prev.map((instructor) =>
                  instructor.id === instructorId ? { ...instructor, availabilityRules: result.rules, availabilityExceptions: result.exceptions } : instructor
                )
              );
            }
            setSaving(false);
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
        <AvailabilityGrid
          instructor={selected}
          days={days}
          todayKey={todayKey}
          weekStart={weekStart}
          saving={saving}
          onWeekChange={setWeekStart}
          onSaveDay={saveDay}
        />
      )}
    </div>
  );
}

function WeeklyModal({
  rules,
  instructors,
  currentId,
  saving,
  onClose,
  onSave,
}: {
  rules: AvailabilityInstructor["availabilityRules"];
  instructors: { id: string; name: string }[];
  currentId: string;
  saving: boolean;
  onClose: () => void;
  onSave: (instructorIds: string[], weekdays: number[], starts: string[]) => void;
}) {
  const [instructorIds, setInstructorIds] = useState(() => [currentId]);
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
        {instructors.length > 1 && (
          <>
            <p className="mt-4 text-sm font-semibold text-[#111827]">Instructeurs</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {instructors.map((instructor) => {
                const on = instructorIds.includes(instructor.id);
                return (
                  <button
                    key={instructor.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setInstructorIds((current) => (on ? current.filter((id) => id !== instructor.id) : [...current, instructor.id]))}
                    className={`rounded-[10px] px-3 py-2 text-sm font-semibold ${on ? "bg-[#111827] text-white" : "border border-black/10 text-[#58595b]"}`}
                  >
                    {instructor.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
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
          <button type="button" disabled={saving || weekdays.length === 0 || starts.length === 0 || instructorIds.length === 0} onClick={() => onSave(instructorIds, weekdays, starts)} className={buttonClass}>Opslaan</button>
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

function AvailabilityGrid({
  instructor,
  days,
  todayKey,
  weekStart,
  saving,
  onWeekChange,
  onSaveDay,
}: {
  instructor: AvailabilityInstructor;
  days: Date[];
  todayKey: string;
  weekStart: Date;
  saving: boolean;
  onWeekChange: (next: Date) => void;
  onSaveDay: (dateKey: string, starts: string[]) => Promise<void>;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: "on" | "off"; dirty: Map<string, Set<string>> } | null>(null);
  const [preview, setPreview] = useState<Record<string, string[]> | null>(null);
  const weekLabel = `${days[0].toLocaleDateString("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "short" })}`;

  function startsFor(dateKey: string) {
    if (preview && dateKey in preview) return new Set(preview[dateKey]);
    return openStarts(instructor, dateKey);
  }

  function paint(dateKey: string, start: string) {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.dirty.has(dateKey)) drag.dirty.set(dateKey, new Set(openStarts(instructor, dateKey)));
    const slots = drag.dirty.get(dateKey)!;
    if (drag.mode === "on") slots.add(start);
    else slots.delete(start);
    setPreview(Object.fromEntries([...drag.dirty].map(([key, value]) => [key, SLOT_STARTS.filter((slot) => value.has(slot))])));
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (saving || event.button !== 0) return;
    const cell = (event.target as HTMLElement).closest("[data-slot]");
    if (!cell) return;
    const dateKey = cell.getAttribute("data-date");
    const start = cell.getAttribute("data-start");
    if (!dateKey || !start) return;
    event.preventDefault();
    gridRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { mode: openStarts(instructor, dateKey).has(start) ? "off" : "on", dirty: new Map() };
    paint(dateKey, start);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
    const dateKey = cell?.getAttribute("data-date");
    const start = cell?.getAttribute("data-start");
    if (dateKey && start) paint(dateKey, start);
  }

  async function finishDrag() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.dirty.size === 0) return;
    for (const [dateKey, slots] of drag.dirty) {
      await onSaveDay(dateKey, SLOT_STARTS.filter((start) => slots.has(start)));
    }
    setPreview(null);
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-3">
        <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => onWeekChange(addBrusselsDays(weekStart, -7))}>← Vorige</button>
        <div className="text-center">
          <p className="text-sm font-extrabold text-[#111827]">{weekLabel}</p>
          <button type="button" className="mt-1 text-xs font-semibold text-[#58595b] underline" onClick={() => onWeekChange(startOfBrusselsWeek(new Date()))}>Vandaag</button>
        </div>
        <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => onWeekChange(addBrusselsDays(weekStart, 7))}>Volgende →</button>
      </div>
      <div className={`overflow-x-auto ${saving ? "opacity-60" : ""}`}>
        <div
          ref={gridRef}
          className="grid min-w-[820px] touch-none select-none grid-cols-[7.5rem_repeat(7,minmax(0,1fr))]"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className="border-b border-r border-black/5 bg-[#f9f9f9]" />
          {days.map((day) => {
            const dateKey = brusselsDateKey(day);
            const open = startsFor(dateKey);
            const allOn = SLOT_STARTS.every((start) => open.has(start));
            return (
              <button
                key={dateKey}
                type="button"
                disabled={saving}
                onClick={() => onSaveDay(dateKey, allOn ? [] : [...SLOT_STARTS])}
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
            <div key={start} className="contents">
              <div className="whitespace-nowrap border-b border-r border-black/5 px-2 py-3 text-xs font-semibold text-[#58595b]">{start}–{slotEnd(start)}</div>
              {days.map((day) => {
                const dateKey = brusselsDateKey(day);
                const on = startsFor(dateKey).has(start);
                return (
                  <div
                    key={dateKey}
                    data-slot=""
                    data-date={dateKey}
                    data-start={start}
                    role="button"
                    aria-pressed={on}
                    aria-label={`${DAY_LABEL.format(day)} ${start} ${on ? "open" : "dicht"}`}
                    className="flex min-h-12 items-center justify-center border-b border-r border-black/5 p-1.5 last:border-r-0"
                  >
                    <span className={`flex h-8 w-full items-center justify-center rounded-md ${on ? "bg-[#111827] text-white" : "bg-[#f4f4f5]"}`}>
                      {on && <IoCheckmark className="h-5 w-5" aria-hidden />}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
