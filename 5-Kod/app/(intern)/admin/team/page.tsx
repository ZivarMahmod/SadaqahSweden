// M17 — admin-vy för team-hantering.

import { kraver } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { TeamInviteForm, TeamInaktiveraKnapp, TeamAterstallMfaKnapp } from "./hantering";

export const metadata = { title: "Team — Admin — Sadaqah Sweden" };
export const dynamic = "force-dynamic";

export default async function TeamSida() {
  const me = await kraver(["admin"]);
  const supabase = await createClient();

  const [{ data: medlemmar }, { data: invitationer }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, public_id, visningsnamn, e_post, roll, team_inaktiverad_at, created_at")
      .in("roll", ["granskare", "admin"])
      .is("deleted_at", null)
      .order("roll")
      .order("visningsnamn"),
    supabase
      .from("team_invitation")
      .select("id, email, roll, expires_at, redeemed_at, avbruten_at, noteringar, created_at, token")
      .is("redeemed_at", null)
      .is("avbruten_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <Section tone="paper" spacing="tight">
      <Container width="default">
        <h1 className="heading-2">Team</h1>
        <p className="lead mt-2">Inga självregistreringar — admin bjuder in. TOTP är obligatorisk.</p>

        <Card variant="loose" className="mt-8">
          <h2 className="heading-3">Bjud in</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
            En länk genereras — kopiera och skicka till mottagaren via en
            kanal du litar på. Länken är giltig 7 dagar.
          </p>
          <TeamInviteForm />
        </Card>

        <h2 className="heading-3 mt-12">Aktiva inbjudningar</h2>
        {(invitationer ?? []).length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--color-ink-3)" }}>Inga öppna inbjudningar.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {(invitationer ?? []).map((i) => (
              <li key={i.id}>
                <Card variant="tight">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="copper">{i.roll}</Pill>
                      <span className="text-sm font-semibold">{i.email}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                      Går ut {new Date(i.expires_at).toLocaleDateString("sv-SE")}
                    </span>
                  </div>
                  <p
                    className="mt-2 break-all rounded p-2 text-xs"
                    style={{ background: "var(--color-paper)", fontFamily: "var(--font-mono)" }}
                  >
                    {`/team/accept-invite/${i.token}`}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <h2 className="heading-3 mt-12">Team-medlemmar</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(medlemmar ?? []).map((p) => (
            <li key={p.id}>
              <Card variant="tight">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={p.roll === "admin" ? "copper" : "outline"}>{p.roll}</Pill>
                    <span className="font-semibold">{p.visningsnamn}</span>
                    <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>{p.e_post}</span>
                    {p.team_inaktiverad_at && <Pill tone="paper">Inaktiverad</Pill>}
                  </div>
                  {p.id !== me.userId && !p.team_inaktiverad_at && (
                    <div className="flex gap-2">
                      <TeamAterstallMfaKnapp profileId={p.id} namn={p.visningsnamn} />
                      <TeamInaktiveraKnapp profileId={p.id} namn={p.visningsnamn} />
                    </div>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
