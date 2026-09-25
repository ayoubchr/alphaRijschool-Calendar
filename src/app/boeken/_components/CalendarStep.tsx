"use client";

import { useEffect, useState } from "react";
import { LessonCalendar, type Slot } from "@/components/LessonCalendar";
import { addBrusselsDays, startOfBrusselsWeek } from "@/lib/brusselsWeek";

export type BookingSlot = Slot & { instructorId: string; instructorName: string };

interface InstructorSlots {
  instructorId: string;
  instructorName: string;
  slots: Slot[];
}

interface CalendarStepProps {
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  lessonCount: number;
  onConfirm: (slots: BookingSlot[]) => void;
  onBack: () => void;
}

const WEEKS_AHEAD = 12;

export function CalendarStep({ packageId, transmission, lessonCount, onConfirm, onBack }: CalendarStepProps) {
  const [weekStart, setWeekStart] = useState(() => startOfBrusselsWeek(new Date()));
  const [instructorSlots, setInstructorSlots] = useState<InstructorSlots[]>([]);
  const [selected, setSelected] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (!controller.signal.aborted) setInstructorSlots(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (!controller.signal.aborted) setInstructorSlots([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [packageId, transmission, weekStart]);

  const allSlots: BookingSlot[] = instructorSlots.flatMap((entry) =>
    entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Kies je lesmomenten</h1>
      <p className="mb-5 text-sm text-[#58595b]">
        Kies tot {lessonCount} moment{lessonCount === 1 ? "" : "en"} van 2 uur. Wat je nu niet inplant, plan je later in je dossier.
        Geselecteerd: {selected.length}/{lessonCount}.
      </p>
      <LessonCalendar
        slots={allSlots}
        selectedSlot={null}
        selectedSlots={selected}
        weekStart={weekStart}
        canGoPrevious={weekStart.getTime() > currentWeek.getTime()}
        canGoNext={weekStart.getTime() < lastWeek.getTime()}
        loading={loading}
        onWeekChange={setWeekStart}
        onSelectSlot={(slot) => {
          const chosen = slot as BookingSlot;
          setSelected((current) => {
            const exists = current.some((item) => item.startAt === chosen.startAt && item.instructorId === chosen.instructorId);
            if (exists) return current.filter((item) => !(item.startAt === chosen.startAt && item.instructorId === chosen.instructorId));
            if (current.length >= lessonCount) return current;
            return [...current, chosen];
          });
        }}
      />
      {loading && allSlots.length === 0 && (
        <p className="sr-only" role="status">Beschikbare lessen laden…</p>
      )}
      {selected.length > 0 && (
        <ul className="mt-4 space-y-2 rounded-[10px] bg-[#f9f9f9] px-4 py-3 text-sm">
          {selected.map((slot) => (
            <li key={`${slot.instructorId}-${slot.startAt}`}>
              <strong>{new Date(slot.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })}</strong> · {slot.instructorName}
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
    </div>
  );
}
