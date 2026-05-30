// Kunskap-rummet — enkel ingång. Ett av de fem rummen (Ge · Min vardag · Karta
// · Gemenskap · Kunskap). Den fulla fem-rums-IA:n (#35) byggs av en annan
// instans; här ges bara en hållbar ingång till Skolan + en ärlig översikt över
// vad rummet kommer att rymma.
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export const metadata = {
  title: "Kunskap — Sadaqah Sweden",
  description: "Lär dig, läs och väx. Skolan, Koran-läsaren och mer i Kunskap-rummet.",
};

const KOMMANDE = [
  { namn: "Koran-läsaren", text: "Läs, lyssna och följ med — fritt för alla." },
  { namn: "Bönetider & qibla", text: "Tider, adhan och böneriktning." },
  { namn: "Islamisk kalender", text: "Hijri-datum och viktiga dagar." },
  { namn: "Frågor & svar", text: "Verifierade svar på vanliga frågor." },
  { namn: "Hitta en imam", text: "Kontakt med imamer nära dig." },
];

export default function KunskapPage() {
  return (
    <main className="mx-auto max-w-[1080px] px-6 py-16">
      <header className="mb-12 max-w-[680px]">
        <p className="eyebrow mb-2">Rummet</p>
        <h1 className="heading-1">Kunskap</h1>
        <p className="lead mt-4">
          Lär dig, läs och väx. Det religiösa innehållet är alltid gratis — du betalar bara
          för verktygen och strukturen runt lärandet, aldrig för innehållet eller tillbedjan.
        </p>
      </header>

      {/* Skolan — den byggda ytan */}
      <section
        className="card card-forest flex flex-col gap-4 px-8 py-10"
        style={{ color: "var(--color-paper-soft)" }}
      >
        <span className="pill pill-copper" style={{ alignSelf: "flex-start" }}>
          Öppet att utforska
        </span>
        <h2 className="heading-2" style={{ color: "var(--color-paper-soft)" }}>
          Skolan
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: "rgba(245,240,228,0.92)", maxWidth: 620 }}>
          En plattform i plattformen: lärar-ledda klasser, uppgifter och feedback, ett bibliotek,
          quiz, egna studieplaner och verktyg som rityta, PDF-läsare och en Koran-skrift-yta att
          öva bokstäverna på.
        </p>
        <div className="mt-2">
          <LinkButton href="/kunskap/skola" variant="copper" size="lg">
            Gå till Skolan
          </LinkButton>
        </div>
      </section>

      {/* Kommande ytor i rummet */}
      <section className="mt-14">
        <h2 className="heading-3 mb-5">Mer i Kunskap-rummet</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KOMMANDE.map((k) => (
            <div key={k.namn} className="card card-tight flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="heading-3" style={{ fontSize: 19 }}>
                  {k.namn}
                </h3>
                <span className="pill pill-outline">Snart</span>
              </div>
              <p style={{ color: "var(--color-ink-2)", fontSize: 15, lineHeight: 1.5 }}>{k.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6" style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          Dessa ytor byggs i takt med att modulerna landar. Se{" "}
          <Link href="/faq">Frågor &amp; svar</Link> för mer.
        </p>
      </section>
    </main>
  );
}
