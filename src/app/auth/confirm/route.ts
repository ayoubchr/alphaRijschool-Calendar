import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

function redirectOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  const hostname = host.split(":")[0];
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  // The tunnel terminates HTTPS and forwards plain HTTP. Combining that proto
  // with Host: localhost produces https://localhost:3000, which the dev server cannot serve.
  if (isLocal) return `http://${host}`;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = redirectOrigin(request);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/mijn-lessen";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/mijn-lessen"}`);
}
