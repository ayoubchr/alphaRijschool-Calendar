import { isExamPackage, isTheoryPackage } from "@/lib/lessonBlocks";

/** Theory needs an ID only. The practical exam needs an ID plus M18, M36 or Bijlage 4. Every other package needs an ID plus a theory certificate or M36. */
export type DocumentSet = "theory" | "exam" | "lesson";

export type ExtraDocumentKind = "THEORIEATTEST" | "M36" | "M18" | "BIJLAGE4";

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

const EXTRA: Record<Exclude<DocumentSet, "theory">, { kind: ExtraDocumentKind; label: string }[]> = {
  lesson: [
    { kind: "THEORIEATTEST", label: "Theorieattest" },
    { kind: "M36", label: "M36" },
  ],
  exam: [
    { kind: "M18", label: "M18" },
    { kind: "M36", label: "M36" },
    { kind: "BIJLAGE4", label: "Bijlage 4" },
  ],
};

const CONTENT_TYPES = new Map<string, string>([
  ["image/jpeg", "image/jpeg"],
  ["image/png", "image/png"],
  ["image/webp", "image/webp"],
  ["image/heic", "image/heic"],
  ["image/heif", "image/heif"],
  ["application/pdf", "application/pdf"],
]);

const EXTENSIONS = new Map<string, string>([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["heic", "image/heic"],
  ["heif", "image/heif"],
  ["pdf", "application/pdf"],
]);

export function documentSetForPackage(pkg: { name: string }): DocumentSet {
  if (isTheoryPackage(pkg)) return "theory";
  if (isExamPackage(pkg)) return "exam";
  return "lesson";
}

export function extraDocumentOptions(set: DocumentSet) {
  if (set === "theory") return [];
  return EXTRA[set];
}

export function documentKindLabel(kind: "ID" | ExtraDocumentKind) {
  if (kind === "ID") return "Identiteitskaart";
  return [...EXTRA.lesson, ...EXTRA.exam].find((option) => option.kind === kind)?.label ?? kind;
}

export function documentIntro(set: DocumentSet) {
  if (set === "theory") return "We hebben een foto van je identiteitskaart nodig.";
  if (set === "exam") return "We hebben een foto van je identiteitskaart nodig, en een M18, M36 of Bijlage 4.";
  return "We hebben een foto van je identiteitskaart nodig, en je theorieattest of M36.";
}

export function documentContentType(file: { name: string; type: string }) {
  const mime = file.type.toLowerCase();
  if (CONTENT_TYPES.has(mime)) return CONTENT_TYPES.get(mime) ?? null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS.get(extension) ?? null;
}

export function uploadError(file: File | null, subject: string) {
  if (!file || file.size === 0) return `Voeg ${subject} toe.`;
  if (file.size > MAX_DOCUMENT_BYTES) return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} is te groot. Het maximum is 8 MB.`;
  if (!documentContentType(file)) return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} moet een foto (JPG, PNG, WEBP of HEIC) of een PDF zijn.`;
  return null;
}
