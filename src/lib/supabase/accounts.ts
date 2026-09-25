import type { StaffRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function ensureAuthUser(params: { email: string; role: StaffRole; instructorId?: string | null }) {
  const admin = createAdminSupabase();
  const email = params.email.trim().toLowerCase();
  const existingProfile = await prisma.profile.findUnique({ where: { email } });
  const role = existingProfile && existingProfile.role !== "STUDENT" && params.role === "STUDENT" ? existingProfile.role : params.role;
  const instructorId = params.instructorId ?? existingProfile?.instructorId ?? null;

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role, instructor_id: instructorId },
  });

  let userId = created.data.user?.id;
  if (!userId) {
    const linked = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linked.error || !linked.data.user) {
      throw new Error(created.error?.message ?? linked.error?.message ?? "Account aanmaken mislukt.");
    }
    userId = linked.data.user.id;
    await admin.auth.admin.updateUserById(userId, { app_metadata: { role, instructor_id: instructorId } });
  }

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: { email, role, instructorId },
    create: { id: userId, email, role, instructorId },
  });
  return profile;
}

export async function magicLinkFor(email: string, nextPath: string) {
  const admin = createAdminSupabase();
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: normalized });
  if (error || !data.properties?.hashed_token) {
    throw new Error(error?.message ?? "Inloglink kon niet worden gemaakt.");
  }
  const url = new URL("/auth/confirm", process.env.APP_URL);
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", nextPath);
  return url.toString();
}
