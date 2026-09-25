"use client";

import { addBrusselsDays, brusselsDateKey, brusselsYmd } from "@/lib/brusselsWeek";

const BRUSSELS = "Europe/Brussels";
const DAY_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric" });
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const todayKey = brusselsDateKey(new Date());
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const slotsByDay = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = brusselsDateKey(new Date(slot.startAt));
    const list = slotsByDay.get(key) ?? [];
    list.push(slot);
    slotsByDay.set(key, list);
  }
  Array.from(slotsByDay.values()).forEach((list) => {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  const navButton =
    "inline-flex h-10 items-center gap-1 rounded-[10px] border border-black/10 bg-white px-3 text-sm font-semibold text-[#111827] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-3 sm:px-4">
        <button type="button" className={navButton} disabled={!canGoPrevious} onClick={() => onWeekChange(addBrusselsDays(weekStart, -7))}>
          <span aria-hidden="true">←</span> Vorige
        </button>
        <p className="text-center text-sm font-extrabold text-[#111827] sm:text-base">{weekLabel(weekStart)}</p>
        <button type="button" className={navButton} disabled={!canGoNext} onClick={() => onWeekChange(addBrusselsDays(weekStart, 7))}>
          Volgende <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className={`relative overflow-x-auto ${loading ? "opacity-60" : ""}`}>
        <div className="grid min-w-[760px] grid-cols-7">
          {days.map((day) => {
            const key = brusselsDateKey(day);
            const daySlots = slotsByDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <section key={key} className={`min-h-[280px] border-r border-black/5 p-2 last:border-r-0 ${isToday ? "bg-[#fff5f5]" : ""}`}>
                <header className="mb-2 px-1 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#58595b]">{capitalize(DAY_LABEL.format(day))}</p>
                  <p className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${isToday ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                    {DAY_NUMBER.format(day)}
                  </p>
                </header>
                <ul className="space-y-2">
                  {daySlots.map((slot) => {
                    const active = selectedSlots
                      ? selectedSlots.some((item) => item.startAt === slot.startAt && item.endAt === slot.endAt && item.instructorName === slot.instructorName)
                      : selectedSlot?.startAt === slot.startAt && selectedSlot?.endAt === slot.endAt;
                    const instructor = slot.instructorName;
                    return (
                      <li key={`${slot.startAt}-${instructor ?? ""}`}>
                        <button
                          type="button"
                          onClick={() => onSelectSlot(slot)}
                          aria-pressed={active}
                          className={`w-full rounded-lg px-2 py-2 text-left text-xs font-semibold transition ${
                            active
                              ? "bg-[#ed1c24] text-white"
                              : "bg-[#111827] text-white hover:bg-[#ed1c24]"
                          }`}
                        >
                          <span className="block">
                            {TIME_LABEL.format(new Date(slot.startAt))}–{TIME_LABEL.format(new Date(slot.endAt))}
                          </span>
                          {instructor && <span className={`mt-0.5 block font-medium ${active ? "text-white/90" : "text-white/75"}`}>{instructor}</span>}
                        </button>
                      </li>
                    );
                  })}
                  {daySlots.length === 0 && <li className="px-1 text-center text-[11px] text-[#58595b]">Geen lessen</li>}
                </ul>
              </section>
            );
          })}
        </div>
        {loading && <div className="absolute inset-0" aria-hidden="true" />}
      </div>
    </div>
  );
}
