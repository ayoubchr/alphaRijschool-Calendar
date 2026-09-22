interface AgendaLesson {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  dossier: { firstName: string; lastName: string };
  instructor: { name: string };
}

export function AgendaView({ lessons }: { lessons: AgendaLesson[] }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Agenda</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Datum</th>
            <th>Leerling</th>
            <th>Instructeur</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id} className="border-b">
              <td className="py-2">{new Date(lesson.startAt).toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })}</td>
              <td>{lesson.dossier.firstName} {lesson.dossier.lastName}</td>
              <td>{lesson.instructor.name}</td>
              <td>{lesson.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
