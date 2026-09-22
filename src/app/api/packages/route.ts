import { NextResponse } from "next/server";
import { getActivePackages } from "@/lib/packages";

export const dynamic = "force-dynamic";

export async function GET() {
  const packages = await getActivePackages();
  return NextResponse.json(packages);
}
