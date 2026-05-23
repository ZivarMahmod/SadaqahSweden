// Modul M6 — Konto fryst (admin har pausat). Användare landar här via kraver().
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { loggaUt } from "@/app/(auth)/actions";

export const metadata = {
  title: "Konto pausat — Sadaqah Sweden",
};

export default function KontoFrystPage() {
  return (
    <>
      <div
        className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "var(--color-danger-soft)",
          color: "var(--color-danger)",
        }}
      >
        <Icon name="alert-triangle" size={28} />
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 40,
          fontWeight: 400,
          lineHeight: 1.08,
          margin: 0,
          letterSpacing: "-0.012em",
        }}
      >
        Ditt konto är pausat
      </h2>
      <p
        className="mt-4"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          color: "var(--color-ink-2)",
          fontWeight: 300,
          margin: 0,
        }}
      >
        Kontot är tillfälligt fryst av en administratör. Skriv till oss så hjälper vi dig.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="mailto:kontakt@sadaqahsweden.se" variant="primary">
          Kontakta admin
        </LinkButton>
        <form action={loggaUt}>
          <button type="submit" className="btn btn-secondary">
            Logga ut
          </button>
        </form>
      </div>
    </>
  );
}
