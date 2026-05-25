// Designsystem-chrome — AdminSidebarClient.
// Klient-komponent: usePathname för aktiv-markering, useState för mobil-drawer.
// Får hela nav-strukturen som prop från server-komponenten AdminSidebar
// (filtrerad efter roll). Renderar både desktop-sidebar (.admin-sidebar) och
// en mobil-drawer (samma overlay-mönster som BurgerDrawer).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

export type NavItem = {
  href: string;
  label: string;
  iconKey: string;
  count?: number | null;
  alert?: boolean;
};
export type NavSektion = {
  label: string;
  items: NavItem[];
};

function arAktiv(path: string, href: string): boolean {
  if (path === href) return true;
  // Hub-routes är bara aktiva vid exakt match — annars matchar /admin allt.
  if (href === "/admin" || href === "/granskning") return false;
  return path.startsWith(href + "/");
}

export function AdminSidebarClient({ sektioner }: { sektioner: NavSektion[] }) {
  const path = usePathname() ?? "";
  const [mobilOppen, setMobilOppen] = useState(false);

  useEffect(() => {
    if (!mobilOppen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobilOppen(false);
    };
    document.addEventListener("keydown", onKey);
    const tidigare = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = tidigare;
    };
  }, [mobilOppen]);

  // Stäng mobil-drawer när användaren navigerar
  useEffect(() => {
    setMobilOppen(false);
  }, [path]);

  return (
    <>
      <aside className="admin-sidebar" aria-label="Admin-sektioner">
        {sektioner.map((sek) => (
          <div key={sek.label}>
            <div className="admin-sb-label">{sek.label}</div>
            {sek.items.map((it) => {
              const aktiv = arAktiv(path, it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`admin-sb-item${aktiv ? " active" : ""}`}
                  aria-current={aktiv ? "page" : undefined}
                >
                  <Icon name={it.iconKey} size={18} className="ico" />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.count != null && (
                    <span className={`count${it.alert ? " alert" : ""}`}>{it.count}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <button
        type="button"
        onClick={() => setMobilOppen(true)}
        className="admin-mobile-toggle"
        aria-label="Öppna admin-meny"
        aria-expanded={mobilOppen}
        aria-controls="admin-mobile-drawer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Meny
      </button>

      {mobilOppen && (
        <div
          className="burger-drawer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobilOppen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Admin-meny"
        >
          <div className="burger-drawer-panel" id="admin-mobile-drawer">
            <button
              type="button"
              onClick={() => setMobilOppen(false)}
              className="close"
              aria-label="Stäng meny"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {sektioner.map((sek) => (
              <div key={sek.label} className="burger-section">
                <div className="label">{sek.label}</div>
                <ul>
                  {sek.items.map((it) => {
                    const aktiv = arAktiv(path, it.href);
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => setMobilOppen(false)}
                          aria-current={aktiv ? "page" : undefined}
                        >
                          <span>{it.label}</span>
                          {aktiv && <span className="mono">aktiv</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
