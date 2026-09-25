"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { addBrusselsDays, brusselsDateKey, brusselsYmd, startOfBrusselsWeek } from "@/lib/brusselsWeek";

export type BookingSlot = {
  startAt: string;
  endAt: string;
  instructorId: string;
  instructorName: string;
};

interface InstructorSlots {
  instructorId: string;
  instructorName: string;
  slots: { startAt: string; endAt: string }[];
}

interface CalendarStepProps {
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  lessonCount: number;
  onConfirm: (slots: BookingSlot[]) => void;
  onBack: () => void;
}

const WEEKS_AHEAD = 12;
const BRUSSELS = "Europe/Brussels";
const DAY_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric" });
const TIME_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit" });
const RANGE_DAY = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long" });
const RANGE_DAY_YEAR = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long", year: "numeric" });
const MOMENT = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function weekLabel(weekStart: Date) {
  const weekEnd = addBrusselsDays(weekStart, 6);
  const start = brusselsYmd(weekStart);
  const end = brusselsYmd(weekEnd);
  if (start.year === end.year && start.month === end.month) return `${start.day} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
  if (start.year === end.year) return `${RANGE_DAY.format(weekStart)} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
  return `${RANGE_DAY_YEAR.format(weekStart)} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
}

function groupByStart(slots: BookingSlot[]) {
  const grouped = new Map<string, BookingSlot[]>();
  for (const slot of slots) {
    const list = grouped.get(slot.startAt) ?? [];
    if (!list.some((item) => item.instructorId === slot.instructorId)) list.push(slot);
    grouped.set(slot.startAt, list);
  }
  return grouped;
}

export function CalendarStep({ packageId, transmission, lessonCount, onConfirm, onBack }: CalendarStepProps) {
  const [weekStart, setWeekStart] = useState(() => startOfBrusselsWeek(new Date()));
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selected, setSelected] = useState<BookingSlot[]>([]);
  const [choosing, setChoosing] = useState<BookingSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentWeek = startOfBrusselsWeek(new Date());
  const lastWeek = addBrusselsDays(currentWeek, WEEKS_AHEAD * 7);

  useEffect(() => {
    const controller = new AbortController();
    const now = new Date();
    const from = weekStart.getTime() < now.getTime() ? now : weekStart;
    const to = addBrusselsDays(weekStart, 7);
    setLoading(true);

    fetch(
      `/api/availability?packageId=${packageId}&from=${from.toISOString()}&to=${to.toISOString()}&transmission=${transmission}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data: InstructorSlots[]) => {
        if (controller.signal.aborted || !Array.isArray(data)) return;
        setSlots(data.flatMap((entry) => entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))));
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        if (!controller.signal.aborted) setSlots([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [packageId, transmission, weekStart]);

  useEffect(() => {
    if (!choosing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setChoosing(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choosing]);

  const takenTimes = new Set(selected.map((slot) => slot.startAt));
  const openByTime = groupByStart(slots.filter((slot) => !takenTimes.has(slot.startAt)));
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const todayKey = brusselsDateKey(new Date());
  const navButton =
    "inline-flex h-10 items-center gap-1 rounded-[10px] border border-black/10 bg-white px-3 text-sm font-semibold text-[#111827] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-40";

  function addSlot(slot: BookingSlot) {
    setChoosing(null);
    setError(null);
    setSelected((current) => {
      if (current.some((item) => item.startAt === slot.startAt)) return current;
      if (current.length >= lessonCount) return current;
      return [...current, slot];
    });
  }

  function openInstructorChoice(options: BookingSlot[]) {
    if (selected.length >= lessonCount) {
      setError(`Je kan maximaal ${lessonCount} moment${lessonCount === 1 ? "" : "en"} kiezen.`);
      return;
    }
    if (options.length === 1) {
      addSlot(options[0]);
      return;
    }
    setError(null);
    setChoosing([...options].sort((a, b) => a.instructorName.localeCompare(b.instructorName, "nl")));
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Kies je lesmomenten</h1>
      <p className="mb-5 text-sm text-[#58595b]">
        Kies tot {lessonCount} moment{lessonCount === 1 ? "" : "en"} van 2 uur. Wat je nu niet inplant, plan je later in je dossier.
        Geselecteerd: {selected.length}/{lessonCount}.
      </p>
      {error && <p className="mb-3 text-sm text-[#ed1c24]">{error}</p>}

      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-3 sm:px-4">
          <button type="button" className={navButton} disabled={weekStart.getTime() <= currentWeek.getTime()} onClick={() => setWeekStart(addBrusselsDays(weekStart, -7))}>
            <span aria-hidden="true">←</span> Vorige
          </button>
          <p className="text-center text-sm font-extrabold text-[#111827] sm:text-base">{weekLabel(weekStart)}</p>
          <button type="button" className={navButton} disabled={weekStart.getTime() >= lastWeek.getTime()} onClick={() => setWeekStart(addBrusselsDays(weekStart, 7))}>
            Volgende <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={`relative overflow-x-auto ${loading ? "opacity-60" : ""}`}>
          <div className="grid min-w-[760px] grid-cols-7">
            {days.map((day) => {
              const key = brusselsDateKey(day);
              const daySelected = selected.filter((slot) => brusselsDateKey(new Date(slot.startAt)) === key);
              const dayFree = [...openByTime.entries()]
                .filter(([startAt]) => brusselsDateKey(new Date(startAt)) === key)
                .map(([startAt, options]) => ({ startAt, options }));
              const cards = [
                ...daySelected.map((slot) => ({ kind: "selected" as const, slot, at: slot.startAt })),
                ...dayFree.map((group) => ({ kind: "free" as const, group, at: group.startAt })),
              ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
              return (
                <section key={key} className={`min-h-[280px] border-r border-black/5 p-2 last:border-r-0 ${key === todayKey ? "bg-[#fff5f5]" : ""}`}>
                  <header className="mb-2 px-1 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#58595b]">{capitalize(DAY_LABEL.format(day))}</p>
                    <p className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${key === todayKey ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                      {DAY_NUMBER.format(day)}
                    </p>
                  </header>
                  <ul className="space-y-2">
                    {cards.map((card) => {
                      if (card.kind === "selected") {
                        const { slot } = card;
                        return (
                          <li key={`${slot.instructorId}-${slot.startAt}`} className="relative">
                            <div className="rounded-lg bg-[#ed1c24] px-2 py-2 pr-7 text-left text-xs font-semibold text-white">
                              <span className="block">
                                {TIME_LABEL.format(new Date(slot.startAt))}–{TIME_LABEL.format(new Date(slot.endAt))}
                              </span>
                              <span className="mt-0.5 block font-medium text-white/90">{slot.instructorName}</span>
                            </div>
                            <button
                              type="button"
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white hover:bg-white/20"
                              aria-label="Moment weghalen"
                              onClick={() => setSelected((current) => current.filter((item) => item.startAt !== slot.startAt))}
                            >
                              <IoClose className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      }
                      const { group } = card;
                      const label = group.options.length === 1 ? group.options[0].instructorName : `${group.options.length} instructeurs`;
                      return (
                        <li key={group.startAt}>
                          <button
                            type="button"
                            onClick={() => openInstructorChoice(group.options)}
                            className="w-full rounded-lg border border-dashed border-black/15 bg-[#f9f9f9] px-2 py-2 text-left text-xs text-[#58595b] transition hover:border-[#111827]"
                          >
                            <span className="block font-bold text-[#111827]">
                              {TIME_LABEL.format(new Date(group.startAt))}–{TIME_LABEL.format(new Date(group.options[0].endAt))}
                            </span>
                            <span className="mt-0.5 block">Vrij · {label}</span>
                          </button>
                        </li>
                      );
                    })}
                    {cards.length === 0 && <li className="px-1 text-center text-[11px] text-[#58595b]">{loading ? "Laden…" : "Geen lessen"}</li>}
                  </ul>
                </section>
              );
            })}
          </div>
          {loading && <div className="absolute inset-0" aria-hidden="true" />}
        </div>
      </div>

      {selected.length > 0 && (
        <ul className="mt-4 space-y-2 rounded-[10px] bg-[#f9f9f9] px-4 py-3 text-sm">
          {selected.map((slot) => (
            <li key={`${slot.instructorId}-${slot.startAt}`}>
              <strong>{MOMENT.format(new Date(slot.startAt))}</strong> · {slot.instructorName}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={selected.length === 0}
          onClick={() => onConfirm(selected)}
          className="rounded-[10px] bg-[#ed1c24] px-6 py-3 font-semibold text-white transition hover:bg-[#111827] disabled:opacity-40"
        >
          Volgende
        </button>
      </div>

      {choosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation" onClick={() => setChoosing(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="instructeur-titel" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 id="instructeur-titel" className="text-lg font-extrabold text-[#111827]">Kies een instructeur</h3>
            <p className="mt-2 text-sm text-[#58595b]">
              {TIME_LABEL.format(new Date(choosing[0].startAt))}–{TIME_LABEL.format(new Date(choosing[0].endAt))}
            </p>
            <ul className="mt-4 space-y-2">
              {choosing.map((slot) => (
                <li key={slot.instructorId}>
                  <button
                    type="button"
                    className="w-full rounded-[10px] border border-black/10 px-4 py-3 text-left text-sm font-semibold text-[#111827] transition hover:border-[#ed1c24] hover:text-[#ed1c24]"
                    onClick={() => addSlot(slot)}
                  >
                    {slot.instructorName}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end">
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-[#111827]" onClick={() => setChoosing(null)}>
                Terug
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
