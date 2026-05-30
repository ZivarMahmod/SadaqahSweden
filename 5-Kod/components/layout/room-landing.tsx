// IA v0.3 — RoomLanding (brief 35, F6). Lugn rums-landning.
//
// ADAPTIV (live-säker — branchen mergas till live main):
//  • Har rummet redan liveytor (tabs utan comingSoon)? → en RIKTIG hub som lyfter
//    dem prominent. Titeln är rummets namn, INTE "öppnar snart" — annars hade en
//    landning gömt fungerande innehåll (t.ex. insamlingar/events/föreningar/faq)
//    bakom en placeholder. Ofärdiga delar noteras som "öppnar snart".
//  • Helt tomt rum (inga liveytor, t.ex. Min vardag)? → lugn "öppnar snart"-skylt
//    (#19: "ett rum bakom en öppnar snart-skylt är ärligt"), aldrig en 404.
//
// När en yt-brief (38–50) bygger rummets riktiga yta ersätter den den här.
// Renderas i rummets tonläge (ToneSurface). Server-säker.
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { ToneSurface } from "@/components/ui/tone";
import type { NavRoom } from "@/lib/navigation";

export function RoomLanding({ room }: { room: NavRoom }) {
  const liveTabs = (room.tabs ?? []).filter((t) => !t.comingSoon);
  const comingTabs = (room.tabs ?? []).filter((t) => t.comingSoon);
  const harLive = liveTabs.length > 0;

  return (
    <ToneSurface tone={room.tone} as="main">
      <Section tone="cream" spacing="loose">
        <Container width="narrow">
          <div className="flex items-center gap-3" style={{ color: "var(--color-copper-deep)" }}>
            <Icon name={room.icon} size={22} />
            <span className="eyebrow">{room.label}</span>
          </div>
          <h1 className="heading-1 mt-5">{harLive ? room.label : "Öppnar snart."}</h1>
          <p className="lead mt-5 max-w-[560px]">{room.description}</p>

          {harLive ? (
            <>
              <div className="mag-eyebrow mb-4 mt-10">
                <span className="stroke" />
                I rummet
              </div>
              <ul
                className="flex flex-col"
                style={{
                  gap: 1,
                  background: "var(--color-ink-line)",
                  border: "1px solid var(--color-ink-line)",
                  borderRadius: "var(--sr-3)",
                  overflow: "hidden",
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {liveTabs.map((t) => (
                  <li key={t.href} style={{ background: "var(--color-paper-soft)" }}>
                    <Link
                      href={t.href}
                      className="flex items-center justify-between p-5 no-underline"
                      style={{ color: "inherit" }}
                    >
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{t.label}</span>
                      <Icon name="chevron-right" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
              {comingTabs.length > 0 && (
                <p className="mt-5 text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Fler delar av rummet ({comingTabs.map((t) => t.label).join(", ")}) öppnar snart.
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 max-w-[560px] text-sm" style={{ color: "var(--color-ink-3)" }}>
              Rummet byggs steg för steg. Det här är en ärlig skylt — ingen tom vägg.
            </p>
          )}

          <div className="mt-10">
            <Link href="/" className="mag-btn mag-btn-secondary">
              <Icon name="arrow-left" size={16} />
              Till startsidan
            </Link>
          </div>
        </Container>
      </Section>
    </ToneSurface>
  );
}
