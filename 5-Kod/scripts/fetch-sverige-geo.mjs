// scripts/fetch-sverige-geo.mjs
//
// Hämtar GeoJSON för Sveriges 21 län + 290 kommuner från okfse/sweden-geojson
// (public domain, OpenStreetMap-derived) och:
//   1. Sparar geometrin i 5-Kod/public/geo/{sverige-lan,sverige-kommuner}.geojson
//      (statiska assets som MapLibre laddar i klienten).
//   2. Genererar seed-rader för plats_taxonomi som klistras in i migration 0022.
//
// Körs en gång manuellt vid behov av uppdatering. SCB-koder är stabila;
// detta script behöver inte köras i CI eller per build.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const publicGeoDir = resolve(projectRoot, 'public', 'geo');

// ISO 3166-2:SE-koder + officiella länsnamn (SCB).
// Källa: SCB:s länsförteckning och SS-EN ISO 3166-2.
const LAN_META = {
  '01': { namn: 'Stockholms län', kort: 'Stockholm', iso: 'SE-AB' },
  '03': { namn: 'Uppsala län', kort: 'Uppsala', iso: 'SE-C' },
  '04': { namn: 'Södermanlands län', kort: 'Södermanland', iso: 'SE-D' },
  '05': { namn: 'Östergötlands län', kort: 'Östergötland', iso: 'SE-E' },
  '06': { namn: 'Jönköpings län', kort: 'Jönköping', iso: 'SE-F' },
  '07': { namn: 'Kronobergs län', kort: 'Kronoberg', iso: 'SE-G' },
  '08': { namn: 'Kalmar län', kort: 'Kalmar', iso: 'SE-H' },
  '09': { namn: 'Gotlands län', kort: 'Gotland', iso: 'SE-I' },
  '10': { namn: 'Blekinge län', kort: 'Blekinge', iso: 'SE-K' },
  '12': { namn: 'Skåne län', kort: 'Skåne', iso: 'SE-M' },
  '13': { namn: 'Hallands län', kort: 'Halland', iso: 'SE-N' },
  '14': { namn: 'Västra Götalands län', kort: 'Västra Götaland', iso: 'SE-O' },
  '17': { namn: 'Värmlands län', kort: 'Värmland', iso: 'SE-S' },
  '18': { namn: 'Örebro län', kort: 'Örebro', iso: 'SE-T' },
  '19': { namn: 'Västmanlands län', kort: 'Västmanland', iso: 'SE-U' },
  '20': { namn: 'Dalarnas län', kort: 'Dalarna', iso: 'SE-W' },
  '21': { namn: 'Gävleborgs län', kort: 'Gävleborg', iso: 'SE-X' },
  '22': { namn: 'Västernorrlands län', kort: 'Västernorrland', iso: 'SE-Y' },
  '23': { namn: 'Jämtlands län', kort: 'Jämtland', iso: 'SE-Z' },
  '24': { namn: 'Västerbottens län', kort: 'Västerbotten', iso: 'SE-AC' },
  '25': { namn: 'Norrbottens län', kort: 'Norrbotten', iso: 'SE-BD' },
};

// l_id (1–25, sparse, från okfse-filen) → SCB:s tvåställiga länskod.
// Datamodellen sparar SCB-koden — l_id är bara okfse-fältet vi behöver översätta.
const LAN_ID_TO_KOD = {
  1: '01', 3: '03', 4: '04', 5: '05', 6: '06', 7: '07', 8: '08', 9: '09',
  10: '10', 12: '12', 13: '13', 14: '14', 17: '17', 18: '18', 19: '19',
  20: '20', 21: '21', 22: '22', 23: '23', 24: '24', 25: '25',
};

