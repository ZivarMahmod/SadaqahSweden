// Skolan — mock-data (INGEN databas).
//
// Per 2026-05-30 finns inget skol-schema live (annan instans äger DB:n).
// Hela klient-bygget renderar mot dessa konstanter så Zivar kan klicka runt i
// en riktig skola. När backend landar byts dessa getters mot Supabase-queries
// med samma returtyper (se typer.ts). INGET här rör nätverk eller DB.

import type {
  BibliotekItem,
  Capability,
  Inlamning,
  Klass,
  MembershipTyp,
  Profil,
  Quiz,
  Studieplan,
  Uppgift,
} from "./typer";

// ---- Profiler ----------------------------------------------------------

export const JAG: Profil = { id: "p-jag", namn: "Du", initialer: "DU" };

const LARARE_AMINA: Profil = { id: "p-amina", namn: "Amina Yusuf", initialer: "AY" };
const LARARE_OMAR: Profil = { id: "p-omar", namn: "Omar Khan", initialer: "OK" };

const ELEV_SARA: Profil = { id: "p-sara", namn: "Sara Ali", initialer: "SA" };
const ELEV_YUSUF: Profil = { id: "p-yusuf", namn: "Yusuf Hassan", initialer: "YH" };
const ELEV_LAYLA: Profil = { id: "p-layla", namn: "Layla Ahmed", initialer: "LA" };

// ---- Klasser -----------------------------------------------------------

export const KLASSER: Klass[] = [
  {
    id: "k-arabiska-1",
    namn: "Arabiska steg 1",
    beskrivning: "Alfabet, uttal och de första orden. För nybörjare.",
    larare: LARARE_AMINA,
    typ: "permanent",
    status: "aktiv",
    joinKod: "ARAB-7Q2",
    amne: "Arabiska",
    antalElever: 14,
    minRoll: "elev",
  },
  {
    id: "k-sira",
    namn: "Profetens liv (Sira)",
    beskrivning: "Berättelsen om Profeten ﷺ, kronologiskt med källor.",
    larare: LARARE_OMAR,
    typ: "permanent",
    status: "aktiv",
    joinKod: "SIRA-3M8",
    amne: "Historia",
    antalElever: 9,
    minRoll: "elev",
  },
  {
    id: "k-helg-tajwid",
    namn: "Helgkurs: Tajwīd-grunder",
    beskrivning: "En intensiv helg om recitationens regler. Tillfällig klass.",
    larare: LARARE_AMINA,
    typ: "snabb",
    status: "aktiv",
    joinKod: "TAJW-5K1",
    amne: "Koran",
    antalElever: 22,
    minRoll: "elev",
  },
];

export function hamtaKlass(id: string): Klass | undefined {
  return KLASSER.find((k) => k.id === id);
}

// ---- Ämnen / kurser (få seedade — utbyggbar modell) --------------------

export const AMNEN: { id: string; namn: string; ordning: number }[] = [
  { id: "a-arabiska", namn: "Arabiska", ordning: 1 },
  { id: "a-koran", namn: "Koran", ordning: 2 },
  { id: "a-historia", namn: "Historia", ordning: 3 },
  { id: "a-fiqh", namn: "Fiqh (grunder)", ordning: 4 },
];

// ---- Uppgifter ---------------------------------------------------------

export const UPPGIFTER: Uppgift[] = [
  {
    id: "u-alfabet",
    klassId: "k-arabiska-1",
    titel: "Skriv alfabetet — alif till yāʾ",
    instruktion:
      "Öva på att skriva de 28 bokstäverna. Lämna in ett foto eller en ritning.\n\n- Skriv varje bokstav **tre gånger**\n- Markera de som du tycker är svåra",
    typ: "individuell",
    deadline: "2026-06-08",
    amne: "Arabiska",
  },
  {
    id: "u-sira-tidslinje",
    klassId: "k-sira",
    titel: "Grupparbete: tidslinje över Mekka-perioden",
    instruktion:
      "I grupp: bygg en tidslinje över de viktigaste händelserna i Mekka-perioden. Använd ritytan.",
    typ: "grupp",
    deadline: "2026-06-15",
    amne: "Historia",
  },
  {
    id: "u-koran-kortlasning",
    klassId: "k-helg-tajwid",
    titel: "Lyssna och följ med — sūrat al-ʿAsr",
    instruktion:
      "Lyssna på recitationen och följ med i texten. (Uttals-ljud aktiveras när Koran-modulen är på.)",
    typ: "individuell",
    deadline: null,
    amne: "Koran",
  },
];

export function uppgifterForKlass(klassId: string): Uppgift[] {
  return UPPGIFTER.filter((u) => u.klassId === klassId);
}

// ---- Inlämningar (för lärar-vyn + min egen) ----------------------------

export const INLAMNINGAR: Inlamning[] = [
  {
    id: "in-1",
    uppgiftId: "u-alfabet",
    elev: JAG,
    status: "utkast",
    innehall: "Har skrivit alif–khāʾ. Resten kvar.",
    inlamnadAt: null,
    feedback: null,
  },
  {
    id: "in-2",
    uppgiftId: "u-alfabet",
    elev: ELEV_SARA,
    status: "inlamnad",
    innehall: "Klar! Bifogar foto.",
    inlamnadAt: "2026-05-29",
    feedback: null,
  },
  {
    id: "in-3",
    uppgiftId: "u-alfabet",
    elev: ELEV_YUSUF,
    status: "aterkommen",
    innehall: "Klar.",
    inlamnadAt: "2026-05-28",
    feedback: "Fint! Titta särskilt på sīn och shīn — punkterna ska vara jämna. Lämna in igen.",
  },
];

