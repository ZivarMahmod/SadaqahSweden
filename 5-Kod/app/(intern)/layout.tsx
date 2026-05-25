// Modul M3 — Intern route-grupp (granskare/admin).
// F5: dashboard-känsla — ChromeAdmin + AdminSidebar + admin-layout-flex
// (sidomeny vänster, innehåll höger). Ingen Footer. Sidor lever inom
// .admin-content; sidobaren rendrerar sin egen mobil-drawer.
// Säkerhet: alla (intern)-routes kallar kraver(['granskare','admin']) i sina
// pages. RLS skyddar även om någon når routen direkt.
// Design: handoff v2.1/source/studio/components.jsx (ChromeAdmin + AdminSidebar)
// + handoff v2.1/source/studio/styles.css § "Admin layout: sidebar + content".
import { ChromeAdmin } from "@/components/layout/chrome-admin";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function InternLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChromeAdmin />
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-content">{children}</main>
      </div>
    </>
  );
}
