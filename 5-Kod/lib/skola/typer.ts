// Skolan — delade typer (klient-/mock-kontraktet).
//
// Detta är FRONTEND-kontraktet för Skolans klient-bygge. Ingen databas finns
// ännu (#34/#6/#7/#12 är obyggda live per 2026-05-30, se 56a). Alla ytor
// renderar mot `mock.ts` bakom flaggor (`flags.ts`). När backend landar byts
// mock-källan mot riktiga queries — typerna är formade så att övergången blir
// "byt datakälla", inte "bygg om UI".
//
// Spegling av tabell-skissen i 56-Goal-Skolan.md F1, men klient-vinklad
// (uppslagna profiler i stället för råa FK-id där UI behöver namn).

export type KlassTyp = "snabb" | "permanent";
export type KlassStatus = "aktiv" | "arkiverad" | "stangd";
export type RollIKlass = "larare" | "elev" | "foralder_observator";
export type UppgiftTyp = "individuell" | "grupp";
export type InlamningStatus = "utkast" | "inlamnad" | "aterkommen";
export type BibliotekKalla = "larare" | "gemensamt_verifierat";

/** Lärar-behörighet är grindad — default STÄNGD. `ingen` = har inte ansökt. */
export type LarareBehorighet = "ingen" | "vantar" | "godkand" | "avbojd";

/** Premium-medlemskap (egen `memberships`-modell tills #12 finns). */
export type MembershipTyp = "ingen" | "singel" | "familj" | "larare";

/** Capabilities som premium-grinden känner till. Religiöst innehåll grindas ALDRIG. */
export type Capability =
  | "studieplan"
  | "cross_reference"
  | "verktyg"
  | "larare_manga_elever";

export type Profil = {
  id: string;
  namn: string;
  /** 1–2 tecken för avatar-platshållare. */
  initialer: string;
};

export type Klass = {
  id: string;
  namn: string;
  beskrivning: string;
  larare: Profil;
  typ: KlassTyp;
  status: KlassStatus;
  /** Delas av läraren för att gå med. */
  joinKod: string;
  amne: string;
  antalElever: number;
  /** Anroparens roll i just denna klass (för UI-gating, aldrig säkerhet). */
  minRoll: RollIKlass;
};

export type Uppgift = {
  id: string;
  klassId: string;
  titel: string;
  /** Markdown — saneras vid rendering (lib/innehall/markdown). */
  instruktion: string;
  typ: UppgiftTyp;
  deadline: string | null;
  amne: string;
};

export type Inlamning = {
  id: string;
  uppgiftId: string;
  elev: Profil;
  status: InlamningStatus;
  innehall: string;
  inlamnadAt: string | null;
  /** Lärarens feedback (ingen publik betygssättning, healthy-by-design). */
  feedback: string | null;
};

export type BibliotekItem = {
  id: string;
  titel: string;
  beskrivning: string;
  /** t.ex. "PDF", "Dokument", "Länk". */
  typ: string;
  kalla: BibliotekKalla;
  /** Visningsnamn på ägande lärare (för `kalla='larare'`). */
  agare?: string;
  amne: string;
  bokmarkt: boolean;
};

export type QuizFraga = {
  id: string;
  fraga: string;
  alternativ: string[];
  /** Index i `alternativ` som är rätt. */
  ratt: number;
};

export type Quiz = {
  id: string;
  klassId: string;
  titel: string;
  amne: string;
  fragor: QuizFraga[];
};

export type StudieplanModul = {
  id: string;
  titel: string;
  klar: boolean;
};

export type Studieplan = {
  id: string;
  namn: string;
  moduler: StudieplanModul[];
};

/**
 * Demo-ayah för Koran-skrift-canvasen. UPPENBAR teknisk platshållare —
 * en liten uppsättning välkända, korta verser som mall att spåra. Ersätts av
 * #6:s grindade `quran_text` när `SKOLA_KORAN_DATA` är på. Aldrig fejkat
 * religiöst innehåll: detta är riktig, allmänt känd text, tydligt märkt demo.
 */
export type DemoAyah = {
  ref: string;
  surah: string;
  arabisk: string;
  translitteration: string;
  oversattning: string;
};
