// Komponent-galleri (brief 35, F8). Intern, admin-gatad verifierings-yta.
//
// Renderar varje v0.3-komponent i varje tillstånd och båda tonlägena — F7:s
// verifierings-yta och referensen för framtida briefar (38–51). Tonläge utility.
// Detta är INTE studio-/tweaks-panelen DEL 7 förbjuder: galleriet renderar bara
// komponenter, det låter ingen byta tema. Mock-data — ingen DB.
"use client";

import { useState } from "react";
import { ToneSurface, type SurfaceTone } from "@/components/ui/tone";
import { SkeletonState } from "@/components/ui/skeleton-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { HumbleNote } from "@/components/ui/humble-note";
import { EntityCard } from "@/components/ui/entity-card";
import { VerifiedTag } from "@/components/ui/verified-tag";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { InsamlingCard, type InsamlingCardData } from "@/components/ui/insamling-card";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";

const mockInsamling: InsamlingCardData = {
  publicId: "demo",
  titel: "Vinterhjälp till familjer i Idlib",
  kortBeskrivning: "Filtar, mat och värme till 200 familjer inför vintern.",
  insamlatOre: 4_250_000,
  malbeloppOre: 8_000_000,
  malbeloppMinOre: null,
  malbeloppMaxOre: null,
  malbeloppModell: "fast",
  insamlarStad: "Malmö",
  hjalpLand: "Syrien",
  insamlingDeadline: "2026-08-01",
  status: "aktiv",
  kategoriNamn: "Katastrofhjälp",
};

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="mag-eyebrow mb-2">
        <span className="stroke" />
        {title}
      </div>
      {note && (
        <p className="mb-5 text-sm" style={{ color: "var(--color-ink-3)", maxWidth: 640 }}>
          {note}
        </p>
      )}
      {children}
    </section>
  );
}

/** Renderar barn i båda tonlägena sida vid sida — visar att färg/radie är
 *  identiska och bara densitet/typgrad skiljer (#18 R7). */
function ToneCompare({ children }: { children: React.ReactNode }) {
  const tones: SurfaceTone[] = ["editorial", "utility"];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tones.map((tone) => (
        <ToneSurface key={tone} tone={tone} className="card card-tight">
          <div className="mb-4 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>
            {tone}
          </div>
          {children}
        </ToneSurface>
      ))}
    </div>
  );
}

