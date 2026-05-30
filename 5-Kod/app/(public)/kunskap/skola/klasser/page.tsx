// Skolan F3 — Mina klasser. Lista över klasser (mock) + gå-med-via-kod +
// lärar-ansökan (grindat). Ingen DB.
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { KLASSER } from "@/lib/skola/mock";
import { GaMedViaKod, LararAnsokan } from "@/components/skola/klasser/klass-atgarder";

export default function KlasserPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="flex flex-col gap-4">
          <h2 className="heading-3">Mina klasser</h2>
          {KLASSER.length === 0 ? (
            <p style={{ color: "var(--color-ink-3)" }}>
              Du är inte med i någon klass än. Gå med via en kod du fått av din lärare.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {KLASSER.map((k) => (
                <li key={k.id}>
                  <Link
                    href={`/kunskap/skola/klasser/${k.id}`}
                    className="card card-hover flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="heading-3" style={{ fontSize: 20 }}>
                        {k.namn}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Pill tone={k.typ === "snabb" ? "copper" : "forest"}>
                          {k.typ === "snabb" ? "Helgkurs" : "Permanent"}
                        </Pill>
                        <Pill tone="paper">{k.amne}</Pill>
                      </div>
                    </div>
                    <p style={{ color: "var(--color-ink-2)", fontSize: 15, lineHeight: 1.5 }}>
                      {k.beskrivning}
                    </p>
                    <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
                      Lärare: {k.larare.namn} · {k.antalElever} elever
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <div className="card card-tight flex flex-col gap-3">
            <GaMedViaKod />
            <p style={{ color: "var(--color-ink-4)", fontSize: 13 }}>
              Förälder? Du kan också skapa ett barnkonto och koppla det till en klass med
              samtycke. (Kommer i föräldra-vyn.)
            </p>
          </div>
          <LararAnsokan />
        </aside>
      </section>
    </div>
  );
}
