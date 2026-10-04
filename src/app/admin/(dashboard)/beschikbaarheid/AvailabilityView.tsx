"use client";

import { type FormEvent, type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
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

/** Every quarter from 08:00 through 18:45, so 18u is a full hour like the others. */
const SLOT_STARTS = Array.from({ length: ((18 - 8) * 60) / 15 + 4 }, (_, index) => {
  const minutes = 8 * 60 + index * 15;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
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

const QUARTER_PX = 24;

function plusMinutes(start: string, amount: number) {
  const [hour, minute] = start.split(":").map(Number);
  const total = hour * 60 + minute + amount;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function slotEnd(start: string) {
  return plusMinutes(start, 120);
}

function selectionRanges(open: Set<string>) {
  const ranges: { from: number; to: number }[] = [];
  SLOT_STARTS.forEach((start, index) => {
    if (!open.has(start)) return;
    const last = ranges[ranges.length - 1];
    if (last && last.to === index - 1) last.to = index;
    else ranges.push({ from: index, to: index });
  });
  return ranges;
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
    if (!result?.ok) {
      setError(result?.error ?? "Opslaan is mislukt. Herlaad de pagina en probeer opnieuw.");
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
    if (!result?.ok) {
      setError(result?.error ?? "Opslaan is mislukt. Herlaad de pagina en probeer opnieuw.");
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
        Sleep over een dag om een periode open of dicht te zetten. Een groen blok is de tijd waarop lessen mogen starten. ‘Elke week’ kopieert die uren naar elke week.
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
              if (!result?.ok) {
                setSaving(false);
                setError(result?.error ?? "Opslaan is mislukt. Herlaad de pagina en probeer opnieuw.");
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
            if (!result?.ok) {
              setError(result?.error ?? "Verwijderen is mislukt. Herlaad de pagina en probeer opnieuw.");
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

function TimeGutter() {
  return (
    <div>
      {SLOT_STARTS.map((start) => (
        <div key={start} className="relative" style={{ height: QUARTER_PX }}>
          {start.endsWith(":00") && (
            <span className="absolute right-2 top-1 text-[11px] font-medium tabular-nums text-[#a1a1aa]">{start}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function TimeColumn({
  open,
  dateKey,
  label,
  today,
  anchor,
  onPick,
}: {
  open: Set<string>;
  dateKey?: string;
  label?: string;
  today?: boolean;
  anchor?: string | null;
  onPick?: (start: string) => void;
}) {
  const ranges = selectionRanges(open);
  return (
    <div className={`relative border-l border-[#f4f4f5] ${today ? "bg-[#fff7f7]" : "bg-white"}`}>
      {SLOT_STARTS.map((start) => {
        const minute = start.slice(3);
        const on = open.has(start);
        const line = on ? "" : minute === "00" ? "border-t border-[#e4e4e7]" : minute === "30" ? "border-t border-[#f4f4f5]" : "";
        const shared = `block w-full ${line}`;
        if (onPick) {
          return (
            <button
              key={start}
              type="button"
              data-slot=""
              data-start={start}
              aria-pressed={on}
              aria-label={label ? `${label} ${start}` : start}
              onClick={() => onPick(start)}
              className={`${shared} ${on ? "" : "hover:bg-black/[0.025]"}`}
              style={{ height: QUARTER_PX }}
            />
          );
        }
        return (
          <div
            key={start}
            data-slot=""
            data-date={dateKey}
            data-start={start}
            role="button"
            aria-pressed={on}
            aria-label={label ? `${label} ${start}` : start}
            className={`${shared} ${on ? "" : "hover:bg-black/[0.025]"}`}
            style={{ height: QUARTER_PX }}
          />
        );
      })}
      {ranges.map((range) => (
        <div
          key={SLOT_STARTS[range.from]}
          className="pointer-events-none absolute inset-x-1.5 overflow-hidden rounded-lg bg-emerald-100 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]"
          style={{ top: range.from * QUARTER_PX + 2, height: (range.to - range.from + 1) * QUARTER_PX - 4 }}
        >
          {range.to > range.from && (
            <span className="block px-1.5 pt-1 text-[11px] font-semibold leading-tight tabular-nums">
              {SLOT_STARTS[range.from]}–{plusMinutes(SLOT_STARTS[range.to], 15)}
            </span>
          )}
        </div>
      ))}
      {anchor && SLOT_STARTS.includes(anchor) && (
        <div
          className="pointer-events-none absolute inset-x-1 rounded-md ring-2 ring-emerald-500"
          style={{ top: SLOT_STARTS.indexOf(anchor) * QUARTER_PX + 1, height: QUARTER_PX - 2 }}
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
  const [anchor, setAnchor] = useState<string | null>(null);

  function toggleDay(day: number) {
    setWeekdays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function chooseSlot(start: string) {
    if (!anchor) {
      setAnchor(start);
      return;
    }
    if (anchor === start) {
      setStarts((current) => (current.includes(start) ? current.filter((item) => item !== start) : [...current, start]));
      setAnchor(null);
      return;
    }
    const [from, to] = anchor < start ? [anchor, start] : [start, anchor];
    const range = SLOT_STARTS.filter((slot) => slot >= from && slot <= to);
    const clear = starts.includes(anchor);
    setStarts((current) =>
      clear
        ? current.filter((slot) => !range.includes(slot))
        : SLOT_STARTS.filter((slot) => current.includes(slot) || range.includes(slot))
    );
    setAnchor(null);
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
        <p className="mt-1 text-sm text-[#58595b]">Klik het begin en daarna het einde. Zonder groen op te slaan maakt die dagen leeg.</p>
        <div className="mt-3 grid max-h-[28rem] grid-cols-[3.25rem_1fr] overflow-y-auto rounded-xl border border-black/5">
          <TimeGutter />
          <TimeColumn open={new Set(starts)} anchor={anchor} onPick={chooseSlot} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Annuleren</button>
          <button type="button" disabled={saving || weekdays.length === 0 || instructorIds.length === 0} onClick={() => onSave(instructorIds, weekdays, starts)} className={buttonClass}>{starts.length === 0 ? "Wissen" : "Opslaan"}</button>
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
  const dragRef = useRef<{
    mode: "on" | "off";
    original: Map<string, Set<string>>;
    dirty: Map<string, Set<string>>;
    path: { dateKey: string; start: string }[];
  } | null>(null);
  const [preview, setPreview] = useState<Record<string, string[]> | null>(null);
  const weekLabel = `${days[0].toLocaleDateString("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "short" })}`;

  function startsFor(dateKey: string) {
    if (preview && dateKey in preview) return new Set(preview[dateKey]);
    return openStarts(instructor, dateKey);
  }

  function publishDrag() {
    const drag = dragRef.current;
    if (!drag) return;
    setPreview(Object.fromEntries([...drag.dirty].map(([key, value]) => [key, SLOT_STARTS.filter((slot) => value.has(slot))])));
  }

  function rememberDay(dateKey: string) {
    const drag = dragRef.current;
    if (!drag || drag.original.has(dateKey)) return;
    const open = openStarts(instructor, dateKey);
    drag.original.set(dateKey, new Set(open));
    drag.dirty.set(dateKey, new Set(open));
  }

  function applyCell(dateKey: string, start: string) {
    const drag = dragRef.current;
    if (!drag) return;
    rememberDay(dateKey);
    const slots = drag.dirty.get(dateKey)!;
    if (drag.mode === "on") slots.add(start);
    else slots.delete(start);
  }

  function restoreCell(dateKey: string, start: string) {
    const drag = dragRef.current;
    if (!drag) return;
    const slots = drag.dirty.get(dateKey)!;
    if (drag.original.get(dateKey)!.has(start)) slots.add(start);
    else slots.delete(start);
  }

  function paint(dateKey: string, start: string) {
    const drag = dragRef.current;
    if (!drag) return;
    const last = drag.path[drag.path.length - 1];
    if (last?.dateKey === dateKey && last.start === start) return;

    const index = drag.path.findIndex((item) => item.dateKey === dateKey && item.start === start);
    if (index === -1) {
      drag.path.push({ dateKey, start });
      applyCell(dateKey, start);
    } else {
      for (const item of drag.path.splice(index + 1)) restoreCell(item.dateKey, item.start);
    }
  }

  function cellsFrom(from: { dateKey: string; start: string }, to: { dateKey: string; start: string }) {
    const dayKeys = days.map((day) => brusselsDateKey(day));
    const dayDelta = dayKeys.indexOf(to.dateKey) - dayKeys.indexOf(from.dateKey);
    const startDelta = SLOT_STARTS.indexOf(to.start) - SLOT_STARTS.indexOf(from.start);
    const steps = Math.max(Math.abs(dayDelta), Math.abs(startDelta));
    const cells: { dateKey: string; start: string }[] = [];
    for (let step = 1; step <= steps; step += 1) {
      const dateKey = dayKeys[dayKeys.indexOf(from.dateKey) + Math.round((step * dayDelta) / steps)];
      const start = SLOT_STARTS[SLOT_STARTS.indexOf(from.start) + Math.round((step * startDelta) / steps)];
      const previous = cells[cells.length - 1];
      if (dateKey && start && (!previous || previous.dateKey !== dateKey || previous.start !== start)) {
        cells.push({ dateKey, start });
      }
    }
    return cells;
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
    dragRef.current = {
      mode: openStarts(instructor, dateKey).has(start) ? "off" : "on",
      original: new Map(),
      dirty: new Map(),
      path: [],
    };
    paint(dateKey, start);
    publishDrag();
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
    const dateKey = cell?.getAttribute("data-date");
    const start = cell?.getAttribute("data-start");
    const last = drag.path[drag.path.length - 1];
    if (!dateKey || !start || !last) return;
    for (const step of cellsFrom(last, { dateKey, start })) paint(step.dateKey, step.start);
    publishDrag();
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
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
        <button type="button" className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold text-[#111827] transition hover:border-[#111827]" onClick={() => onWeekChange(addBrusselsDays(weekStart, -7))}>Vorige</button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#111827]">{weekLabel}</p>
          <button type="button" className="mt-0.5 text-xs font-medium text-[#58595b] transition hover:text-[#111827]" onClick={() => onWeekChange(startOfBrusselsWeek(new Date()))}>Deze week</button>
        </div>
        <button type="button" className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold text-[#111827] transition hover:border-[#111827]" onClick={() => onWeekChange(addBrusselsDays(weekStart, 7))}>Volgende</button>
      </div>
      <div className={`overflow-x-auto ${saving ? "pointer-events-none opacity-60" : ""}`}>
        <div className="min-w-[760px]">
          <div className="sticky top-0 z-10 grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] bg-white">
            <div className="border-b border-[#f4f4f5]" />
            {days.map((day) => {
              const dateKey = brusselsDateKey(day);
              const open = startsFor(dateKey);
              const allOn = SLOT_STARTS.every((start) => open.has(start));
              const today = dateKey === todayKey;
              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={saving}
                  onClick={() => onSaveDay(dateKey, allOn ? [] : [...SLOT_STARTS])}
                  className={`border-b border-l border-[#f4f4f5] px-2 py-3 text-center ${today ? "bg-[#fff7f7]" : "bg-white"}`}
                >
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-[#a1a1aa]">{DAY_LABEL.format(day)}</span>
                  <span className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${today ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                    {DAY_NUMBER.format(day)}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            ref={gridRef}
            className="grid touch-none select-none grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <TimeGutter />
            {days.map((day) => {
              const dateKey = brusselsDateKey(day);
              return (
                <TimeColumn
                  key={dateKey}
                  open={startsFor(dateKey)}
                  dateKey={dateKey}
                  label={DAY_LABEL.format(day)}
                  today={dateKey === todayKey}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
