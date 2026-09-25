import type { StaffRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  role: StaffRole;
  instructorId?: string;
}

export async function auth(): Promise<{ user: SessionUser } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;

  const metadata = user.app_metadata as { role?: StaffRole; instructor_id?: string | null };
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      role: metadata.role ?? "STUDENT",
      instructorId: metadata.instructor_id ?? null,
    },
  });

  return {
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      instructorId: profile.instructorId ?? undefined,
    },
  };
}
