"use client";

import { useState } from "react";

interface Lesson {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  dossier: { firstName: string; lastName: string };
  instructor: { name: string };
}

export function BookingsView({ lessons: initialLessons }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initialLessons);

  async function handleAction(id: string, action: "confirm" | "cancel") {
    const response = await fetch(`/api/admin/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) {
      const body = await response.json();
      setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, status: body.status } : l)));
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Boekingen</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Datum</th><th>Leerling</th><th>Instructeur</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id} className="border-b">
              <td className="py-2">{new Date(lesson.startAt).toLocaleString("nl-BE")}</td>
              <td>{lesson.dossier.firstName} {lesson.dossier.lastName}</td>
              <td>{lesson.instructor.name}</td>
              <td>{lesson.status}</td>
              <td className="space-x-2">
                <button onClick={() => handleAction(lesson.id, "confirm")} className="text-sm text-green-700">Bevestigen</button>
                <button onClick={() => handleAction(lesson.id, "cancel")} className="text-sm text-red-700">Annuleren</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
