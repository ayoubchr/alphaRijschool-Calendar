import "./globals.css";

import { Poppins } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import type { Metadata } from "next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alpha Rijschool",
  description: "Rijschool in Antwerpen — boek je rijlessen online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${poppins.className} flex min-h-screen flex-col`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
