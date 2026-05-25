// Designsystem-chrome — AdminSidebar (server).
// Deklarativ nav-array. Brief 22 lägger till poster (Donatörer, Transaktioner)
// utan att skriva om komponenten — utöka bara BAS_NAV.
// Designreferens: handoff v2.1/source/studio/components.jsx (AdminSidebar)
// + handoff v2.1/source/studio/styles.css § "Admin layout: sidebar + content".
import { aktuellAnvandare } from "@/lib/auth";
import {
  AdminSidebarClient,
  type NavSektion,
  type NavItem,
} from "@/components/layout/admin-sidebar-client";

type NavItemBas = NavItem & { superadminOnly?: boolean };

const BAS_NAV: { label: string; items: NavItemBas[] }[] = [
  {
    label: "Översikt",
    items: [
      { href: "/admin", label: "Dashboard", iconKey: "inbox" },
      { href: "/granskning", label: "Granskning", iconKey: "shield" },
    ],
  },
  {
    label: "Drift",
    items: [
      { href: "/granskning/organisationer", label: "Föreningar", iconKey: "building" },
      { href: "/admin/statistik", label: "Statistik", iconKey: "sparkles" },
      { href: "/admin/region-rapport", label: "Region-rapport", iconKey: "map-pin" },
      { href: "/admin/overklaganden", label: "Överklaganden", iconKey: "flag" },
    ],
  },
  {
    label: "Innehåll",
    items: [
      { href: "/admin/innehall", label: "Innehåll", iconKey: "file-check" },
      { href: "/admin/faq", label: "FAQ", iconKey: "chevron-down" },
      { href: "/admin/lard", label: "Lärd", iconKey: "gift" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/larm", label: "Larm", iconKey: "alert-triangle" },
      { href: "/admin/logg", label: "Ingreppslogg", iconKey: "clock" },
      { href: "/admin/verktyg", label: "Verktyg", iconKey: "edit" },
      {
        href: "/admin/stickprov",
        label: "Stickprov",
        iconKey: "check-circle",
        superadminOnly: true,
      },
    ],
  },
  {
    label: "Team",
    items: [{ href: "/admin/team", label: "Arbetsyta", iconKey: "users" }],
  },
];

export async function AdminSidebar() {
  const me = await aktuellAnvandare();
  // Matchar villkoret i app/(intern)/admin/page.tsx:
  //   const arSuperadmin = me.profil.admin_niva === "superadmin";
  const arSuperadmin = me?.profil.admin_niva === "superadmin";

  const sektioner: NavSektion[] = BAS_NAV.map((sek) => ({
    label: sek.label,
    items: sek.items
      .filter((i) => !i.superadminOnly || arSuperadmin)
      .map(({ superadminOnly: _superadminOnly, ...rest }) => rest),
  })).filter((s) => s.items.length > 0);

  return <AdminSidebarClient sektioner={sektioner} />;
}
