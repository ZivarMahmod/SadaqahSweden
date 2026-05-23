// Modul M6 — Logga in.
// Design: handoff-to-code/auth.html · Säkerhet: SAKERHETSREGLER §9 (HIBP, CAPTCHA — Turnstile
// kopplas in när site-key finns). Lösenord aldrig i klartext, fel översatta till svenska.
import Link from "next/link";
import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Logga in — Sadaqah Sweden",
};

export default async function LoginPage() {
  const me = await aktuellAnvandare();
  if (me) redirect("/konto");

  return (
    <>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 40,
          fontWeight: 400,
          lineHeight: 1.08,
          margin: 0,
          letterSpacing: "-0.012em",
        }}
      >
        Logga in
      </h2>
      <p
        className="mt-3"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          color: "var(--color-ink-2)",
          fontWeight: 300,
          margin: 0,
        }}
      >
        Välkommen tillbaka. Logga in med din e-post.
      </p>

      {/* TODO (M6 — BankID): "Logga in med BankID" + alt-knappar (annan enhet, QR-kod) byggs in
          när broker-avtal (Criipto el. likn.) är på plats. Tills dess är e-post enda metoden,
          så ingen död BankID-knapp får synas. Se SESSION-GOAL.md "Genuint blockerat". */}

      <LoginForm />

      <div
        className="mt-8 flex flex-wrap items-center gap-6 pt-6 text-xs"
        style={{ borderTop: "1px solid var(--color-ink-line)", color: "var(--color-ink-3)" }}
      >
        <Link href="/registrera" style={{ color: "var(--color-forest)", textDecoration: "underline" }}>
          Skapa konto
        </Link>
        <span className="ml-auto">
          Behöver hjälp?{" "}
          <a
            href="mailto:support@sadaqahsweden.se"
            style={{ color: "var(--color-forest)", textDecoration: "underline" }}
          >
            support@sadaqahsweden.se
          </a>
        </span>
      </div>
    </>
  );
}
