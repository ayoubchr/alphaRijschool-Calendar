"use client";

import { type FormEvent, useState } from "react";

interface Instructor {
  id: string;
  name: string;
  availabilityRules: { id: string; weekday: number; startTime: string; endTime: string }[];
}

const WEEKDAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

export function AvailabilityView({ instructors: initialInstructors }: { instructors: Instructor[] }) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instructorId: form.get("instructorId"),
        weekday: Number(form.get("weekday")),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
      }),
    });
    if (!response.ok) {
      setError("Kon de regel niet opslaan.");
      return;
    }
    const created = await response.json();
    setInstructors((prev) =>
      prev.map((i) => (i.id === created.instructorId ? { ...i, availabilityRules: [...i.availabilityRules, created] } : i))
    );
    (event.target as HTMLFormElement).reset();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Beschikbaarheid</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3">
        <select name="instructorId" required className="rounded border p-2">
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <select name="weekday" required className="rounded border p-2">
          {WEEKDAY_NAMES.map((name, index) => (
            <option key={index} value={index}>{name}</option>
          ))}
        </select>
        <input name="startTime" type="time" required className="rounded border p-2" />
        <input name="endTime" type="time" required className="rounded border p-2" />
        <button type="submit" className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">Toevoegen</button>
      </form>

      {instructors.map((instructor) => (
        <div key={instructor.id} className="mb-6">
          <h2 className="font-semibold">{instructor.name}</h2>
          <ul className="text-sm text-gray-600">
            {instructor.availabilityRules.map((rule) => (
              <li key={rule.id}>{WEEKDAY_NAMES[rule.weekday]}: {rule.startTime} - {rule.endTime}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
