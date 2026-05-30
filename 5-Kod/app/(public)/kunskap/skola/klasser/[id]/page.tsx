// Skolan F3/F4/F5 — klass-detalj (mock). Uppgifter → min inlämning → feedback,
// gruppyta, klassens material. Elev-vy (syns bara eget + det läraren delar).
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { renderMarkdown } from "@/lib/innehall/markdown";
import {
  BIBLIOTEK_LARARE,
  GRUPP_MEDLEMMAR,
  INLAMNINGAR,
  JAG,
  hamtaKlass,
  quizzarForKlass,
  uppgifterForKlass,
} from "@/lib/skola/mock";

type Params = Promise<{ id: string }>;

const STATUS_TON: Record<string, "forest" | "copper" | "success" | "paper"> = {
  utkast: "paper",
  inlamnad: "copper",
  aterkommen: "forest",
};
const STATUS_TEXT: Record<string, string> = {
  utkast: "Utkast",
  inlamnad: "Inlämnad",
  aterkommen: "Återkommen med feedback",
};

export default async function KlassDetalj({ params }: { params: Params }) {
  const { id } = await params;
  const klass = hamtaKlass(id);
  if (!klass) notFound();

  const uppgifter = uppgifterForKlass(klass.id);
  const quiz = quizzarForKlass(klass.id);
  const material = BIBLIOTEK_LARARE.filter((b) => b.amne === klass.amne);

  return (
    <div className="flex flex-col gap-10">
      {/* Klass-header */}
      <header className="flex flex-col gap-3">
        <Link href="/kunskap/skola/klasser" style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          ← Mina klasser
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="heading-2">{klass.namn}</h2>
          <div className="flex items-center gap-2">
            <Pill tone={klass.typ === "snabb" ? "copper" : "forest"}>
              {klass.typ === "snabb" ? "Helgkurs" : "Permanent"}
            </Pill>
            <Pill tone="paper">{klass.amne}</Pill>
          </div>
        </div>
        <p className="lead" style={{ fontSize: 16 }}>
          {klass.beskrivning}
        </p>
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          Lärare: {klass.larare.namn} · {klass.antalElever} elever · Join-kod:{" "}
          <code>{klass.joinKod}</code>
        </p>
      </header>

      {/* Uppgifter */}
      <section className="flex flex-col gap-4">
        <h3 className="heading-3">Uppgifter</h3>
        {uppgifter.length === 0 ? (
          <p style={{ color: "var(--color-ink-3)" }}>Inga uppgifter utdelade än.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {uppgifter.map((u) => {
              const min = INLAMNINGAR.find((i) => i.uppgiftId === u.id && i.elev.id === JAG.id);
              return (
                <li key={u.id} className="card flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="heading-3" style={{ fontSize: 18 }}>
                      {u.titel}
                    </h4>
                    <div className="flex items-center gap-2">
                      {u.typ === "grupp" && <Pill tone="copper">Grupparbete</Pill>}
                      {u.deadline && (
                        <span style={{ color: "var(--color-ink-3)", fontSize: 13 }}>
                          Deadline {u.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="prose-skola"
                    style={{ color: "var(--color-ink-2)", fontSize: 15 }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(u.instruktion) }}
                  />

                  {u.typ === "grupp" && (
                    <div
                      className="rounded-[var(--radius-md)] px-4 py-3"
                      style={{ background: "var(--color-copper-soft)" }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-copper-deep)" }}>
                        Din grupp delar en gemensam yta
                      </p>
                      <p style={{ color: "var(--color-ink-2)", fontSize: 14 }}>
                        {GRUPP_MEDLEMMAR.map((m) => m.namn).join(", ")} — samla material och lämna
                        in tillsammans. (Realtids-närvaro på gruppytan kopplas in senare.)
                      </p>
                    </div>
                  )}

                  {/* Min inlämning + feedback */}
                  <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--color-paper-line)" }}>
                    {min ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>Min inlämning:</span>
                          <Pill tone={STATUS_TON[min.status]}>{STATUS_TEXT[min.status]}</Pill>
                        </div>
                        <p style={{ fontSize: 15, color: "var(--color-ink-2)" }}>{min.innehall}</p>
                        {min.feedback && (
                          <div
                            className="rounded-[var(--radius-md)] px-4 py-3"
                            style={{ background: "var(--color-success-soft)" }}
                          >
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-success)" }}>
                              Feedback från läraren
                            </p>
                            <p style={{ fontSize: 14, color: "var(--color-ink-2)" }}>{min.feedback}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
                        Ingen inlämning än. (Inlämningsflödet kopplas till backend senare.)
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Klassens material */}
      {material.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="heading-3">Klassens material</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {material.map((m) => (
              <li key={m.id} className="card card-tight flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{m.titel}</span>
                  <Pill tone="paper">{m.typ}</Pill>
                </div>
                <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>{m.beskrivning}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quiz i klassen */}
      {quiz.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="heading-3">Quiz</h3>
          <ul className="flex flex-col gap-2">
            {quiz.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/kunskap/skola/quiz/${q.id}`}
                  className="card card-tight card-hover flex items-center justify-between gap-3"
                >
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{q.titel}</span>
                  <span style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
                    {q.fragor.length} frågor →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
