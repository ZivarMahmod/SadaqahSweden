// Modul M3 — Intern route-grupp (granskare/admin).
// Design: handoff-to-code/review.html · Plan: 1-Planering/Modul-03-Granskar-flodet.md.
// Säkerhet: alla (intern)-routes kallar kraver(['granskare','admin']) i sina pages.
//          RLS skyddar även om någon når routen direkt.
import { SiteNav } from "@/components/layout/site-nav";
import { Footer } from "@/components/layout/footer";

export default function InternLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <Footer />
    </>
  );
}
