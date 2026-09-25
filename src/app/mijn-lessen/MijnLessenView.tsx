"use client";

import { useEffect, useState } from "react";
import { LessonCalendar, type Slot } from "@/components/LessonCalendar";
import { addBrusselsDays, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { cancelOwnLesson, logoutStudent, moveOwnLesson, planLessons } from "./actions";

export interface StudentDossier {
  id: string;
  firstName: string;
  packageName: string;
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  hoursRemaining: number;
  lessons: {
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    instructorName: string;
    canChange: boolean;
  }[];
}

type BookingSlot = Slot & { instructorId: string; instructorName: string };

export function MijnLessenView({ dossiers }: { dossiers: StudentDossier[] }) {
  const [error, setError] = useState<string | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827]">Mijn lessen</h1>
          <p className="mt-2 text-sm text-[#58595b]">Plan resterende uren, of annuleer en verplaats tot 2 dagen op voorhand.</p>
        </div>
        <form action={logoutStudent}>
          <button className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Uitloggen</button>
        </form>
      </div>
      {error && <p className="mb-4 text-sm text-[#ed1c24]">{error}</p>}
      {dossiers.length === 0 && <p className="text-sm text-[#58595b]">Er staat nog geen dossier op dit adres.</p>}
      <div className="space-y-8">
        {dossiers.map((dossier) => (
          <section key={dossier.id} className="rounded-[10px] border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#111827]">{dossier.packageName}</h2>
            <p className="mt-1 text-sm text-[#58595b]">Resterend tegoed: {dossier.hoursRemaining} uur</p>
            <ul className="mt-4 space-y-2">
              {dossier.lessons.map((lesson) => (
                <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#f9f9f9] px-3 py-3 text-sm">
                  <span>
                    {new Date(lesson.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })} · {lesson.instructorName} · {lesson.status}
                  </span>
                  {lesson.canChange && (
                    <span className="flex gap-2">
                      <button type="button" className="font-semibold text-[#111827]" onClick={() => { setMovingId(lesson.id); setPlanningId(null); }}>Verplaatsen</button>
                      <button
                        type="button"
                        className="font-semibold text-[#ed1c24]"
                        onClick={async () => {
                          setError(null);
                          const result = await cancelOwnLesson(lesson.id);
                          if (!result.ok) setError(result.error);
                        }}
                      >
                        Annuleren
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {movingId && dossier.lessons.some((lesson) => lesson.id === movingId) && (
              <SlotPicker
                packageId={dossier.packageId}
                transmission={dossier.transmission}
                maxSlots={1}
                onConfirm={async (slots) => {
                  const slot = slots[0];
                  const result = await moveOwnLesson({ lessonId: movingId, instructorId: slot.instructorId, startAt: slot.startAt, endAt: slot.endAt });
                  if (!result.ok) setError(result.error);
                  else setMovingId(null);
                }}
                onClose={() => setMovingId(null)}
              />
            )}
            {dossier.hoursRemaining >= 2 && (
              <button type="button" className="mt-4 rounded-[10px] bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white" onClick={() => { setPlanningId(dossier.id); setMovingId(null); }}>
                Les inplannen
              </button>
            )}
            {planningId === dossier.id && (
              <SlotPicker
                packageId={dossier.packageId}
                transmission={dossier.transmission}
                maxSlots={Math.floor(dossier.hoursRemaining / 2)}
                onConfirm={async (slots) => {
                  const result = await planLessons({
                    dossierId: dossier.id,
                    slots: slots.map((slot) => ({ instructorId: slot.instructorId, startAt: slot.startAt, endAt: slot.endAt })),
                  });
                  if (!result.ok) setError(result.error);
                  else setPlanningId(null);
                }}
                onClose={() => setPlanningId(null)}
              />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function SlotPicker({
  packageId,
  transmission,
  maxSlots,
  onConfirm,
  onClose,
}: {
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  maxSlots: number;
  onConfirm: (slots: BookingSlot[]) => Promise<void>;
  onClose: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfBrusselsWeek(new Date()));
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selected, setSelected] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const from = weekStart;
    const to = addBrusselsDays(weekStart, 7);
    setLoading(true);
    fetch(`/api/availability?packageId=${packageId}&from=${from.toISOString()}&to=${to.toISOString()}&transmission=${transmission}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { instructorId: string; instructorName: string; slots: Slot[] }[]) => {
        if (controller.signal.aborted || !Array.isArray(data)) return;
        setSlots(data.flatMap((entry) => entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))));
      })
      .catch(() => { if (!controller.signal.aborted) setSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [packageId, transmission, weekStart]);

  return (
    <div className="mt-4">
      <p className="mb-3 text-sm text-[#58595b]">Kies tot {maxSlots} moment{maxSlots === 1 ? "" : "en"}.</p>
      <LessonCalendar
        slots={slots}
        selectedSlot={null}
        selectedSlots={selected}
        weekStart={weekStart}
        canGoPrevious
        canGoNext
        loading={loading}
        onWeekChange={setWeekStart}
        onSelectSlot={(slot) => {
          const chosen = slot as BookingSlot;
          setSelected((current) => {
            const exists = current.some((item) => item.startAt === chosen.startAt && item.instructorId === chosen.instructorId);
            if (exists) return current.filter((item) => !(item.startAt === chosen.startAt && item.instructorId === chosen.instructorId));
            if (current.length >= maxSlots) return current;
            return [...current, chosen];
          });
        }}
      />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-semibold">Annuleren</button>
        <button
          type="button"
          disabled={selected.length === 0 || saving}
          onClick={async () => { setSaving(true); await onConfirm(selected); setSaving(false); }}
          className="rounded-[10px] bg-[#111827] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}
