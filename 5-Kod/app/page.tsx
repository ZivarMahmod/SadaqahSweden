const steg = [
  {
    n: "01",
    titel: "Skapa och granskas",
    text: "Du beskriver vad du samlar in till. Vi granskar projektet mot svensk lag och islamiska principer innan det publiceras. Ingen insamling går ut ogranskad.",
  },
  {
    n: "02",
    titel: "Dela och samla in",
    text: "Insamlingen får en egen sida och en QR-kod att dela i ditt nätverk. Människor kan ge enkelt och tryggt — inget konto behövs för att donera.",
  },
  {
    n: "03",
    titel: "Visa resultatet",
    text: "När pengarna betalats ut och hjälpen levererats laddar du upp bevis. Givarna ser med egna ögon vad deras gåva blev.",
  },
];

const principer = [
  {
    titel: "Granskat före publicering",
    text: "Inget projekt når allmänheten utan att först ha granskats. Trygghet för både givare och insamlare.",
  },
  {
    titel: "Pengarna går direkt",
    text: "Donationer går via Stripe rakt till insamlaren. Noll kronor i plattformsavgift — vi tar inget mellanskick.",
  },
  {
    titel: "Spårbart hela vägen",
    text: "Varje krona kan följas, från gåva till levererat resultat. Öppenhet är inbyggt, inte en eftertanke.",
  },
  {
    titel: "Islamiskt medvetet",
    text: "Byggt på islamiska principer, för hela det muslimska samhället i Sverige — utan att ta sida mellan inriktningar.",
  },
];

const kategorier = [
  "Vatten",
  "Mat",
  "Utbildning",
  "Mosképrojekt",
  "Föräldralösa",
  "Akut katastrofhjälp",
  "Sjukvård",
  "Religiösa varor",
];

function Logotyp() {
  return (
    <span className="flex items-center gap-2.5 text-brand">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <rect x="7" y="7" width="18" height="18" rx="2.5" fill="currentColor" opacity="0.9" />
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="2.5"
          fill="currentColor"
          opacity="0.55"
          transform="rotate(45 16 16)"
        />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Sadaqah Sweden
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Topp */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logotyp />
        <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-muted">
          Lanseras 2026
        </span>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12 sm:pt-20">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-brand">
            Insamlingsplattform för det muslimska samhället
          </p>
          <h1 className="font-display text-4xl font-medium lead