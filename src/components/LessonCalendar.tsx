"use client";

import { useState } from "react";
import { WeekTimeline, type TimelineFree } from "@/components/WeekTimeline";
import { addBrusselsDays, brusselsDateKey, brusselsYmd } from "@/lib/brusselsWeek";

const BRUSSELS = "Europe/Brussels";
const TIME_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit" });
const RANGE_DAY = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long" });
const RANGE_DAY_YEAR = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long", year: "numeric" });

export interface Slot {
  startAt: string;
  endAt: string;
  instructorName?: string;
}

interface LessonCalendarProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  selectedSlots?: Slot[];
  weekStart: Date;
  canGoPrevious: boolean;
  canGoNext: boolean;
  loading?: boolean;
  onWeekChange: (weekStart: Date) => void;
  onSelectSlot: (slot: Slot) => void;
}

function weekLabel(weekStart: Date) {
  const weekEnd = addBrusselsDays(weekStart, 6);
  const start = brusselsYmd(weekStart);
  const end = brusselsYmd(weekEnd);
  if (start.year === end.year && start.month === end.month) {
    return `${start.day} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
  }
  if (start.year === end.year) {
    return `${RANGE_DAY.format(weekStart)} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
  }
  return `${RANGE_DAY_YEAR.format(weekStart)} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
}

export function LessonCalendar({
  slots,
  selectedSlot,
  selectedSlots,
  weekStart,
  canGoPrevious,
  canGoNext,
  loading = false,
  onWeekChange,
  onSelectSlot,
}: LessonCalendarProps) {
  const [choosing, setChoosing] = useState<Slot[] | null>(null);
  const todayKey = brusselsDateKey(new Date());
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const chosen = selectedSlots ?? [];
  const freeByDay: Record<string, TimelineFree[]> = {};
  const byStart = new Map<string, Slot[]>();
  for (const slot of slots) {
    const list = byStart.get(slot.startAt) ?? [];
    list.push(slot);
    byStart.set(slot.startAt, list);
  }
  for (const [startAt, options] of byStart) {
    if (chosen.some((item) => item.startAt === startAt)) continue;
    const key = brusselsDateKey(new Date(startAt));
    const list = freeByDay[key] ?? [];
    list.push({
      startAt,
      endAt: options[0].endAt,
      detail: options.length === 1 ? options[0].instructorName : `${options.length} instructeurs`,
    });
    freeByDay[key] = list;
  }
  const blocksByDay: Record<string, { id: string; startAt: string; endAt: string; detail?: string; tone: "choice"; onRemove?: () => void }[]> = {};
  for (const slot of chosen) {
    const key = brusselsDateKey(new Date(slot.startAt));
    const list = blocksByDay[key] ?? [];
    list.push({
      id: `${slot.startAt}-${slot.instructorName ?? ""}`,
      startAt: slot.startAt,
      endAt: slot.endAt,
      detail: slot.instructorName,
      tone: "choice",
    });
    blocksByDay[key] = list;
  }

  function pick(startAt: string) {
    const options = byStart.get(startAt) ?? [];
    if (options.length === 1) onSelectSlot(options[0]);
    else if (options.length > 1) setChoosing(options);
  }

  return (
    <>
      <WeekTimeline
        days={days}
        todayKey={todayKey}
        weekLabel={weekLabel(weekStart)}
        loading={loading}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={() => onWeekChange(addBrusselsDays(weekStart, -7))}
        onNext={() => onWeekChange(addBrusselsDays(weekStart, 7))}
        freeByDay={freeByDay}
        blocksByDay={blocksByDay}
        highlight={selectedSlot}
        hint="Klik in het groen. Dat is het startuur, de les duurt daarna 2 uur."
        onPickFree={pick}
      />
      {choosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation" onClick={() => setChoosing(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="start-instructeur" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 id="start-instructeur" className="text-lg font-extrabold text-[#111827]">Kies een instructeur</h3>
            <p className="mt-2 text-sm text-[#58595b]">
              {TIME_LABEL.format(new Date(choosing[0].startAt))}–{TIME_LABEL.format(new Date(choosing[0].endAt))}
            </p>
            <ul className="mt-4 space-y-2">
              {choosing.map((slot) => (
                <li key={`${slot.startAt}-${slot.instructorName ?? ""}`}>
                  <button
                    type="button"
                    className="w-full rounded-[10px] border border-black/10 px-4 py-3 text-left text-sm font-semibold text-[#111827] transition hover:border-[#ed1c24] hover:text-[#ed1c24]"
                    onClick={() => {
                      onSelectSlot(slot);
                      setChoosing(null);
                    }}
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
    </>
  );
}
