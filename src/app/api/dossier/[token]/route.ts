import { NextRequest, NextResponse } from "next/server";
import { findDossierByMagicLinkToken, toPublicDossier } from "@/lib/dossiers";

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) {
    return NextResponse.json({ error: "Link is ongeldig of verlopen." }, { status: 404 });
  }
  return NextResponse.json(toPublicDossier(dossier));
}
