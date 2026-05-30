// Skolan F9 — spela ett quiz. Server hämtar quizet (mock) → klient-spelaren.
import { notFound } from "next/navigation";
import Link from "next/link";
import { hamtaQuiz } from "@/lib/skola/mock";
import { QuizSpelare } from "@/components/skola/quiz/quiz-spelare";

type Params = Promise<{ id: string }>;

export default async function QuizDetalj({ params }: { params: Params }) {
  const { id } = await params;
  const quiz = hamtaQuiz(id);
  if (!quiz) notFound();

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-6">
      <Link href="/kunskap/skola/quiz" style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
        ← Alla quiz
      </Link>
      <QuizSpelare quiz={quiz} />
    </div>
  );
}
