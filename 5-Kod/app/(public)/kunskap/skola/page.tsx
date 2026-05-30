// Skolan — hem. Översikt med ingångar till skol-ytorna + aktuella uppgifter.
// Mot mock-data (lib/skola/mock.ts) — ingen DB.
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import {
  BIBLIOTEK_LARARE,
  KLASSER,
  QUIZZAR,
  STUDIEPLANER,
  UPPGIFTER,
} from "@/lib/skola/mock";

const SEKTIONER = [
  {
    href: "/kunskap/skola/klasser",
    namn: "Mina klasser",
    text: "Klasserna du går i — uppgifter, material och inlämning.",
    rakna: () => `${KLASSER.length} klasser`,
  },
  {
    href: "/kunskap/skola/bibliotek",
    namn: "Bibliotek",
    text: "Lärarens material och bokmärkta resurser.",
    rakna: () => `${BIBLIOTEK_LARARE.length} resurser`,
  },
  {
    href: "/kunskap/skola/verktyg",
    namn: "Verktyg",
    text: "Rityta, PDF-läsare och dokument — inbäddade open source-verktyg.",
    rakna: () => "Rityta · PDF",
  },
  {
    href: "/kunskap/skola/quiz",
    namn: "Quiz",
    text: "Öva ord och kunskap. Privat poäng — ingen topplista.",
    rakna: () => `${QUIZZAR.length} quiz`,
  },
  {
    href: "/kunskap/skola/koran-skrift",
    namn: "Koran-skrift",
    text: "Öva på att skriva bokstäverna och spåra verser på skärmen.",
    rakna: () => "Skriv-yta",
  },
  {
    href: "/kunskap/skola/studieplan",
    namn: "Studieplan",
    text: "Bygg din egen väg genom lärandet. Del av medlemskapet.",
    rakna: () => `${STUDIEPLANER.length} plan`,
  },
];

export default function SkolaHem() {
  const kommande = [...UPPGIFTER]
    .filter((u) => u.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-12">
      {/* Sektioner */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEKTIONER.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="card card-hover flex flex-col gap-2"
              style={{ minHeight: 132 }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="heading-3" style={{ fontSize: 20 }}>
                  {s.namn}
                </h2>
                <Pill tone="paper">{s.rakna()}</Pill>
              </div>
              <p style={{ color: "var(--color-ink-2)", fontSize: 15, lineHeight: 1.5 }}>{s.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Aktuella uppgifter */}
      <section>
        <h2 className="heading-3 mb-4">Aktuella uppgifter</h2>
        {kommande.length === 0 ? (
          <p style={{ color: "var(--color-ink-3)" }}>Inga uppgifter med deadline just nu.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {kommande.map((u) => {
              const klass = KLASSER.find((k) => k.id === u.klassId);
              return (
                <li key={u.id}>
                  <Link
                    href={`/kunskap/skola/klasser/${u.klassId}`}
                    className="card card-tight card-hover flex items-center justify-between gap-4"
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 16 }}>{u.titel}</p>
                      <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
                        {klass?.namn} · {u.amne}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {u.typ === "grupp" && <Pill tone="copper">Grupp</Pill>}
                      <span style={{ color: "var(--color-ink-3)", fontSize: 14, whiteSpace: "nowrap" }}>
                        {u.deadline}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
        Förhandsvisning mot exempeldata. Klasser, inlämning och bibliotek kopplas till riktig
        data när skol-backend är på plats.
      </p>
    </div>
  );
}
