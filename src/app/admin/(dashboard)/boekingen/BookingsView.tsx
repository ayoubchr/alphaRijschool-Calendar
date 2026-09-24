"use client";

import { useState } from "react";
import { cancelBooking } from "./actions";
import { StatusBadge } from "../StatusBadge";

interface Lesson {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  dossier: { firstName: string; lastName: string };
  instructor: { name: string };
}

function formatSlot(startAt: Date, endAt: Date) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const date = start.toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", weekday: "short", day: "numeric", month: "short" });
  const from = start.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  const to = end.toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });
  return `${date} · ${from}–${to}`;
}

export function BookingsView({ lessons: initialLessons }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [cancelNotices, setCancelNotices] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setPendingId(id);
    const result = await cancelBooking(id);
    if (result.ok) {
      setLessons((prev) => prev.map((lesson) => (lesson.id === id ? { ...lesson, status: result.status } : lesson)));
      setCancelNotices((prev) => ({
        ...prev,
        [id]: result.refundEligible ? "Tegoed hersteld." : "Voorschot vervalt (binnen 48u).",
      }));
    }
    setPendingId(null);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Boekingen</h1>
      <p className="mb-6 text-sm text-[#58595b]">Alleen betaalde boekingen. Annuleren binnen 48 uur laat het voorschot vervallen.</p>
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
        {lessons.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#58595b]">Er zijn nog geen boekingen.</p>
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
                    {cancelNotices[lesson.id] && <span className="mt-1 block text-xs text-[#58595b]">{cancelNotices[lesson.id]}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {lesson.status !== "CANCELLED" && (
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
