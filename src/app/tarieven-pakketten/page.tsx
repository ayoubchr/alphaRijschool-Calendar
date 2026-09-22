import Link from "next/link";
import { getActivePackages } from "@/lib/packages";

export const dynamic = "force-dynamic";

export default async function TarievenPakkettenPage() {
  const packages = await getActivePackages();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-10 text-3xl font-extrabold">Tarieven + Pakketten</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col rounded-lg border p-6 shadow-sm">
            <h2 className="text-lg font-bold">{pkg.name}</h2>
            <p className="mt-2 flex-1 text-sm text-gray-600">{pkg.description}</p>
            <div className="my-4 flex gap-4 border-y py-4 text-sm">
              <div><p className="text-gray-500">Automaat</p><p className="text-xl font-extrabold">&euro;{(pkg.priceAutomaat / 100).toFixed(2)}</p></div>
              <div><p className="text-gray-500">Manueel</p><p className="text-xl font-extrabold">&euro;{(pkg.priceManueel / 100).toFixed(2)}</p></div>
            </div>
            <p className="mb-4 text-xs text-gray-500">+ &euro;{(pkg.registrationFee / 100).toFixed(2)} inschrijvingskosten</p>
            <Link href={`/boeken?package=${pkg.id}`} className="rounded-full bg-red-600 px-5 py-2 text-center text-sm font-semibold text-white">
              Schrijf je nu in
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
