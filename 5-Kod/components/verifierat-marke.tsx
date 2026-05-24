// Modul M19 — verifierat-märke. Visas på publika sidor när innehåll är
// verifierat av en lärd. Länkar till lärd-profilen.
import Link from "next/link";

type Props = {
  lardId: string;
  lardNamn: string;
  datum?: string | null;
};

export function VerifieratMarke({ lardId, lardNamn, datum }: Props) {
  return (
    <Link
      href={`/lard/${lardId}`}
      className="pill pill-success"
      style={{ textDecoration: "none" }}
      title={datum ? `Verifierad ${new Date(datum).toLocaleDateString("sv-SE")}` : undefined}
    >
      <span aria-hidden>✓</span>
      Verifierad av {lardNamn}
    </Link>
  );
}
