import { notFound } from "next/navigation";
import { findDossierByMagicLinkToken, toPublicDossier } from "@/lib/dossiers";
import { DossierView } from "./DossierView";

export default async function DossierPage({ params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) notFound();
  return <DossierView dossier={toPublicDossier(dossier)} token={params.token} />;
}
