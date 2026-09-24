import { StatusBadge } from "../StatusBadge";

interface AgendaLesson {
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

export function AgendaView({ lessons }: { lessons: AgendaLesson[] }) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Agenda</h1>
      <p className="mb-6 text-sm text-[#58595b]">Lessen waarvan het voorschot betaald is.</p>
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
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-medium text-[#111827]">{formatSlot(lesson.startAt, lesson.endAt)}</td>
                  <td className="px-4 py-3">{lesson.dossier.firstName} {lesson.dossier.lastName}</td>
                  <td className="px-4 py-3 text-[#58595b]">{lesson.instructor.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={lesson.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
