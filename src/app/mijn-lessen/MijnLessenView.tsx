"use client";

import { IoLogOutOutline } from "react-icons/io5";
import { PackageCalendar } from "./PackageCalendar";
import { logoutStudent } from "./actions";

export interface StudentLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  instructorId: string;
  instructorName: string;
  canChange: boolean;
}

export interface StudentDossier {
  id: string;
  firstName: string;
  packageName: string;
  packageId: string;
  transmission: "AUTOMAAT" | "MANUEEL";
  hoursRemaining: number;
  lessons: StudentLesson[];
}

export function MijnLessenView({ dossiers }: { dossiers: StudentDossier[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827]">Mijn lessen</h1>
          <p className="mt-2 text-sm text-[#58595b]">Hier kan je je lessen beheren. Annuleren kan tot 2 dagen op voorhand.</p>
        </div>
        <form action={logoutStudent}>
          <button type="submit" className="btn-outline">
            <IoLogOutOutline className="h-[18px] w-[18px]" aria-hidden />
            Uitloggen
          </button>
        </form>
      </div>
      {dossiers.length === 0 && <p className="text-sm text-[#58595b]">Er staat nog geen dossier op dit adres.</p>}
      <div className="space-y-8">
        {dossiers.map((dossier) => (
          <PackageCalendar key={dossier.id} dossier={dossier} />
        ))}
      </div>
    </div>
  );
}
