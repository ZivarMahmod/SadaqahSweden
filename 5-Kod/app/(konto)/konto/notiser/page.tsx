// Modul M15 — Notiser-vy.
// Plan: 1-Planering/Modul-15 Block 1.1 (in-app som "minnesyta").
// Säkerhet: kraver() + RLS notis_select_egen (mottagare_id = auth.uid()).
import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LinkButton } from "@/components/ui/button";
import { NotisRad } from "./notis-rad";
import { markeraAllaLastaForm } from "./actions";

export const metadata = {
  title: "Notiser — Sadaqah Sweden",
};

export default async function NotiserPage() {
  await kraver();
  const supabase = await createClient();

  const { data: rader, error } = await supabase
    .from("notis")
    .select("id, titel, text, lank, grupp, last_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const olasta = (rader ?? []).filter((r) => !r.last_at).length;

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <LinkButton href="/konto" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
              Tillbaka till konto
            </LinkButton>
            <h1 className="heading-1 mt-3">Notiser</h1>
            <p className="lead mt-2">
              Allt som hänt — granskningsbeslut, donationer, badge-tilldelningar
              och uppdateringar från insamlingar du stöttat.
            </p>
          </div>
          {olasta > 0 && (
            <form action={markeraAllaLastaForm}>
              <button type="submit" className="btn btn-secondary btn-sm">
                <Icon name="check" size={14} /> Markera alla som lästa ({olasta})
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          {error && (
            <Card variant="tight">
              <p style={{ color: "var(--color-danger)" }}>Fel: {error.message}</p>
            </Card>
          )}

          {!error && (!rader || rader.length === 0) && (
            <EmptyState
              icon={<Icon name="sparkles" size={24} />}
              title="Inga notiser än"
              description="När något händer — granskningsbeslut, ny donation, resultat-bevis från insamlingar du stöttat — dyker det upp här."
              action={<LinkButton href="/insamlingar">Utforska insamlingar</LinkButton>}
            />
          )}

          {rader && rader.length > 0 && (
            <ul className="flex flex-col gap-3">
              {rader.map((r) => (
                <NotisRad
                  key={r.id}
                  id={r.id}
                  titel={r.titel}
                  text={r.text}
                  lank={r.lank}
                  grupp={r.grupp}
                  last={r.last_at != null}
                  createdRel={relativTid(r.created_at)}
                />
              ))}
            </ul>
          )}
        </div>
      </Container>
    </Section>
  );
}

function relativTid(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "nyss";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h sedan`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d} dgr sedan`;
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}
