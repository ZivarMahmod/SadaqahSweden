// Skolan — demo-ayah för Koran-skrift-canvasen (F10).
//
// ⚠️ UPPENBAR TEKNISK PLATSHÅLLARE. Detta är en liten uppsättning välkända,
// korta verser som mall att SPÅRA på skärmen medan #6 (Koran-modulen) inte är
// byggd live. Visas bara bakom flaggan SKOLA_KORAN_DEMO. När SKOLA_KORAN_DATA
// är på hämtas riktig, grindad text från #6:s `quran_text` i stället.
//
// Detta är riktig, allmänt känd text — inget fejkat religiöst innehåll. Den är
// tydligt märkt som demo i UI:t och ersätts av registrets grindade data.
// Ingen recitation/uttal-ljud här (det kräver #6/#7 + grind).

import type { DemoAyah } from "./typer";

export const DEMO_AYAH: DemoAyah[] = [
  {
    ref: "1:1",
    surah: "al-Fātiḥa",
    arabisk: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    translitteration: "bismi llāhi r-raḥmāni r-raḥīm",
    oversattning: "I Guds, den Nåderikes, den Barmhärtiges namn.",
  },
  {
    ref: "103:1",
    surah: "al-ʿAsr",
    arabisk: "وَٱلْعَصْرِ",
    translitteration: "wal-ʿaṣr",
    oversattning: "Vid den flyende tiden!",
  },
  {
    ref: "112:1",
    surah: "al-Ikhlāṣ",
    arabisk: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    translitteration: "qul huwa llāhu aḥad",
    oversattning: "Säg: «Han är Gud — En.»",
  },
];
