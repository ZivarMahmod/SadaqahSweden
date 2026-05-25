// Designsystem-chrome — ChromeAdmin (minimal topbar för (intern)-gruppen).
// Designreferens: handoff v2.1/source/studio/components.jsx (ChromeAdmin)
// + handoff v2.1/source/studio/styles.css § CHROME / ADMIN.
// Server-komponent som läser me/notiscount; AdminCrumbs (client) tar pathname.
// Sys-pillarna (Stripe/BankID/Pending) visas som lugna pending-platshållare i
// F3 — riktig signal wires in i en senare brief utan att rubba komponenten.
import Link from "next/link";
import { aktuellAnvandare } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";
import { AdminCrumbs } from "@/components/layout/admin-crumbs";

const ROLL_LABEL: Record<string, string> = {
  admin: "Superadmin",
  granskare: "Granskare",
  insamlare: "Insamlare",
  forening: "Förening",
  donator: "Donator",
};

function initialer(namn: string) {
  return namn
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export async function ChromeAdmin() {
  const me = await aktuellAnvandare();

  let olasta = 0;
  if (me) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notis")
      .select("id", { count: "exact", head: true })
      .is("last_at", null);
    olasta = count ?? 0;
  }

  const visningsnamn = me?.profil.visningsnamn ?? "Konto";
  const roll = me?.roll ?? "team";
  const rollLabel = ROLL_LABEL[roll] ?? roll;

  return (
    <header className="chrome-admin">
      <Link
        href="/admin"
        aria-label="Maskinrum — admin-översikt"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.012em",
          color: "var(--color-ink)",
          textDecoration: "none",
          paddingRight: 18,
          borderRight: "1px solid var(--color-ink-line)",
          marginRight: 4,
        }}
      >
        Maskinrum
        <span
          style={{
            marginLeft: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-copper-deep)",
          }}
        >
          Sadaqah
        </span>
      </Link>

      <AdminCrumbs />

      <div className="systembar">
        <span className="sys-pill" title="Stripe Connect — status visas i en senare brief">
          <span className="dot yellow" />
          Stripe
        </span>
        <span className="sys-pill" title="BankID-broker — status visas i en senare brief">
          <span className="dot yellow" />
          BankID
        </span>
        <span className="sys-pill" title="Granskningskö — koppling till live-count i senare brief">
          <span className="dot yellow" />
          Pending
        </span>

        <Link
          href="/admin/larm"
          className="ico-btn"
          aria-label={`Larm${olasta > 0 ? ` (${olasta} olasta)` : ""}`}
          title="Larm / notiser"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
          {olasta > 0 && (
            <span className="badge">{olasta > 99 ? "99+" : olasta}</span>
          )}
        </Link>

        <Link
          href="/konto/profil"
          className="ico-btn"
          aria-label="Inställningar"
          title="Profil / inställningar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>

        <Link
          href="/konto"
          className="me"
          aria-label={`Konto: ${visningsnamn} (${rollLabel})`}
          style={{ textDecoration: "none" }}
        >
          <span className="av" aria-hidden>
            {initialer(visningsnamn)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <span className="name">{visningsnamn}</span>
            <span className="role">{rollLabel}</span>
          </span>
        </Link>

        <form action={loggaUt}>
          <button
            type="submit"
            className="ico-btn"
            aria-label="Logga ut"
            title="Logga ut"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
