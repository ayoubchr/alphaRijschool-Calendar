"use client";

import { useState } from "react";

interface DossierLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  instructor: { name: string };
}

interface DossierData {
  id: string;
  firstName: string;
  lastName: string;
  hoursRemaining: number;
  package: { name: string };
  lessons: DossierLesson[];
}

export function DossierView({ dossier, token }: { dossier: DossierData; token: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-extrabold text-brand-navy">Welkom terug, {dossier.firstName}</h1>
      <p className="mb-6 text-gray-600">
        Pakket: {dossier.package.name} &mdash; resterend tegoed: {dossier.hoursRemaining} uur
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <h2 className="mb-2 text-lg font-semibold">Geplande lessen</h2>
      <ul className="mb-8 space-y-2">
        {dossier.lessons.map((lesson) => (
          <li key={lesson.id} className="rounded border p-3 text-sm">
            {new Date(lesson.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })} met {lesson.instructor.name} &mdash; {lesson.status}
          </li>
        ))}
      </ul>

      {dossier.hoursRemaining > 0 ? (
        <p className="text-sm text-gray-600">
          Je hebt nog tegoed. Neem contact op of gebruik de boekingslink die je ontving om een nieuwe les in te
          plannen zonder nieuw voorschot.
        </p>
      ) : (
        <p className="text-sm text-gray-600">Je pakket-tegoed is volledig ingepland.</p>
      )}
    </div>
  );
}
