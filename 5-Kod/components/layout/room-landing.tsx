// IA v0.3 — RoomComingSoon (brief 35, F6). Lugn "öppnar snart"-landning per rum.
//
// Ett rum vars yta byggs senare (briefs 38–50) ska peka på en lugn, värdig skylt
// — aldrig en 404 (#19: "ett rum bakom en öppnar snart-skylt är ärligt", och
// tillstånds-grammatikens tom-ton). Surfacen lyfter det som REDAN finns i rummet
// (liveytor) så inget göms. När en yt-brief bygger sitt rum ersätter den den här.
//
// Renderas i rummets eget tonläge (ToneSurface) — visar tonläges-konventionen.
// Server-säker.
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { ToneSurface } from "@/components/ui/tone";
import type { NavRoom } from "@/lib/navigation";

export function RoomComingSoon({ room }: { room: NavRoom }) {
  const liveTabs = (room.tabs ?? []).filter((t) => !t.comingSoon);

  return (
    <ToneSurface tone={room.tone} as="main">
      <Section tone="cream" spacing="loose">
        <Container width="narrow">
          <div className="flex items-center gap-3" style={{ color: "var(--color-copper-deep)" }}>
            <Icon name={room.icon} size={22} />
            <span className="eyebrow">{room.label}</span>
          </div>
          <h1 className="heading-1 mt-5">Öppnar snart.</h1>
          <p className="lead mt-5 max-w-[560px]">{room.description}</p>
          <p className="mt-4 max-w-[560px] text-sm" style={{ color: "var(--color-ink-3)" }}>
            Rummet byggs steg för steg. Det här är en ärlig skylt — ingen tom vägg.
            Allt som redan finns når du nedan.
          </p>

          {liveTabs.length > 0 && (
            <div className="mt-10">
              <div className="mag-eyebrow mb-4">
                <span className="stroke" />
                Redan här
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
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
                        {t.label}
                      </span>
                      <Icon name="chevron-right" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
