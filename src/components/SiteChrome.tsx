"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16">{children}</main>
      <SiteFooter />
    </>
  );
}
