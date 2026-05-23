// Modul M6 — Skapa konto.
// Design: handoff-to-code/auth.html · Säkerhet: SAKERHETSREGLER §9 (HIBP, CAPTCHA).
// E-postbekräftelse via Supabase Auth confirm-email → /auth/callback.
import Link from "next/link";
import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { RegistreraForm } from "./registrera-form";

export const metadata = {
  title: "Skapa konto — Sadaqah Sweden",
};

export default async function RegistreraPage() {
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
        Skapa konto
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
        Du startar som donator. För att bli insamlare krävs senare BankID-verifiering och
        Stripe-onboarding.
      </p>

      {/* TODO (M6 — BankID): BankID-snabbreg läggs till när broker-avtal finns. */}

      <RegistreraForm />

      <div
        className="mt-8 flex flex-wrap items-center gap-6 pt-6 text-xs"
        style={{ borderTop: "1px solid var(--color-ink-line)", color: "var(--color-ink-3)" }}
      >
        <span>
          Har du redan ett konto?{" "}
          <Link href="/login" style={{ color: "var(--color-forest)", textDecoration: "underline" }}>
            Logga in
          </Link>
        </span>
        <span className="ml-auto">
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
