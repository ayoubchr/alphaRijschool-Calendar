"use client";

import { useEffect, useState } from "react";
import { intervalsOverlap } from "@/components/StartTimeChips";
import { WeekTimeline, type TimelineBlock, type TimelineFree } from "@/components/WeekTimeline";
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
  blockHours?: number;
  exact?: boolean;
  exam?: boolean;
  prep?: boolean;
  onConfirm: (slots: BookingSlot[]) => void;
  onBack: () => void;
}

const WEEKS_AHEAD = 12;
const BRUSSELS = "Europe/Brussels";
const TIME_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit" });
const RANGE_DAY = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long" });
const RANGE_DAY_YEAR = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long", year: "numeric" });
const MOMENT = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

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

export function CalendarStep({ packageId, transmission, lessonCount, blockHours = 2, exact = false, exam = false, prep = false, onConfirm, onBack }: CalendarStepProps) {
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

  const openByTime = groupByStart(
    slots.filter((slot) => !selected.some((item) => intervalsOverlap(item.startAt, item.endAt, slot.startAt, slot.endAt))),
  );
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const todayKey = brusselsDateKey(new Date());
  const freeByDay: Record<string, TimelineFree[]> = {};
  for (const [startAt, options] of openByTime) {
    const key = brusselsDateKey(new Date(startAt));
    const list = freeByDay[key] ?? [];
    list.push({
      startAt,
      endAt: options[0].endAt,
      detail: options.length === 1 ? options[0].instructorName : `${options.length} instructeurs`,
    });
    freeByDay[key] = list;
  }
  const blocksByDay: Record<string, TimelineBlock[]> = {};
  for (const slot of selected) {
    const key = brusselsDateKey(new Date(slot.startAt));
    const list = blocksByDay[key] ?? [];
    list.push({
      id: `${slot.instructorId}-${slot.startAt}`,
      startAt: slot.startAt,
      endAt: slot.endAt,
      detail: slot.instructorName,
      tone: "choice",
      removeLabel: "Moment weghalen",
      onRemove: () => setSelected((current) => current.filter((item) => item.startAt !== slot.startAt)),
    });
    blocksByDay[key] = list;
  }

  function addSlot(slot: BookingSlot) {
    setChoosing(null);
    if (exact && selected.some((item) => brusselsDateKey(new Date(item.startAt)) === brusselsDateKey(new Date(slot.startAt)))) {
      setError("Kies twee verschillende dagen.");
      return;
    }
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
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">{prep ? "Kies je examen met voorbereiding" : exam ? "Kies je examenmoment" : "Kies je lesmomenten"}</h1>
      <p className="mb-5 text-sm text-[#58595b]">
        {prep
          ? "Kies het blok met 2 uur voorbereiding en het praktijkexamen. Je ziet alleen die tijden."
          : exam
          ? "Kies het examenblok dat bij jou past. Je ziet alleen de tijden die voor het praktijkexamen openstaan."
          : exact
            ? `Kies ${lessonCount} dagen van ${blockHours} uur.`
            : `Kies tot ${lessonCount} moment${lessonCount === 1 ? "" : "en"} van ${blockHours} uur. Wat je nu niet inplant, plan je later in je dossier.`}
        {" "}Geselecteerd: {selected.length}/{lessonCount}.
      </p>
      {error && <p className="mb-3 text-sm text-[#ed1c24]">{error}</p>}

      <WeekTimeline
        days={days}
        todayKey={todayKey}
        weekLabel={weekLabel(weekStart)}
        loading={loading}
        canGoPrevious={weekStart.getTime() > currentWeek.getTime()}
        canGoNext={weekStart.getTime() < lastWeek.getTime()}
        onPrevious={() => setWeekStart(addBrusselsDays(weekStart, -7))}
        onNext={() => setWeekStart(addBrusselsDays(weekStart, 7))}
        freeByDay={freeByDay}
        blocksByDay={blocksByDay}
        hint={prep ? "Klik een groen blok. Dat is de voorbereiding en het examen samen." : exam ? "Klik een groen blok. Dat is het hele examen." : exact ? "Klik een groene dag. Die duurt 6 uur." : "Klik een groen blok. Dat is de hele les, bijvoorbeeld van 08:00 tot 10:00."}
        onPickFree={(startAt) => {
          const options = openByTime.get(startAt);
          if (options) openInstructorChoice(options);
        }}
      />

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
          disabled={exact ? selected.length !== lessonCount : selected.length === 0}
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
