// Modul M10 — Anmäl förening (publik sida, kräver inloggning för submit).
import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AnmalForeningForm } from "./anmal-form";

export const metadata = { title: "Anmäl er förening — Sadaqah Sweden" };

export default async function AnmalForening() {
  const me = await aktuellAnvandare();

  return (
    <Section tone="paper" spacing="default">
      <Container width="narrow">
        <LinkButton href="/foreningar" variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size={14} />}>
          Tillbaka till katalogen
        </LinkButton>
        <h1 className="heading-1 mt-4">Är ni en förening eller moské och vill synas?</h1>
        <p className="lead mt-3" style={{ maxWidth: "60ch" }}>
          Fyll i formuläret nedan — vi publicerar er i katalogen efter granskning.
          Plattformen är gratis att synas på och tar inget mellanskick på det ni
          eventuellt samlar in.
        </p>

        <Card className="mt-8">
          {!me ? (
            <div className="text-center">
              <p style={{ color: "var(--color-ink-2)" }}>
                Du behöver vara inloggad för att skicka in en anmälan.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <LinkButton href={`/login?next=${encodeURIComponent("/foreningar/anmal")}`}>
                  Logga in
                </LinkButton>
                <LinkButton href={`/registrera?next=${encodeURIComponent("/foreningar/anmal")}`} variant="secondary">
                  Skapa konto
                </LinkButton>
              </div>
            </div>
          ) : (
            <AnmalForeningForm />
          )}
        </Card>
      </Container>
    </Section>
  );
}

void redirect; // appease tree-shaker, route may redirect on submit
