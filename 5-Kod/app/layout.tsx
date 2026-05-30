// Designsystem-rot — globala fonts (Spectral display + Manrope UI + JetBrains mono).
// Chrome (SiteNav/Footer) ligger i route-grupp-layouts: (public), (auth), (konto), (intern).
// Designreferens: handoff-to-code/marketing.html · handoff-to-code/assets/style.css.
import type { Metadata } from "next";
import { Spectral, Manrope, JetBrains_Mono, Amiri } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Arabisk calligrafi-font för Skolans Koran-skrift-canvas (F10). Amiri (OFL).
// Exponeras som --font-arabic; canvasen läser familjenamnet därifrån.
const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
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
    <html
      lang="sv"
      className={`${spectral.variable} ${manrope.variable} ${jetbrains.variable} ${amiri.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
