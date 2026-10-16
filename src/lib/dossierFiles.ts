import { randomUUID } from "crypto";
import type { DossierDocumentKind } from "@prisma/client";
import { documentContentType } from "@/lib/bookingDocuments";
import { createAdminSupabase } from "@/lib/supabase/admin";

const BUCKET = "dossier-documents";

function safeFileName(name: string) {
  const base = name.split(/[/\\]/).pop()?.trim() || "document";
  return base.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
}

async function bucket() {
  const supabase = createAdminSupabase();
  const existing = await supabase.storage.getBucket(BUCKET);
  if (!existing.data) {
    const created = await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 8 * 1024 * 1024 });
    if (created.error && !/already exists/i.test(created.error.message)) {
      throw new Error(created.error.message);
    }
  }
  return supabase.storage.from(BUCKET);
}

export async function storeDossierFile(dossierId: string, kind: DossierDocumentKind, file: File) {
  const contentType = documentContentType(file);
  if (!contentType) throw new Error("Ongeldig bestandstype.");
  const fileName = safeFileName(file.name);
  const storagePath = `${dossierId}/${kind}-${randomUUID()}-${fileName}`;
  const storage = await bucket();
  const uploaded = await storage.upload(storagePath, Buffer.from(await file.arrayBuffer()), {
    contentType,
    upsert: false,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);
  return { kind, fileName, contentType, storagePath };
}

export async function removeDossierFiles(paths: string[]) {
  if (paths.length === 0) return;
  const storage = await bucket();
  await storage.remove(paths);
}

export async function readDossierFile(storagePath: string) {
  const storage = await bucket();
  const downloaded = await storage.download(storagePath);
  if (downloaded.error || !downloaded.data) return null;
  return Buffer.from(await downloaded.data.arrayBuffer());
}
