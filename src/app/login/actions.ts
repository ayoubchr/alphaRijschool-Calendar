"use server";

import { prisma } from "@/lib/prisma";
import { sendLoginLinkEmail } from "@/lib/email";
import { ensureAuthUser, magicLinkFor } from "@/lib/supabase/accounts";

export async function requestLoginLink(email: string) {
  const normalized = email.trim().toLowerCase();
  const [profile, dossier] = await Promise.all([
    prisma.profile.findUnique({ where: { email: normalized } }),
    prisma.dossier.findFirst({ where: { email: normalized }, select: { firstName: true } }),
  ]);
  if (!profile && !dossier) return { ok: true as const };

  const role = profile?.role ?? "STUDENT";
  if (!profile) await ensureAuthUser({ email: normalized, role: "STUDENT" });
  const next = role === "STUDENT" ? "/mijn-lessen" : "/admin/agenda";
  const magicLinkUrl = await magicLinkFor(normalized, next);
  await sendLoginLinkEmail({ to: normalized, name: dossier?.firstName ?? "daar", magicLinkUrl });
  return { ok: true as const };
}
