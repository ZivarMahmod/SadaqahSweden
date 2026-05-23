// Modul M6 — Verifiera e-post (post-registrering).
// Design: handoff-to-code/auth.html (samma split-shell, informativt innehåll).
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = {
  title: "Verifiera din e-post — Sadaqah Sweden",
};

export default function VerifieraEpostPage() {
  return (
    <>
      <div
        className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "var(--color-copper-soft)",
          color: "var(--color-copper-deep)",
        }}
      >
        <Icon name="inbox" size={28} />
      </div>
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
        Kolla din inkorg
      </h2>
      <p
        className="mt-4"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          color: "var(--color-ink-2)",
          fontWeight: 300,
          margin: 0,
        }}
      >
        Vi har skickat en bekräftelselänk till e-postadressen du angav. Klicka på länken — sen är
        du i.
      </p>
      <div
        className="mt-8 rounded-xl border p-5 text-sm"
        style={{
          background: "var(--color-paper-soft)",
          borderColor: "var(--color-ink-line)",
          color: "var(--color-ink-2)",
        }}
      >
        <p className="font-semibold" style={{ color: "var(--color-ink-1)" }}>
          Hittar du inget?
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          <li>· Kolla skräppost-mappen.</li>
          <li>
            · Mejlet kommer från{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
              no-reply@supabase.co
            </code>{" "}
            tills föreningens egen avsändare är konfigurerad.
          </li>
          {/* TODO (M15): Resend-baserad transaktionsmejl byts in när domänen är verifierad. */}
        </ul>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/login" variant="secondary">
          Tillbaka till inloggning
        </LinkButton>
        <Link
          href="mailto:support@sadaqahsweden.se"
          className="btn btn-ghost"
        >
          Kontakta support
        </Link>
      </div>
    </>
  );
}
