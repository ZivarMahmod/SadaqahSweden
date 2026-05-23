// Modul M9 — inloggad konto-grupp.
// Design: handoff-to-code/account.html (app shell). Sidebar lämnas till M9 utbyggnad —
// nu bara SiteNav + Footer för konsistens.
import { SiteNav } from "@/components/layout/site-nav";
import { Footer } from "@/components/layout/footer";

export default function KontoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <Footer />
    </>
  );
}
