"use client";

import { type FormEvent, useState } from "react";
import { addAvailabilityRule } from "./actions";

interface Instructor {
  id: string;
  name: string;
  availabilityRules: { id: string; weekday: number; startTime: string; endTime: string }[];
}

const WEEKDAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

const fieldClass = "mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2 outline-none transition focus:border-[#111827]";

export function AvailabilityView({ instructors: initialInstructors }: { instructors: Instructor[] }) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const result = await addAvailabilityRule({
      instructorId: String(form.get("instructorId") ?? ""),
      weekday: Number(form.get("weekday")),
      startTime: String(form.get("startTime") ?? ""),
      endTime: String(form.get("endTime") ?? ""),
    });
    setSaving(false);
    if (!result.ok) {
      setError("Kon de regel niet opslaan.");
      return;
    }
    const created = result.rule;
    setInstructors((prev) =>
      prev.map((instructor) =>
        instructor.id === created.instructorId
          ? { ...instructor, availabilityRules: [...instructor.availabilityRules, created] }
          : instructor
      )
    );
    (event.target as HTMLFormElement).reset();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Beschikbaarheid</h1>
      <p className="mb-6 text-sm text-[#58595b]">
        Zet per instructeur en weekdag een tijdvenster. De boekingskalender knipt dat venster in lessen van 2 uur.
      </p>
      {error && <p className="mb-4 text-sm text-[#ed1c24]">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-8 grid gap-4 rounded-[10px] border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm font-medium lg:col-span-1">
          Instructeur
          <select name="instructorId" required className={fieldClass}>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Weekdag
          <select name="weekday" required className={fieldClass}>
            {WEEKDAY_NAMES.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Van
          <input name="startTime" type="time" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Tot
          <input name="endTime" type="time" required className={fieldClass} />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="h-10 w-full rounded-[10px] bg-[#ed1c24] px-4 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:opacity-60"
          >
            {saving ? "Opslaan..." : "Toevoegen"}
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {instructors.map((instructor) => (
          <section key={instructor.id} className="rounded-[10px] border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="font-extrabold text-[#111827]">{instructor.name}</h2>
            {instructor.availabilityRules.length === 0 ? (
              <p className="mt-2 text-sm text-[#58595b]">Nog geen tijdvensters.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {instructor.availabilityRules.map((rule) => (
                  <li key={rule.id} className="rounded-full bg-[#f9f9f9] px-3 py-1.5 text-sm font-medium text-[#111827]">
                    {WEEKDAY_NAMES[rule.weekday]} · {rule.startTime}–{rule.endTime}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
