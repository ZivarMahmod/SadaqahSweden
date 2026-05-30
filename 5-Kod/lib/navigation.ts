// Informationsarkitektur v0.3 — navigationskonfigurationen (brief 35, F6).
//
// EN enda sanningskälla för de fem rummen. #18 säger uttryckligen: "en statisk
// navigeringskonfiguration (en fil), inte i databasen." Ingen migration.
//
// RAMVERKS-NEUTRAL DATA: ingen JSX, inga route-komponenter, inga ikon-element —
// bara strängar/data. `icon` är ett namn ur den bespoke Icon-uppsättningen
// (components/ui/icon.tsx), inte en komponent. Det gör att BÅDE webb-topbaren
// (RoomNav) OCH app-bottennavet (brief 51) kan importera exakt samma fil.
// EN karta → två ytuttryck (princip N).
//
// Nivå 1 = de fem rummen (ordning: Ge · Min vardag · Karta · Gemenskap · Kunskap).
// Nivå 2 = rummens egna flikar (tabs). Brief 35 fyller BARA i det säkert kända
//          nu (rumsnamn + de flikar #18/#19 uttryckligen listar + redan
//          liveytor). Varje yt-brief (38–50) lägger till sina egna nivå-2-flikar
//          i samma fil när den bygger sitt rum.
// Nivå 3 = drawer/sekundära ytor (om, juridik) — separat sektion nedan.
import type { SurfaceTone } from "@/components/ui/tone";

export type RoomKey = "ge" | "min-vardag" | "karta" | "gemenskap" | "kunskap";

export type NavTab = {
  label: string;
  href: string;
  /** true = ytan byggs av en senare brief; länken pekar tills vidare på rummets
   *  lugna "öppnar snart"-landning, aldrig en 404. */
  comingSoon?: boolean;
};

export type NavRoom = {
  key: RoomKey;
  label: string;
  /** Namn ur components/ui/icon.tsx (bespoke Icon-set) — ramverks-neutral sträng. */
  icon: string;
  href: string;
  /** editorial (lugn landning/läsande) eller utility (verktyg, tätare). #18 F1. */
  tone: SurfaceTone;
  /** Kort, lugn beskrivning som förrummet lyfter. Aldrig en säljande fras. */
  description: string;
  tabs?: NavTab[];
};

export type NavDrawerItem = { label: string; href: string };
export type NavDrawerSection = { label: string; items: NavDrawerItem[] };

// ── Nivå 1 + 2 — de fem rummen ──────────────────────────────────────────────
export const ROOMS: NavRoom[] = [
  {
    key: "ge",
    label: "Ge",
    icon: "gift",
    href: "/ge",
    tone: "editorial",
    description: "Insamlingar, sadaqa och stöd — granskat före publicering.",
    tabs: [
      { label: "Insamlingar", href: "/insamlingar" },
      // Stöd Sadaqa (brief 40), Transparens (brief 39) läggs av sina briefar.
    ],
  },
  {
    key: "min-vardag",
    label: "Min vardag",
    icon: "sun",
    href: "/min-vardag",
    tone: "utility",
    description: "Bönetider, qibla och kalender — dina dagliga verktyg.",
    tabs: [
      // Bönetider/qibla (brief 47), kalender (brief 48), Koran-läsaren (brief 46)
      // läggs av sina briefar. Inga liveytor i rummet ännu.
    ],
  },
  {
    key: "karta",
    label: "Karta",
    icon: "map-pin",
    href: "/karta",
    tone: "utility",
    description: "Moskéer, föreningar och insamlingar nära dig.",
    // /karta är redan en liveyta — rummet pekar direkt dit.
  },
  {
    key: "gemenskap",
    label: "Gemenskap",
    icon: "users",
    href: "/gemenskap",
    tone: "editorial",
    description: "Samtal, händelser och föreningar i gemenskapen.",
    tabs: [
      { label: "Samtal", href: "/gemenskap", comingSoon: true }, // samtalssystem, brief 44
      { label: "Händelser", href: "/events" },
      { label: "Moskéer & föreningar", href: "/foreningar" },
    ],
  },
  {
    key: "kunskap",
    label: "Kunskap",
    icon: "book-open",
    href: "/kunskap",
    tone: "editorial",
    description: "Koranen, frågor & svar och vägar till kunskap.",
    tabs: [
      { label: "Frågor & svar", href: "/faq" },
      // Koran-läsaren (brief 46), Hitta imam (brief 50), Skolan (brief 56)
      // läggs av sina briefar.
    ],
  },
];

// ── Nivå 3 — drawer / sekundära ytor ─────────────────────────────────────────
// De fem rummen ligger i topbaren. Drawern bär det sekundära. Alla hrefs nedan
// är verifierade mot footer.tsx (catch-all /[slug] renderar lugn platshållare —
// aldrig 404). "Mina sidor" byggs dynamiskt per roll i ChromePublic.
export const DRAWER_SECONDARY: NavDrawerSection[] = [
  {
    label: "Om plattformen",
    items: [
      { label: "Hur det fungerar", href: "/hur-det-fungerar" },
      { label: "Granskningen", href: "/granskningen" },
      { label: "Transparens", href: "/transparens" },
      { label: "Statistik", href: "/statistik" },
    ],
  },
  {
    label: "Hjälp & juridik",
    items: [
      { label: "Frågor & svar", href: "/faq" },
      { label: "Villkor", href: "/villkor" },
      { label: "Integritet", href: "/integritet" },
    ],
  },
];

/** Hjälpare: är en given pathname inom ett rum (rummets href, en flik, eller en
 *  undersida)? Används av RoomNav för aktiv-markering per rum. */
export function ärRumAktivt(room: NavRoom, pathname: string): boolean {
  const mål = [room.href, ...(room.tabs?.map((t) => t.href) ?? [])];
  return mål.some((h) => h !== "/" && (pathname === h || pathname.startsWith(`${h}/`)));
}
