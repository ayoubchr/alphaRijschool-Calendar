import "./globals.css";

import { Roboto } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