export function inlamningarForUppgift(uppgiftId: string): Inlamning[] {
  return INLAMNINGAR.filter((i) => i.uppgiftId === uppgiftId);
}

export const GRUPP_MEDLEMMAR: Profil[] = [JAG, ELEV_SARA, ELEV_LAYLA];

// ---- Bibliotek ---------------------------------------------------------
// `larare`-källa = klart nu (lärar-ägt). `gemensamt_verifierat` = vilande
// bakom SKOLA_GEMENSAMT_BIBLIOTEK tills #34:s grind finns.

export const BIBLIOTEK_LARARE: BibliotekItem[] = [
  {
    id: "b-1",
    titel: "Arabiska alfabetet — övningsblad",
    beskrivning: "PDF med spårbara bokstäver. Skriv ut eller spåra på skärm.",
    typ: "PDF",
    kalla: "larare",
    agare: "Amina Yusuf",
    amne: "Arabiska",
    bokmarkt: true,
  },
  {
    id: "b-2",
    titel: "Mekka-periodens karta",
    beskrivning: "Bildmaterial till Sira-kursen.",
    typ: "Bild",
    kalla: "larare",
    agare: "Omar Khan",
    amne: "Historia",
    bokmarkt: false,
  },
  {
    id: "b-3",
    titel: "Tajwīd — snabbreferens",
    beskrivning: "En sida med de vanligaste reglerna.",
    typ: "PDF",
    kalla: "larare",
    agare: "Amina Yusuf",
    amne: "Koran",
    bokmarkt: false,
  },
];

/** Vilande tills #34 — renderas BARA när flaggan är på och grinden godkänt. */
export const BIBLIOTEK_GEMENSAMT: BibliotekItem[] = [
  {
    id: "bg-1",
    titel: "Verifierad: De 40 hadītherna (an-Nawawī)",
    beskrivning: "Renderas genom det religiösa registrets grind när #34 är byggt.",
    typ: "Bok",
    kalla: "gemensamt_verifierat",
    amne: "Hadith",
    bokmarkt: false,
  },
];

// ---- Quiz --------------------------------------------------------------
// Kunskap/ord — ALDRIG tillbedjan. Privat poäng, ingen publik topplista.

export const QUIZZAR: Quiz[] = [
  {
    id: "q-arabiska-ord",
    klassId: "k-arabiska-1",
    titel: "Första orden — vad betyder de?",
    amne: "Arabiska",
    fragor: [
      {
        id: "qf-1",
        fraga: "Vad betyder ordet «kitāb» (كتاب)?",
        alternativ: ["Penna", "Bok", "Dörr", "Hus"],
        ratt: 1,
      },
      {
        id: "qf-2",
        fraga: "Vad betyder «bāb» (باب)?",
        alternativ: ["Dörr", "Bord", "Vatten", "Sol"],
        ratt: 0,
      },
      {
        id: "qf-3",
        fraga: "Hur många bokstäver har det arabiska alfabetet?",
        alternativ: ["26", "28", "30", "24"],
        ratt: 1,
      },
    ],
  },
  {
    id: "q-sira",
    klassId: "k-sira",
    titel: "Sira — Mekka-perioden",
    amne: "Historia",
    fragor: [
      {
        id: "qf-4",
        fraga: "I vilken stad föddes Profeten ﷺ?",
        alternativ: ["Medina", "Mekka", "Taif", "Jerusalem"],
        ratt: 1,
      },
      {
        id: "qf-5",
        fraga: "Vad kallas utvandringen till Medina?",
        alternativ: ["Hijra", "Isra", "Hajj", "Umrah"],
        ratt: 0,
      },
    ],
  },
];

export function quizzarForKlass(klassId: string): Quiz[] {
  return QUIZZAR.filter((q) => q.klassId === klassId);
}

export function hamtaQuiz(id: string): Quiz | undefined {
  return QUIZZAR.find((q) => q.id === id);
}

// ---- Studieplaner (premium) --------------------------------------------

export const STUDIEPLANER: Studieplan[] = [
  {
    id: "sp-1",
    namn: "Min väg in i arabiskan",
    moduler: [
      { id: "m-1", titel: "Lär dig alfabetet", klar: true },
      { id: "m-2", titel: "De första 50 orden", klar: false },
      { id: "m-3", titel: "Korta meningar", klar: false },
    ],
  },
];

// ---- Premium / entitlements (mock) -------------------------------------
// Egen membership-modell tills #12 finns. Religiöst/läsande innehåll anropar
// ALDRIG denna grind — alltid fritt.

/** Den inloggade användarens mock-medlemskap. Ändra för att testa grind-UI. */
export const MITT_MEDLEMSKAP: MembershipTyp = "ingen";

const CAPS_PER_TYP: Record<MembershipTyp, Capability[]> = {
  ingen: [],
  singel: ["studieplan", "cross_reference", "verktyg"],
  familj: ["studieplan", "cross_reference", "verktyg"],
  larare: ["studieplan", "cross_reference", "verktyg", "larare_manga_elever"],
};

/** Mock-spegling av `private.school_har_tillgang`. */
export function harTillgang(cap: Capability, typ: MembershipTyp = MITT_MEDLEMSKAP): boolean {
  return CAPS_PER_TYP[typ].includes(cap);
}

// ---- Lärar-behörighet (mock) -------------------------------------------
// Default STÄNGD. En användare ansöker; bara godkänd lärare kan skapa klass.
// `ingen` = har inte ansökt → ser "ansök", inte "skapa klass".

export const MIN_LARARBEHORIGHET = "ingen" as const;
