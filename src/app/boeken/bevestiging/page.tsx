import Link from "next/link";

export default function BevestigingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const dossier = typeof searchParams.dossier === "string" ? searchParams.dossier : undefined;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="mb-4 text-3xl font-extrabold">Bedankt voor je inschrijving!</h1>
      <p className="mb-4 text-gray-600">
        We hebben je boeking ontvangen. Zodra je betaling is verwerkt, ontvang je een bevestigingsmail met een
        link naar je dossier en je geplande les(sen).
      </p>
      <p className="mb-8 text-sm text-gray-500">
        Geen e-mail ontvangen binnen enkele minuten? Controleer je spamfolder of neem contact met ons op.
        {dossier ? ` (Referentie: ${dossier})` : null}
      </p>
      <Link href="/" className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white">
        Terug naar de homepage
      </Link>
    </div>
  );
}
