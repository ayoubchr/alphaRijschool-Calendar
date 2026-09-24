"use client";

import { useEffect, useState } from "react";
import { LessonCalendar, type Slot } from "@/components/LessonCalendar";

export type BookingSlot = Slot & { instructorId: string; instructorName: string };

interface InstructorSlots {
  instructorId: string;
  instructorName: string;
  slots: Slot[];
}

interface CalendarStepProps {
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  onConfirm: (slot: BookingSlot) => void;
  onBack: () => void;
}

export function CalendarStep({ packageId, transmission, onConfirm, onBack }: CalendarStepProps) {
  const [instructorSlots, setInstructorSlots] = useState<InstructorSlots[]>([]);
  const [selected, setSelected] = useState<BookingSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);
    setLoading(true);

    fetch(
      `/api/availability?packageId=${packageId}&from=${from.toISOString()}&to=${to.toISOString()}&transmission=${transmission}`
    )
      .then((res) => res.json())
      .then(setInstructorSlots)
      .finally(() => setLoading(false));
  }, [packageId, transmission]);

  const allSlots: BookingSlot[] = instructorSlots.flatMap((entry) =>
    entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Kies je lesmoment</h1>
      <p className="mb-5 text-sm text-[#58595b]">Klik een vrij moment aan. Het geselecteerde uur kleurt rood.</p>
      {loading ? (
        <div className="flex h-[420px] flex-col items-center justify-center gap-3 rounded-[10px] border border-black/10 bg-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ed1c24]/20 border-t-[#ed1c24]" role="status" aria-label="Kalender laden" />
          <p className="text-sm text-[#58595b]">Beschikbare lessen laden…</p>
        </div>
      ) : (
        <LessonCalendar slots={allSlots} selectedSlot={selected} onSelectSlot={(slot) => setSelected(slot as BookingSlot)} />
      )}
      {selected && (
        <p className="mt-4 rounded-[10px] bg-[#f9f9f9] px-4 py-3 text-sm">
          Gekozen:{" "}
          <strong>
            {new Date(selected.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })} · {selected.instructorName}
          </strong>
        </p>
      )}
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={!selected}
          onClick={() => selected && onConfirm(selected)}
          className="rounded-[10px] bg-[#ed1c24] px-6 py-3 font-semibold text-white transition hover:bg-[#111827] disabled:opacity-40"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}
