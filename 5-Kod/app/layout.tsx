import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteNav } from "./site-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sadaqahsweden.se"),
  title: "Sadaqah Sweden — trygga insamlingar för det muslimska samhället",
  description:
    "En transparent insamlingsplattform för det muslimska samhället i Sverige. Varje projekt granskas, varje krona är spårbar, varje resultat bevisas.",
  openGraph: {
    title: "Sadaqah Sweden",
    description:
      "En transparent insamlingsplattform för det muslimska samhället i Sverige.",
    url: "https://sadaqahsweden.se",
    siteName: "Sadaqah Sweden",
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={`${geistSans.variable} ${fraunces.variable}`}>
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
