// Formatering — SEK, datum, procent. Pengar lagras alltid som heltal öre (CLAUDE.md §7).

const SEK = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export function kr(ore: number): string {
  return SEK.format(ore / 100);
}

export function kortBelopp(ore: number): string {
  const sek = ore / 100;
  if (sek >= 1_000_000) return `${(sek / 1_000_000).toFixed(1).replace(".", ",")} mkr`;
  if (sek >= 10_000) return `${Math.round(sek / 1000)} tkr`;
  return SEK.format(sek);
}

export function antal(n: number): string {
  return NUM.format(n);
}

export function datum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

export function dagarKvar(deadlineIso: string): number {
  const ms = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function procentAvMal(
  insamlatOre: number,
  malbeloppModell: "fast" | "intervall" | "oppet" | string,
  malbeloppOre: number | null,
  malbeloppMaxOre: number | null,
): number | null {
  const m =
    malbeloppModell === "fast"
      ? malbeloppOre
      : malbeloppModell === "intervall"
      ? malbeloppMaxOre
      : null;
  if (!m || m <= 0) return null;
  return Math.min(100, Math.round((insamlatOre / m) * 100));
}
