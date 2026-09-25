"use client";

import { useRouter } from "next/navigation";
import { PackageCalendar, type CalendarActions } from "@/app/mijn-lessen/PackageCalendar";
import type { StudentDossier } from "@/app/mijn-lessen/MijnLessenView";
import { cancelAgendaLesson, moveAgendaLesson } from "../agenda/actions";
import { planDossierLessons } from "./actions";
import type { DossierRow } from "./DossiersView";

const actions: CalendarActions = {
  plan: async (input) => {
    const result = await planDossierLessons(input);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  },
  move: async (input) => {
    const result = await moveAgendaLesson({ id: input.lessonId, instructorId: input.instructorId, startAt: input.startAt, endAt: input.endAt });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  },
  cancel: async (lessonId) => {
    const result = await cancelAgendaLesson(lessonId);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  },
};

export function DossierPlanning({ dossier, onClose }: { dossier: DossierRow; onClose: () => void }) {
  const router = useRouter();
  const calendarDossier: StudentDossier = {
    id: dossier.id,
    firstName: dossier.firstName,
    packageName: dossier.packageName,
    packageId: dossier.packageId,
    transmission: dossier.transmissionCode,
    hoursRemaining: dossier.hoursRemaining,
    lessons: dossier.lessons.map((lesson) => ({
      id: lesson.id,
      startAt: lesson.startAt,
      endAt: lesson.endAt,
      status: lesson.status,
      instructorId: lesson.instructorId,
      instructorName: lesson.instructorName,
      canChange: lesson.canChange,
    })),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="presentation" onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm">Sluiten</button>
        </div>
        <PackageCalendar dossier={calendarDossier} actions={actions} onUpdated={() => router.refresh()} />
      </div>
    </div>
  );
}
