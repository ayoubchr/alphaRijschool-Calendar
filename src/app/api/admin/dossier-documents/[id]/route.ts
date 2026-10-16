import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readDossierFile } from "@/lib/dossierFiles";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 401 });
  }

  const document = await prisma.dossierDocument.findUnique({ where: { id: params.id } });
  if (!document) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });

  const bytes = await readDossierFile(document.storagePath);
  if (!bytes) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });

  const filename = encodeURIComponent(document.fileName);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
    },
  });
}
