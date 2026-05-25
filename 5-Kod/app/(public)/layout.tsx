// Modul M11 — publik route-grupp (chrome: ChromePublic + Footer).
// F5: ChromePublic är magasin-v0.2-stilad re-export av SiteNav; BurgerDrawer
// är inbakad i ChromePublic (visas även på desktop) och behöver inte renderas
// separat här.
// Design: handoff v2.1/source/studio/components.jsx (ChromePublic).
import { ChromePublic } from "@/components/layout/site-nav";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChromePublic />
      {children}
      <Footer />
    </>
  );
}
