import { getDossierOverview } from "./dossierQuery";
import { StatusBadge } from "../StatusBadge";

export default async function AdminDossiersPage() {
  const dossiers = await getDossierOverview();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Dossiers</h1>
      <p className="mb-6 text-sm text-[#58595b]">Leerlingen, hun pakket en het resterende tegoed.</p>
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
        {dossiers.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#58595b]">Er zijn nog geen dossiers.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f9f9f9] text-left text-xs font-bold uppercase tracking-wide text-[#58595b]">
              <tr>
                <th className="px-4 py-3">Leerling</th>
                <th className="px-4 py-3">Pakket</th>
                <th className="px-4 py-3">Tegoed</th>
                <th className="px-4 py-3">Betaling</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((dossier) => (
                <tr key={dossier.id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-medium text-[#111827]">{dossier.firstName} {dossier.lastName}</td>
                  <td className="px-4 py-3">{dossier.package.name}</td>
                  <td className="px-4 py-3">{dossier.hoursRemaining} uur</td>
                  <td className="px-4 py-3">
                    {dossier.payments[0] ? <StatusBadge status={dossier.payments[0].status} /> : <span className="text-[#58595b]">—</span>}
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
