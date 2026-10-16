ALTER TABLE "Dossier" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

CREATE TYPE "DossierDocumentKind" AS ENUM ('ID', 'THEORIEATTEST', 'M36', 'M18', 'BIJLAGE4');

CREATE TABLE "DossierDocument" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "kind" "DossierDocumentKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DossierDocument_dossierId_idx" ON "DossierDocument"("dossierId");

ALTER TABLE "DossierDocument" ADD CONSTRAINT "DossierDocument_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

REVOKE ALL ON TABLE "DossierDocument" FROM anon, authenticated;
ALTER TABLE "DossierDocument" ENABLE ROW LEVEL SECURITY;
