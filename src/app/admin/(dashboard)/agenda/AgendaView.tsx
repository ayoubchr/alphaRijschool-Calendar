"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { LessonCalendar, type Slot } from "@/components/LessonCalendar";
import { addBrusselsDays, brusselsDateKey, brusselsMidnight, brusselsYmd, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { cancelAgendaLesson, moveAgendaLesson } from "./actions";

interface AgendaLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
    dossierId: string;
    dossier: { firstName: string; lastName: string };
  instructor: { name: string };
  instructorId: string;
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  canChange: boolean;
}

function formatSlot(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const date = start.toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", weekday: "short", day: "numeric", month: "short" });
  const from = start.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  const to = end.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  return `${date} · ${from}–${to}`;
}

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const LESSON_CHIP: Record<string, string> = {
  PLANNED: "border-amber-200 bg-amber-50 text-amber-950",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-950",
};
const MONTH = new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", month: "long", year: "numeric" });
const TIME = new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });

function SearchField({
  id,
  label,
  placeholder,
  emptyLabel,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  emptyLabel: string;
  options: [string, string][];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = options.find(([optionId]) => optionId === value)?.[1] ?? "";
  const [query, setQuery] = useState(selected);
  const [open, setOpen] = useState(false);
  const needle = query.trim().toLocaleLowerCase("nl");
  const matches = options.filter(([, name]) => name.toLocaleLowerCase("nl").includes(needle)).slice(0, 8);

  return (
    <div className="relative text-sm font-semibold text-[#111827]" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          if (!next.trim()) onChange("all");
        }}
        className="mt-1 block w-52 rounded-[10px] border border-black/10 bg-white px-3 py-2 font-medium outline-none focus:border-[#111827]"
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-60 w-52 overflow-y-auto rounded-[10px] border border-black/10 bg-white py-1 shadow-lg">
          {matches.map(([optionId, name]) => (
            <li key={optionId}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { onChange(optionId); setQuery(name); setOpen(false); }}
                className={`block w-full px-3 py-2 text-left font-medium hover:bg-[#f4f4f5] ${optionId === value ? "text-[#ed1c24]" : "text-[#111827]"}`}
              >
                {name}
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-2 font-medium text-[#58595b]">{emptyLabel}</li>}
        </ul>
      )}
    </div>
  );
}

function shiftMonth(cursor: Date, delta: number) {
  const { year, month } = brusselsYmd(cursor);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return brusselsMidnight(next.getUTCFullYear(), next.getUTCMonth() + 1, 1);
}

