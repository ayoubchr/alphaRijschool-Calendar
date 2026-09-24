import "./globals.css";

import { Roboto } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Alpha Rijschool",
  description: "Rijschool in Antwerpen — boek je rijlessen online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${roboto.className} flex min-h-screen flex-col`}>
        <SiteHeader />
        <main className="flex-1 pb-16">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