async function huvud() {
  const lanUrl = 'https://raw.githubusercontent.com/okfse/sweden-geojson/master/swedish_regions.geojson';
  const komUrl = 'https://raw.githubusercontent.com/okfse/sweden-geojson/master/swedish_municipalities.geojson';

  console.log('Hämtar län-GeoJSON ...');
  const lanRaw = await (await fetch(lanUrl)).text();
  const lan = JSON.parse(lanRaw);
  console.log('Hämtar kommun-GeoJSON ...');
  const komRaw = await (await fetch(komUrl)).text();
  const kom = JSON.parse(komRaw);

  // Lägg till SCB-koden direkt i län-featurens properties så MapLibre kan
  // joina mot geo_aggregat utan en separat uppslagstabell på klienten.
  for (const f of lan.features) {
    const kod = LAN_ID_TO_KOD[f.properties.l_id];
    if (!kod) throw new Error(`Okänt l_id: ${f.properties.l_id}`);
    f.properties.kod = kod;
    f.properties.namn = LAN_META[kod].namn;
    f.properties.kort_namn = LAN_META[kod].kort;
    f.properties.iso = LAN_META[kod].iso;
  }

  // Kommunfilen har redan `lan_code` (SCB-länskod) och `id` (SCB-kommunkod) +
  // `kom_namn`. Normalisera fältnamnen så MapLibre-konsumenten ser samma
  // form som län-filen.
  for (const f of kom.features) {
    f.properties.kod = f.properties.id;
    f.properties.namn = f.properties.kom_namn;
    f.properties.lan_kod = f.properties.lan_code;
    // Behåll geo_point_2d för en eventuell label-pin i klienten.
    delete f.properties.id;
    delete f.properties.kom_namn;
    delete f.properties.lan_code;
  }

  mkdirSync(publicGeoDir, { recursive: true });
  writeFileSync(resolve(publicGeoDir, 'sverige-lan.geojson'), JSON.stringify(lan));
  writeFileSync(resolve(publicGeoDir, 'sverige-kommuner.geojson'), JSON.stringify(kom));
  console.log('Skrev sverige-lan.geojson + sverige-kommuner.geojson till public/geo/');

  // Bygg seed-SQL: 21 län + 290 kommuner till plats_taxonomi.
  const lines = [];
  lines.push('-- AUTO-GENERERAD AV scripts/fetch-sverige-geo.mjs');
  lines.push('-- Seed för public.plats_taxonomi: 21 län + 290 kommuner (SCB-koder).');
  lines.push('-- Endast koder och namn — geometrin lever som statiska GeoJSON-filer');
  lines.push('-- under 5-Kod/public/geo/ och laddas av MapLibre-klienten.');
  lines.push('');

  for (const [kod, meta] of Object.entries(LAN_META).sort()) {
    lines.push(
      `INSERT INTO public.plats_taxonomi (kod, niva, namn, kort_namn, parent_kod, iso_3166_2) VALUES (` +
        `'${kod}', 'lan', ${q(meta.namn)}, ${q(meta.kort)}, NULL, '${meta.iso}'` +
        `) ON CONFLICT (kod) DO UPDATE SET namn = EXCLUDED.namn, kort_namn = EXCLUDED.kort_namn, iso_3166_2 = EXCLUDED.iso_3166_2;`,
    );
  }
  lines.push('');

  const kommuner = kom.features
    .map((f) => ({ kod: f.properties.kod, namn: f.properties.namn, lan_kod: f.properties.lan_kod }))
    .sort((a, b) => a.kod.localeCompare(b.kod));

  for (const k of kommuner) {
    lines.push(
      `INSERT INTO public.plats_taxonomi (kod, niva, namn, kort_namn, parent_kod, iso_3166_2) VALUES (` +
        `'${k.kod}', 'kommun', ${q(k.namn)}, ${q(k.namn)}, '${k.lan_kod}', NULL` +
        `) ON CONFLICT (kod) DO UPDATE SET namn = EXCLUDED.namn, parent_kod = EXCLUDED.parent_kod;`,
    );
  }
  lines.push('');

  const seedFile = resolve(__dirname, 'plats_taxonomi_seed.sql.generated');
  writeFileSync(seedFile, lines.join('\n'));
  console.log(`Skrev ${seedFile} (${lines.length} rader). Klistra in i migration 0022.`);
}

function q(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

huvud().catch((err) => {
  console.error(err);
  process.exit(1);
});