export function AgendaView({
  lessons: initialLessons,
  instructors,
  isAdmin,
}: {
  lessons: AgendaLesson[];
  instructors: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [cursor, setCursor] = useState(() => {
    const { year, month } = brusselsYmd(new Date());
    return brusselsMidnight(year, month, 1);
  });
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [dossierFilter, setDossierFilter] = useState("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(brusselsDateKey(new Date()));
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [moving, setMoving] = useState<AgendaLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setError(null);
    setPendingId(id);
    const result = await cancelAgendaLesson(id);
    setPendingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLessons((prev) => prev.map((lesson) => (lesson.id === id ? { ...lesson, status: result.status } : lesson)));
    setNotices((prev) => ({
      ...prev,
      [id]: result.refundEligible ? "Tegoed hersteld." : "Voorschot vervalt (binnen 48u).",
    }));
  }

  const dossierOptions = Array.from(new Map(lessons.map((lesson) => [lesson.dossierId, `${lesson.dossier.firstName} ${lesson.dossier.lastName}`])).entries()).sort((a, b) => a[1].localeCompare(b[1], "nl"));
  const visible = lessons.filter((lesson) => (instructorFilter === "all" || lesson.instructorId === instructorFilter) && (dossierFilter === "all" || lesson.dossierId === dossierFilter));
  const { year, month } = brusselsYmd(cursor);
  const gridStart = startOfBrusselsWeek(cursor);
  const days = Array.from({ length: 42 }, (_, index) => addBrusselsDays(gridStart, index));
  const byDay = new Map<string, AgendaLesson[]>();
  for (const lesson of visible) {
    const key = brusselsDateKey(new Date(lesson.startAt));
    const list = byDay.get(key) ?? [];
    list.push(lesson);
    byDay.set(key, list);
  }
  const dayLessons = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Agenda</h1>
          <p className="mt-1 text-sm text-[#58595b]">Maandoverzicht van geplande lessen. Kies een dag om te verplaatsen of te annuleren.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && instructors.length > 0 && (
            <SearchField
              id="instructeur-zoeken"
              label="Instructeur"
              placeholder="Zoek een instructeur"
              emptyLabel="Geen instructeur gevonden"
              options={instructors.map((instructor) => [instructor.id, instructor.name])}
              value={instructorFilter}
              onChange={setInstructorFilter}
            />
          )}
          {dossierOptions.length > 0 && (
            <SearchField
              id="dossier-zoeken"
              label="Dossier"
              placeholder="Zoek een dossier"
              emptyLabel="Geen dossier gevonden"
              options={dossierOptions}
              value={dossierFilter}
              onChange={setDossierFilter}
            />
          )}
        </div>
      </div>
      {error && <p className="mb-4 text-sm text-[#ed1c24]">{error}</p>}
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-3">
          <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => setCursor(shiftMonth(cursor, -1))}>← Vorige</button>
          <div className="text-center">
            <p className="text-sm font-extrabold capitalize text-[#111827]">{MONTH.format(cursor)}</p>
            <p className="mt-1 flex justify-center gap-2 text-[10px] font-semibold">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-950">Bevestigd</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-950">Gepland</span>
            </p>
          </div>
          <button type="button" className="rounded-[10px] border border-black/10 px-3 py-2 text-sm font-semibold" onClick={() => setCursor(shiftMonth(cursor, 1))}>Volgende →</button>
        </div>
        <div className="grid grid-cols-7 border-b border-black/5 bg-[#f9f9f9] text-center text-[11px] font-bold uppercase tracking-wide text-[#58595b]">
          {WEEKDAYS.map((label) => <div key={label} className="px-1 py-2">{label}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = brusselsDateKey(day);
            const inMonth = brusselsYmd(day).month === month && brusselsYmd(day).year === year;
            const items = byDay.get(key) ?? [];
            const selected = key === selectedDay;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`min-h-24 border-b border-r border-black/5 p-1.5 text-left last:border-r-0 ${selected ? "bg-[#fff5f5]" : "bg-white"} ${inMonth ? "" : "opacity-40"}`}
              >
                <span className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${key === brusselsDateKey(new Date()) ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                  {brusselsYmd(day).day}
                </span>
                <span className="block space-y-1">
                  {items.slice(0, 2).map((lesson) => (
                    <span key={lesson.id} className={`block truncate rounded border px-1 py-0.5 text-[10px] font-semibold ${LESSON_CHIP[lesson.status] ?? "border-black/10 bg-[#f9f9f9] text-[#111827]"}`}>
                      {TIME.format(new Date(lesson.startAt))} {lesson.dossier.firstName}
                    </span>
                  ))}
                  {items.length > 2 && <span className="block text-[10px] font-semibold text-[#58595b]">+{items.length - 2}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 rounded-[10px] border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#111827]">{selectedDay ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" }) : "Kies een dag"}</h2>
        {dayLessons.length === 0 ? (
          <p className="mt-3 text-sm text-[#58595b]">Geen lessen op deze dag.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {dayLessons.map((lesson) => (
              <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#111827]">{formatSlot(lesson.startAt, lesson.endAt)} · {lesson.dossier.firstName} {lesson.dossier.lastName}</p>
                  <p className="text-[#58595b]">{lesson.instructor.name}</p>
                  {notices[lesson.id] && <p className="text-xs text-[#58595b]">{notices[lesson.id]}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lesson.status} />
                  {lesson.canChange && (
                    <>
                      <button type="button" onClick={() => setMoving(lesson)} className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold">Verplaatsen</button>
                      <button type="button" disabled={pendingId === lesson.id} onClick={() => handleCancel(lesson.id)} className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#ed1c24] disabled:opacity-50">Annuleren</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {moving && (
        <AgendaSlotPicker
          lesson={moving}
          onClose={() => setMoving(null)}
          onMoved={(startAt, endAt, instructorName) => {
            setLessons((prev) => prev.map((item) => (item.id === moving.id ? { ...item, startAt, endAt, instructor: { name: instructorName }, instructorId: moving.instructorId } : item)));
            setMoving(null);
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function AgendaSlotPicker({
  lesson,
  onClose,
  onMoved,
  onError,
}: {
  lesson: AgendaLesson;
  onClose: () => void;
  onMoved: (startAt: string, endAt: string, instructorName: string) => void;
  onError: (message: string) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfBrusselsWeek(new Date()));
  const [slots, setSlots] = useState<(Slot & { instructorId: string; instructorName: string })[]>([]);
  const [selected, setSelected] = useState<(Slot & { instructorId: string; instructorName: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const to = addBrusselsDays(weekStart, 7);
    setLoading(true);
    fetch(`/api/availability?packageId=${lesson.packageId}&from=${weekStart.toISOString()}&to=${to.toISOString()}&transmission=${lesson.transmission}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { instructorId: string; instructorName: string; slots: Slot[] }[]) => {
        if (!controller.signal.aborted && Array.isArray(data)) {
          setSlots(data.flatMap((entry) => entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))));
        }
      })
      .catch(() => { if (!controller.signal.aborted) setSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [lesson.packageId, lesson.transmission, weekStart]);

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-extrabold">Nieuw moment voor {lesson.dossier.firstName}</h2>
      <LessonCalendar
        slots={slots}
        selectedSlot={selected}
        weekStart={weekStart}
        canGoPrevious
        canGoNext
        loading={loading}
        onWeekChange={setWeekStart}
        onSelectSlot={(slot) => setSelected(slot as Slot & { instructorId: string; instructorName: string })}
      />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Sluiten</button>
        <button
          type="button"
          disabled={!selected || saving}
          onClick={async () => {
            if (!selected) return;
            setSaving(true);
            const result = await moveAgendaLesson({ id: lesson.id, instructorId: selected.instructorId, startAt: selected.startAt, endAt: selected.endAt });
            setSaving(false);
            if (!result.ok) onError(result.error);
            else onMoved(selected.startAt, selected.endAt, selected.instructorName);
          }}
          className="rounded-[10px] bg-[#111827] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}
