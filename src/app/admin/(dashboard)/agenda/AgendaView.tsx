"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { LessonCalendar, type Slot } from "@/components/LessonCalendar";
import { addBrusselsDays, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { cancelAgendaLesson, moveAgendaLesson } from "./actions";

interface AgendaLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
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

export function AgendaView({ lessons: initialLessons }: { lessons: AgendaLesson[] }) {
  const [lessons, setLessons] = useState(initialLessons);
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

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Agenda</h1>
      <p className="mb-6 text-sm text-[#58595b]">Hier vind je een overzicht van alle lessen die geboekt zijn.</p>
      {error && <p className="mb-4 text-sm text-[#ed1c24]">{error}</p>}
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
        {lessons.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#58595b]">Er staan nog geen lessen in de agenda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f9f9f9] text-left text-xs font-bold uppercase tracking-wide text-[#58595b]">
              <tr>
                <th className="px-4 py-3">Moment</th>
                <th className="px-4 py-3">Leerling</th>
                <th className="px-4 py-3">Instructeur</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actie</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-medium text-[#111827]">{formatSlot(lesson.startAt, lesson.endAt)}</td>
                  <td className="px-4 py-3">{lesson.dossier.firstName} {lesson.dossier.lastName}</td>
                  <td className="px-4 py-3 text-[#58595b]">{lesson.instructor.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lesson.status} />
                    {notices[lesson.id] && <span className="mt-1 block text-xs text-[#58595b]">{notices[lesson.id]}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {lesson.canChange && (
                      <span className="flex justify-end gap-2">
                        <button type="button" onClick={() => setMoving(lesson)} className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold">
                          Verplaatsen
                        </button>
                        <button
                          type="button"
                          disabled={pendingId === lesson.id}
                          onClick={() => handleCancel(lesson.id)}
                          className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#ed1c24] transition hover:border-[#ed1c24] disabled:opacity-50"
                        >
                          Annuleren
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
