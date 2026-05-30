// Skolan F9 — quiz-lista. Kunskap/ord. Privat poäng, ingen topplista.
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { KLASSER, QUIZZAR } from "@/lib/skola/mock";

export default function QuizPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-[640px]">
        <h2 className="heading-3">Quiz</h2>
        <p className="lead mt-2" style={{ fontSize: 16 }}>
          Öva ord och kunskap i din egen takt. Ditt resultat är privat — ingen topplista och
          ingen jämförelse. Quiz finns bara för kunskap och ord, aldrig för recitation eller bön
          som tillbedjan.
        </p>
      </header>

      {QUIZZAR.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>Inga quiz än.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {QUIZZAR.map((q) => {
            const klass = KLASSER.find((k) => k.id === q.klassId);
            return (
              <li key={q.id}>
                <Link href={`/kunskap/skola/quiz/${q.id}`} className="card card-hover flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="heading-3" style={{ fontSize: 19 }}>
                      {q.titel}
                    </h3>
                    <Pill tone="paper">{q.amne}</Pill>
                  </div>
                  <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
                    {klass?.namn} · {q.fragor.length} frågor
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
        Lärare skapar quiz till sina klasser. (Skapa-quiz-vyn kopplas till backend senare.)
      </p>
    </div>
  );
}
