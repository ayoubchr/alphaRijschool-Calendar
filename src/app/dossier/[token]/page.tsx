import Link from "next/link";

export default function DossierTokenPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="mb-3 text-2xl font-extrabold text-[#111827]">Log in om je dossier te zien</h1>
      <p className="mb-6 text-sm text-[#58595b]">Je lessen beheer je met de inloglink uit je bevestigingsmail, of door hieronder een nieuwe link aan te vragen.</p>
      <Link href="/login" className="btn-primary">Inloglink aanvragen</Link>
    </div>
  );
}
