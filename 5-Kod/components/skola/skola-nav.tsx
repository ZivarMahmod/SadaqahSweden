"use client";

// Skolan — sub-navigering mellan skol-ytorna. Klient-komponent enbart för
// aktiv-markering (usePathname). Touch-vänlig: varje länk ≥ 48px, horisontellt
// scrollbar på små skärmar, inga hover-beroende kontroller.

import Link from "next/link";
import { usePathname } from "next/navigation";

const LANKAR = [
  { href: "/kunskap/skola", label: "Hem", exakt: true },
  { href: "/kunskap/skola/klasser", label: "Mina klasser" },
  { href: "/kunskap/skola/bibliotek", label: "Bibliotek" },
  { href: "/kunskap/skola/verktyg", label: "Verktyg" },
  { href: "/kunskap/skola/quiz", label: "Quiz" },
  { href: "/kunskap/skola/koran-skrift", label: "Koran-skrift" },
  { href: "/kunskap/skola/studieplan", label: "Studieplan" },
];

export function SkolaNav() {
  const sokvag = usePathname();
  return (
    <nav
      aria-label="Skolan"
      className="flex gap-1 overflow-x-auto border-b"
      style={{ borderColor: "var(--color-paper-line)" }}
    >
      {LANKAR.map((l) => {
        const aktiv = l.exakt ? sokvag === l.href : sokvag.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={aktiv ? "page" : undefined}
            className="whitespace-nowrap px-4 font-medium transition-colors"
            style={{
              minHeight: 48,
              display: "inline-flex",
              alignItems: "center",
              fontSize: 15,
              color: aktiv ? "var(--color-forest)" : "var(--color-ink-3)",
              borderBottom: aktiv
                ? "2px solid var(--color-forest)"
                : "2px solid transparent",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
