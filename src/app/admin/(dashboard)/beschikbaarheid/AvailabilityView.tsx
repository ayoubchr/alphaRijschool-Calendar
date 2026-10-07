"use client";

import { type FormEvent, type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import { blocksOverlap, minutesOf, resolveDayBlocks, sameBlocks, timeFromMinutes, type AvailabilityKind, type TimeBlock } from "@/lib/availabilityBlocks";
import { addBrusselsDays, brusselsDateKey, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { addInstructor, deleteInstructor, saveDaySlots, saveWeeklySlots } from "./actions";

export interface AvailabilityInstructor {
  id: string;
  name: string;
  transmission: "AUTOMAAT" | "MANUEEL" | "BOTH";
  active: boolean;
  availabilityRules: { id: string; weekday: number; startTime: string; endTime: string; kind?: AvailabilityKind }[];
  availabilityExceptions: { id: string; date: string; startTime: string; endTime: string; isAvailable: boolean; kind?: AvailabilityKind }[];
}

/** Every quarter from 07:00 through 20:45, so 20u is a full hour like the others. */
const SLOT_STARTS = Array.from({ length: ((20 - 7) * 60) / 15 + 4 }, (_, index) => {
  const minutes = 7 * 60 + index * 15;
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
const DAY_END = timeFromMinutes(minutesOf(SLOT_STARTS[SLOT_STARTS.length - 1]) + 15);
const GRID_TIMES = [...SLOT_STARTS, DAY_END];

function sortBlocks(blocks: TimeBlock[]) {
  return [...blocks].sort((left, right) => left.start.localeCompare(right.start));
}

function weeklyBlocks(rules: AvailabilityInstructor["availabilityRules"]) {
  const byDay = new Map<number, { start: string; end: string; kind?: AvailabilityKind }[]>();
  for (const rule of rules) {
    const list = byDay.get(rule.weekday) ?? [];
    list.push({ start: rule.startTime.slice(0, 5), end: rule.endTime.slice(0, 5), kind: rule.kind });
    byDay.set(rule.weekday, list);
  }
  const seen = new Set<string>();
  const blocks: TimeBlock[] = [];
  for (const windows of byDay.values()) {
    for (const block of resolveDayBlocks(windows, [])) {
      const key = `${block.kind}-${block.start}-${block.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      blocks.push(block);
    }
  }
  return sortBlocks(blocks);
}

function weekdayOf(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

function dayBlocks(instructor: AvailabilityInstructor, dateKey: string) {
  const weekday = weekdayOf(dateKey);
  return resolveDayBlocks(
    instructor.availabilityRules
      .filter((rule) => rule.weekday === weekday)
      .map((rule) => ({ start: rule.startTime.slice(0, 5), end: rule.endTime.slice(0, 5), kind: rule.kind })),
    instructor.availabilityExceptions
      .filter((exception) => exception.date === dateKey)
      .map((exception) => ({ start: exception.startTime.slice(0, 5), end: exception.endTime.slice(0, 5), isAvailable: exception.isAvailable, kind: exception.kind })),
  );
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
  const [paintKind, setPaintKind] = useState<AvailabilityKind>("LESSON");

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

  async function saveDay(dateKey: string, blocks: TimeBlock[]) {
    if (!selected) return;
    const previous = selected.availabilityExceptions;
    const slots = blocks.map((block) => ({ startTime: block.start, endTime: block.end, kind: block.kind }));
    const weekday = weekdayOf(dateKey);
    const weekly = resolveDayBlocks(
      selected.availabilityRules
        .filter((rule) => rule.weekday === weekday)
        .map((rule) => ({ start: rule.startTime.slice(0, 5), end: rule.endTime.slice(0, 5), kind: rule.kind })),
      [],
    );
    const overrides = sameBlocks(weekly, blocks)
      ? []
      : [
          ...selected.availabilityRules
            .filter((rule) => rule.weekday === weekday)
            .map((rule) => ({ id: `${dateKey}-off-${rule.kind ?? "LESSON"}-${rule.startTime}`, date: dateKey, startTime: rule.startTime.slice(0, 5), endTime: rule.endTime.slice(0, 5), isAvailable: false, kind: rule.kind ?? "LESSON" })),
          ...blocks.map((block) => ({ id: `${dateKey}-${block.kind}-${block.start}`, date: dateKey, startTime: block.start, endTime: block.end, isAvailable: true, kind: block.kind })),
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
        Kies en sleep dan het blok. Groen is een les, oranje een praktijkexamen, blauw een examen met 2 uur voorbereiding. Een leerling ziet alleen de blokken van het pakket dat hij boekt.
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
          paintKind={paintKind}
          onPaintKind={setPaintKind}
          saving={saving}
          onClose={() => setWeeklyOpen(false)}
          onSave={async (instructorIds, weekdays, blocks) => {
            setSaving(true);
            setError(null);
            const slots = blocks.map((block) => ({ startTime: block.start, endTime: block.end, kind: block.kind }));
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
          paintKind={paintKind}
          onPaintKind={setPaintKind}
          onSaveDay={saveDay}
          onError={setError}
        />
      )}
    </div>
  );
}

function rowIndex(time: string) {
  return GRID_TIMES.indexOf(time.slice(0, 5));
}

function blockStyle(block: { start: string; end: string }) {
  const top = rowIndex(block.start) * QUARTER_PX + 2;
  const height = ((minutesOf(block.end) - minutesOf(block.start)) / 15) * QUARTER_PX - 4;
  return { top, height: Math.max(height, QUARTER_PX - 4) };
}

function covers(blocks: TimeBlock[], time: string) {
  return blocks.some((block) => time >= block.start && time < block.end);
}

function rangeBlock(origin: string, current: string): { start: string; end: string } | null {
  const from = origin < current ? origin : current;
  const to = origin < current ? current : origin;
  if (from === DAY_END) return null;
  const end = to === DAY_END ? DAY_END : timeFromMinutes(minutesOf(to) + 15);
  if (end <= from) return null;
  return { start: from, end };
}

function kindLabel(kind: AvailabilityKind) {
  if (kind === "EXAM_PREP") return "Examen + 2u";
  if (kind === "EXAM") return "Examen";
  return "";
}

function kindSurface(kind: AvailabilityKind | undefined, draft = false) {
  if (kind === "EXAM_PREP") return draft ? "bg-sky-200/80 text-sky-950" : "bg-sky-100 text-sky-950 shadow-[inset_0_0_0_1px_rgba(2,132,199,0.35)]";
  if (kind === "EXAM") return draft ? "bg-amber-200/80 text-amber-950" : "bg-amber-100 text-amber-950 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.35)]";
  return draft ? "bg-emerald-200/80 text-emerald-950" : "bg-emerald-100 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.28)]";
}

function KindSwitch({ kind, onChange }: { kind: AvailabilityKind; onChange: (kind: AvailabilityKind) => void }) {
  const options: { id: AvailabilityKind; label: string; on: string }[] = [
    { id: "LESSON", label: "Les", on: "bg-emerald-600 text-white" },
    { id: "EXAM", label: "Examen", on: "bg-amber-500 text-white" },
    { id: "EXAM_PREP", label: "Examen + 2u", on: "bg-sky-600 text-white" },
  ];
  return (
    <div className="flex rounded-full border border-black/10 bg-white p-1 text-sm font-semibold">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={kind === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-full px-4 py-1.5 ${kind === option.id ? option.on : "text-[#58595b]"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TimeGutter() {
  return (
    <div>
      {GRID_TIMES.map((start) => (
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
  blocks,
  dateKey,
  label,
  today,
  anchor,
  previewEnd,
  onPick,
  onHover,
  onCreate,
  onReject,
  onRemove,
  draftKind = "LESSON",
}: {
  blocks: TimeBlock[];
  dateKey?: string;
  label?: string;
  today?: boolean;
  anchor?: string | null;
  previewEnd?: string | null;
  onPick?: (time: string) => void;
  onHover?: (time: string | null) => void;
  onCreate?: (block: { start: string; end: string }) => void;
  draftKind?: AvailabilityKind;
  onReject?: (message: string | null) => void;
  onRemove: (block: TimeBlock) => void;
}) {
  const dragRef = useRef<{ origin: string; current: string } | null>(null);
  const [draft, setDraft] = useState<{ start: string; end: string } | null>(null);
  const preview = draft ?? (anchor && previewEnd && previewEnd > anchor ? { start: anchor, end: previewEnd } : null);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!onCreate || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-remove]")) return;
    const cell = (event.target as HTMLElement).closest("[data-slot]");
    const time = cell?.getAttribute("data-time");
    if (!time || time === DAY_END || covers(blocks, time)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { origin: time, current: time };
    setDraft(rangeBlock(time, time));
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
    const time = cell?.getAttribute("data-time");
    if (!time || time === drag.current) return;
    drag.current = time;
    setDraft(rangeBlock(drag.origin, time));
  }

  function finishDrag() {
    const drag = dragRef.current;
    dragRef.current = null;
    setDraft(null);
    if (!drag || !onCreate || drag.origin === drag.current) return;
    const block = rangeBlock(drag.origin, drag.current);
    if (!block) return;
    if (blocks.some((existing) => blocksOverlap(existing, block))) {
      onReject?.("Dat blok overlapt een blok dat er al staat.");
      return;
    }
    onReject?.(null);
    onCreate(block);
  }

  return (
    <div
      className={`relative border-l border-[#f4f4f5] ${today ? "bg-[#fff7f7]" : "bg-white"} ${onCreate ? "touch-none" : ""}`}
      onMouseLeave={() => onHover?.(null)}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {GRID_TIMES.map((time) => {
        const minute = time.slice(3);
        const line = minute === "00" ? "border-t border-[#e4e4e7]" : minute === "30" ? "border-t border-[#f4f4f5]" : "";
        if (onPick) {
          return (
            <button
              key={time}
              type="button"
              data-slot=""
              data-time={time}
              aria-label={label ? `${label} ${time}` : time}
              onClick={() => onPick(time)}
              onMouseEnter={() => onHover?.(time)}
              className={`block w-full ${line} hover:bg-black/[0.025]`}
              style={{ height: QUARTER_PX }}
            />
          );
        }
        return (
          <div
            key={time}
            data-slot=""
            data-date={dateKey}
            data-time={time}
            className={`block w-full ${line}`}
            style={{ height: QUARTER_PX }}
          />
        );
      })}
      {preview && (
        <div
          className={`pointer-events-none absolute inset-x-1.5 rounded-lg ${kindSurface(draftKind, true)}`}
          style={blockStyle(preview)}
        >
          <span className="block px-1.5 pt-1 text-[11px] font-semibold leading-tight tabular-nums">
            {preview.start}–{preview.end}
            {kindLabel(draftKind) ? ` · ${kindLabel(draftKind)}` : ""}
          </span>
        </div>
      )}
      {blocks.map((block) => (
        <div
          key={`${block.kind}-${block.start}-${block.end}`}
          className={`pointer-events-none absolute inset-x-1.5 overflow-hidden rounded-lg ${kindSurface(block.kind)}`}
          style={blockStyle(block)}
        >
          <span className="block px-1.5 pt-1 pr-6 text-[11px] font-semibold leading-tight tabular-nums">
            {block.start}–{block.end}
            {kindLabel(block.kind) ? ` · ${kindLabel(block.kind)}` : ""}
          </span>
          <button
            type="button"
            aria-label={`Blok ${block.start}–${block.end} weghalen`}
            onClick={() => onRemove(block)}
            data-remove=""
            onPointerDown={(event) => event.stopPropagation()}
            className="pointer-events-auto absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-sm leading-none hover:bg-black/10"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function WeeklyModal({
  rules,
  instructors,
  currentId,
  paintKind,
  onPaintKind,
  saving,
  onClose,
  onSave,
}: {
  rules: AvailabilityInstructor["availabilityRules"];
  instructors: { id: string; name: string }[];
  currentId: string;
  paintKind: AvailabilityKind;
  onPaintKind: (kind: AvailabilityKind) => void;
  saving: boolean;
  onClose: () => void;
  onSave: (instructorIds: string[], weekdays: number[], blocks: TimeBlock[]) => void;
}) {
  const [instructorIds, setInstructorIds] = useState(() => [currentId]);
  const [weekdays, setWeekdays] = useState(() => Array.from(new Set(rules.map((rule) => rule.weekday))));
  const [blocks, setBlocks] = useState(() => weeklyBlocks(rules));
  const [anchor, setAnchor] = useState<string | null>(null);
  const [previewEnd, setPreviewEnd] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setWeekdays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function chooseTime(time: string) {
    if (!anchor) {
      if (time === DAY_END || covers(blocks, time)) return;
      setAnchor(time);
      setLocalError(null);
      return;
    }
    if (time <= anchor) {
      setAnchor(time === DAY_END || covers(blocks, time) ? null : time);
      return;
    }
    const block = { start: anchor, end: time, kind: paintKind };
    setAnchor(null);
    setPreviewEnd(null);
    if (blocks.some((existing) => blocksOverlap(existing, block))) {
      setLocalError("Dat blok overlapt een blok dat er al staat.");
      return;
    }
    setLocalError(null);
    setBlocks((current) => sortBlocks([...current, block]));
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
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#111827]">Blokken</p>
          <KindSwitch kind={paintKind} onChange={onPaintKind} />
        </div>
        <p className="mt-1 text-sm text-[#58595b]">Klik het begin en daarna het einde. Een kruis haalt een blok weg. Zonder blokken op te slaan maakt die dagen leeg.</p>
        {localError && <p className="mt-2 text-sm text-[#ed1c24]">{localError}</p>}
        <div className="mt-3 grid max-h-[28rem] grid-cols-[3.25rem_1fr] overflow-y-auto rounded-xl border border-black/5">
          <TimeGutter />
          <TimeColumn
            blocks={blocks}
            anchor={anchor}
            previewEnd={previewEnd}
            draftKind={paintKind}
            onPick={chooseTime}
            onHover={(time) => setPreviewEnd(anchor && time && time > anchor ? time : null)}
            onRemove={(block) => setBlocks((current) => current.filter((item) => item.start !== block.start || item.end !== block.end))}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Annuleren</button>
          <button type="button" disabled={saving || weekdays.length === 0 || instructorIds.length === 0} onClick={() => onSave(instructorIds, weekdays, blocks)} className={buttonClass}>{blocks.length === 0 ? "Wissen" : "Opslaan"}</button>
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
  paintKind,
  onPaintKind,
  onWeekChange,
  onSaveDay,
  onError,
}: {
  instructor: AvailabilityInstructor;
  days: Date[];
  todayKey: string;
  weekStart: Date;
  saving: boolean;
  paintKind: AvailabilityKind;
  onPaintKind: (kind: AvailabilityKind) => void;
  onWeekChange: (next: Date) => void;
  onSaveDay: (dateKey: string, blocks: TimeBlock[]) => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const weekLabel = `${days[0].toLocaleDateString("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "short" })}`;

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
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
        <p className="text-sm text-[#58595b]">Sleep een {paintKind === "EXAM_PREP" ? "examenblok met 2 uur voorbereiding" : paintKind === "EXAM" ? "examenblok" : "lesblok"}.</p>
        <KindSwitch kind={paintKind} onChange={onPaintKind} />
      </div>
      <div className={`overflow-x-auto ${saving ? "pointer-events-none opacity-60" : ""}`}>
        <div className="min-w-[760px]">
          <div className="sticky top-0 z-10 grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] bg-white">
            <div className="border-b border-[#f4f4f5]" />
            {days.map((day) => {
              const dateKey = brusselsDateKey(day);
              const today = dateKey === todayKey;
              return (
                <div key={dateKey} className={`border-b border-l border-[#f4f4f5] px-2 py-3 text-center ${today ? "bg-[#fff7f7]" : "bg-white"}`}>
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-[#a1a1aa]">{DAY_LABEL.format(day)}</span>
                  <span className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${today ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                    {DAY_NUMBER.format(day)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid select-none grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]">
            <TimeGutter />
            {days.map((day) => {
              const dateKey = brusselsDateKey(day);
              return (
                <TimeColumn
                  key={dateKey}
                  blocks={dayBlocks(instructor, dateKey)}
                  dateKey={dateKey}
                  label={DAY_LABEL.format(day)}
                  today={dateKey === todayKey}
                  draftKind={paintKind}
                  onCreate={(block) => {
                    onError(null);
                    void onSaveDay(dateKey, sortBlocks([...dayBlocks(instructor, dateKey), { ...block, kind: paintKind }]));
                  }}
                  onReject={onError}
                  onRemove={(block) => {
                    onError(null);
                    void onSaveDay(dateKey, dayBlocks(instructor, dateKey).filter((item) => item.start !== block.start || item.end !== block.end));
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
