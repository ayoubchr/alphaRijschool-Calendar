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
  onConfirm: (slot: BookingSlot) => void;
  onBack: () => void;
}

export function CalendarStep({ packageId, onConfirm, onBack }: CalendarStepProps) {
  const [instructorSlots, setInstructorSlots] = useState<InstructorSlots[]>([]);
  const [selected, setSelected] = useState<BookingSlot | null>(null);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);

    fetch(`/api/availability?packageId=${packageId}&from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => res.json())
      .then(setInstructorSlots);
  }, [packageId]);

  const allSlots: BookingSlot[] = instructorSlots.flatMap((entry) =>
    entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kies je lesmoment</h1>
      <LessonCalendar slots={allSlots} selectedSlot={selected} onSelectSlot={(slot) => setSelected(slot as BookingSlot)} />
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={!selected}
          onClick={() => selected && onConfirm(selected)}
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}
