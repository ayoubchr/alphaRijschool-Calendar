import { getDossierOverview } from "./dossierQuery";

export default async function AdminDossiersPage() {
  const dossiers = await getDossierOverview();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dossiers</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Leerling</th><th>Pakket</th><th>Tegoed</th><th>Betaalstatus</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => (
            <tr key={dossier.id} className="border-b">
              <td className="py-2">{dossier.firstName} {dossier.lastName}</td>
              <td>{dossier.package.name}</td>
              <td>{dossier.hoursRemaining} uur</td>
              <td>{dossier.payments[0]?.status ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
