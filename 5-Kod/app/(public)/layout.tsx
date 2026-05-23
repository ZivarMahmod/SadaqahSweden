// Modul M11 — publik route-grupp (chrome: SiteNav + Footer).
// Design: handoff-to-code/marketing.html.
import { SiteNav } from "@/components/layout/site-nav";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <Footer />
    </>
  );
}
