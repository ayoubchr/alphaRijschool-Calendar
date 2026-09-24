"use client";

import { useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { cancelAgendaLesson } from "./actions";

interface AgendaLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  dossier: { firstName: string; lastName: string };
  instructor: { name: string };
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
                    {lesson.status !== "CANCELLED" && lesson.status !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={pendingId === lesson.id}
                        onClick={() => handleCancel(lesson.id)}
                        className="rounded-[10px] border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#ed1c24] transition hover:border-[#ed1c24] disabled:opacity-50"
                      >
                        Annuleren
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
