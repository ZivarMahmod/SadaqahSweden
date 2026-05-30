// Skolan — 404-läge inom skol-skalet. Fångar notFound() från klass-/quiz-sidor.
import { LinkButton } from "@/components/ui/button";

export default function SkolaNotFound() {
  return (
    <div
      className="card card-bare flex flex-col items-center gap-4 px-8 py-16 text-center"
      style={{ border: "1px dashed var(--color-paper-line)" }}
    >
      <span className="pill pill-outline">Hittades inte</span>
      <h3 className="heading-3">Den här sidan finns inte</h3>
      <p className="lead mx-auto max-w-md" style={{ fontSize: 16 }}>
        Klassen eller sidan du letade efter finns inte — den kan ha arkiverats eller så är
        länken fel.
      </p>
      <LinkButton href="/kunskap/skola" variant="primary">
        Till Skolans hem
      </LinkButton>
    </div>
  );
}