export default function DesignsystemGalleri() {
  const [retries, setRetries] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ToneSurface tone="utility" as="main">
      <header className="mb-12">
        <h1 className="mag-h1">Designsystem v0.3 — komponent-galleri</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--color-ink-2)", maxWidth: 680 }}>
          Varje v0.3-komponent i varje tillstånd och båda tonlägena. Verifierings-yta
          för WCAG-revisionen (F7) och referens för briefs 38–51. Tonläge: utility.
        </p>
      </header>

      <Block title="F1 · Två tonlägen" note="Samma EntityCard i editorial vs utility — samma tokens, färger och radier; bara spacing, typografi-grad och densitet skiljer.">
        <ToneCompare>
          <EntityCard
            eyebrow="Katastrofhjälp · Syrien"
            title="Vinterhjälp till familjer i Idlib"
            metaLines={["Filtar, mat och värme till 200 familjer."]}
            progress={53}
          />
        </ToneCompare>
      </Block>

      <Block title="F2 · Tillstånds-grammatiken" note="Laddar / tomt / fel / klart. Spinner används aldrig för en tom sida — bara för BankID och betalning.">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card card-tight">
            <div className="mb-4 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>laddar — SkeletonState</div>
            <SkeletonState variant="list" lines={3} />
          </div>
          <div className="card card-tight">
            <div className="mb-4 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>tomt — EmptyState</div>
            <EmptyState
              title="Inga insamlingar än"
              description="När den första insamlingen publicerats syns den här. Gå och drick te — vi säger till."
              icon={<Icon name="inbox" size={28} />}
            />
          </div>
          <div className="card card-tight">
            <div className="mb-4 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>fel — ErrorState</div>
            <ErrorState onRetry={() => setRetries((r) => r + 1)} />
            {retries > 0 && (
              <p className="mt-2 text-center text-xs" style={{ color: "var(--color-ink-3)" }}>
                Försök igen klickad {retries} ggr
              </p>
            )}
          </div>
          <div className="card card-tight">
            <div className="mb-4 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>fel (offline) — ErrorState</div>
            <ErrorState variant="offline" onRetry={() => setRetries((r) => r + 1)} />
          </div>
        </div>
      </Block>

      <Block title="F3 · EntityCard-familjen" note="En stomme, flera konfigurationer. InsamlingCard är en tunn adapter ovanpå EntityCard (samma vy som i produktion). Ingen betygs-/röst-prop.">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-3 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>InsamlingCard (adapter)</div>
            <InsamlingCard data={mockInsamling} />
          </div>
          <div>
            <div className="mb-3 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>event (dateBlock)</div>
            <EntityCard
              eyebrow="Event · Malmö"
              title="Föreläsning: Zakat i praktiken"
              metaLines={["Lördag 14 juni · 18:00", "Malmö moské"]}
              dateBlock={
                <div className="inline-flex flex-col items-center justify-center" style={{ alignSelf: "flex-start", background: "var(--color-forest-soft)", color: "var(--color-forest)", borderRadius: "var(--sr-2)", padding: "8px 12px", lineHeight: 1 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>14</span>
                  <span className="f-mono" style={{ fontSize: 10, letterSpacing: "0.1em" }}>JUN</span>
                </div>
              }
              statusTag={<Pill tone="success">Öppen anmälan</Pill>}
              href="#galleri"
            />
          </div>
          <div>
            <div className="mb-3 f-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>katalog-post + compact</div>
            <EntityCard
              eyebrow="Förening"
              title="Islamiska förbundet i Malmö"
              metaLines={["Moské · Malmö", "Verksam sedan 1998"]}
              href="#galleri"
            />
            <div className="mt-4">
              <EntityCard compact eyebrow="Bön" title="Dhuhr 13:02" metaLines={["om 2 tim 14 min"]} href="#galleri" />
            </div>
          </div>
        </div>
      </Block>

      <Block title="F4 · HumbleNote" note="Lågmäld ärlighets-not — ink-3 + info-ikon, aldrig danger eller varningsruta. Skild från Alert. Texten är alltid prop-styrd.">
        <ToneCompare>
          <HumbleNote>
            På höga breddgrader kan bönetiderna behöva en alternativ beräkningsmetod. Det
            här är en beräkning, inte ett dekret — rådgör med din lokala moské vid tveksamhet.
          </HumbleNote>
        </ToneCompare>
      </Block>

      <Block title="F5 · VerifiedTag" note="Bygger på Tag + en attributions-rad (vem/när/metod) och en förklaring vid tryck. Aldrig en banderoll. Tryck för att fälla ut.">
        <div className="flex flex-wrap items-start gap-6">
          <VerifiedTag
            label="Verifierad insamlare"
            kind="insamlare"
            by="Sadaqah Sweden granskningsteam"
            at="2026-04-12"
            method="BankID + manuell granskning"
            explanation="Insamlaren har bekräftat sin identitet och projektet har granskats mot svensk lag och islamiska principer innan publicering."
          />
          <VerifiedTag
            label="Verifierad förening"
            kind="forening"
            by="Sadaqah Sweden"
            at="2026-03-01"
            explanation="Föreningen är registrerad och dess uppgifter har kontrollerats."
          />
        </div>
      </Block>

      <Block title="F5 · BottomSheet" note="Nerifrån på mobil, sidopanel från höger på desktop (≥768px). Fokus-trap, ESC och overlay-klick stänger.">
        <button type="button" className="mag-btn mag-btn-primary" onClick={() => setSheetOpen(true)}>
          Öppna BottomSheet
        </button>
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Detaljvy">
          <p className="text-sm" style={{ color: "var(--color-ink-2)", lineHeight: 1.55 }}>
            En kompakt detaljvy. På kartan (brief 42) visas en plats här; på desktop blir
            samma sheet en sidopanel. Tryck ESC, klicka utanför, eller stäng-knappen.
          </p>
        </BottomSheet>
      </Block>

      <Block title="F5 · Arabisk textstil" note="Definierad en gång (.ar-text), lang=ar / dir=rtl, RTL-isolerad så bara textblocket vänds. Tryggt fritt default-typsnitt — brief 46 byter på ett ställe.">
        <p className="ar-text" lang="ar" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </Block>
    </ToneSurface>
  );
}
