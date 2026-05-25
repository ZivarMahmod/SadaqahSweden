// Modul M9 — inloggad konto-grupp.
// F5: ChromeInsamlare ger avatar-pill + bell + primär-CTA "+ Ny insamling"
// över publika chrome-skalet; BurgerDrawer inbakad i komponenten.
// Design: handoff v2.1/source/studio/components.jsx (ChromeInsamlare).
import { ChromeInsamlare } from "@/components/layout/chrome-insamlare";
import { Footer } from "@/components/layout/footer";

export default function KontoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChromeInsamlare />
      {children}
      <Footer />
    </>
  );
}
