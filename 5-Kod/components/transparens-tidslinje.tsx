// Modul M7 — Transparens-tidslinje (publik render).
// Design: handoff-to-code/fundraiser.html (transparens-sektion) ·
// Plan: Modul-07 Block 5 (Tripadvisor-modellen — visa fakta, anklaga aldrig).
// Säkerhet: Läser via view public.transparens_tidslinje (security_invoker) +
// public.transparens_bevis + public.transparens_uppdatering — RLS-skyddade.
//
// Om `community` är satt renderas M13 reaktioner + kommentarer inline per
// uppdatering (insamlingssidan). Andra användare av komponenten (profilsida
// osv) skickar inte in det och får tidigare beteende.
import { createClient } from "@/lib/supabase/server";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { datum } from "@/lib/format";
import { UppdateringCommunity } from "@/app/(public)/insamlingar/[publicId]/uppdatering-community";

type CommunityConfig = {
  insamlingPublicId: string;
  agareId: string;
  kommentarerAvstangda: boolean;
};

type BevisTyp = "start" | "utbetalning" | "resultat";

type TidslinjePost =
  | {
      kind: "bevis";
      bevisTyp: BevisTyp;
      id: string;
      godkantAt: string | null;
      systemgenererad: boolean;
      created: string;
      text: string | null;
    }
  | {
      kind: "uppdatering";
      id: string;
      created: string;
      text: string;
    };

export async function TransparensTidslinje({
  insamlingId,
  community,
}: {
  insamlingId: string;
  community?: CommunityConfig;
}) {
  const supabase = await createClient();

  const [{ data: bevis }, { data: uppdateringar }, { data: badges }] = await Promise.all([
    supabase
      .from("transparens_bevis")
      .select("id, bevis_typ, systemgenererad, godkant_at, uppdatering_id, created_at")
      .eq("insamling_id", insamlingId)
      .order("created_at", { ascending: true }),
    supabase
      .from("transparens_uppdatering")
      .select("id, text, ar_bevis, created_at")
      .eq("insamling_id", insamlingId)
      .eq("dold", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("insamling_badge")
      .select("badge:badge_id(slug, namn, beskrivning), tilldelad_at")
      .eq("insamling_id", insamlingId)
      .is("indragen_at", null),
  ]);

  const upMap = new Map(
    (uppdateringar ?? []).map((u) => [u.id, u]),
  );

  const posts: TidslinjePost[] = [];

  for (const b of bevis ?? []) {
    const tied = b.uppdatering_id ? upMap.get(b.uppdatering_id) : undefined;
    posts.push({
      kind: "bevis",
      bevisTyp: b.bevis_typ as BevisTyp,
      id: b.id,
      godkantAt: b.godkant_at,
      systemgenererad: b.systemgenererad,
      created: b.created_at,
      text: tied?.text ?? null,
    });
  }
  for (const u of uppdateringar ?? []) {
    if (u.ar_bevis) continue; // bevis-texten är redan inflätad ovan
    posts.push({
      kind: "uppdatering",
      id: u.id,
      created: u.created_at,
      text: u.text,
    });
  }

  posts.sort((a, b) => a.created.localeCompare(b.created));

  const finnsResultat = (bevis ?? []).some(
    (b) => b.bevis_typ === "resultat" && b.godkant_at != null,
  );

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="h-2">Transparens-loopen</h2>
          <p className="lead mt-2" style={{ maxWidth: "60ch" }}>
            Start, utbetalning, resultat — tre obligatoriska punkter, plus fria
            uppdateringar däremellan. Plattformen visar fakta, drar inga
            slutsatser.
          </p>
        </div>
        {(badges ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(badges ?? []).map((b, i) =>
              b.badge ? (
                <Pill key={i} tone="success">
                  <Icon name="check-circle" size={12} /> {b.badge.namn}
                </Pill>
              ) : null,
            )}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <Card variant="tight" className="mt-6">
          <p style={{ color: "var(--color-ink-3)" }}>
            Ingen historik än — insamlingen är precis igång.
          </p>
        </Card>
      ) : (
        <ol className="mt-8 flex flex-col gap-0" aria-label="Transparens-tidslinje">
          {posts.map((p, idx) => (
            <TidslinjeRad
              key={p.id}
              post={p}
              sist={idx === posts.length - 1}
              insamlingId={insamlingId}
              community={community}
            />
          ))}
          {!finnsResultat && <ResultatVantar />}
        </ol>
      )}
    </section>
  );
}

async function TidslinjeRad({
  post,
  sist,
  insamlingId,
  community,
}: {
  post: TidslinjePost;
  sist: boolean;
  insamlingId: string;
  community?: CommunityConfig;
}) {
  const meta = postMeta(post);
  return (
    <li className="relative grid grid-cols-[28px_1fr] gap-4 pb-6">
      {!sist && (
        <span
          aria-hidden
          className="absolute left-[13px] top-7 bottom-0 w-px"
          style={{ background: "var(--color-ink-line)" }}
        />
      )}
      <span
        aria-hidden
        className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full"
        style={{
          background: meta.dotBg,
          color: meta.dotColor,
          border: `2px solid ${meta.dotBorder}`,
        }}
      >
        <Icon name={meta.icon} size={12} />
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-semibold uppercase"
            style={{ letterSpacing: "0.08em", color: meta.headingColor }}
          >
            {meta.heading}
          </span>
          <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
            {datum(post.created)}
          </span>
          {meta.taggar.map((t, i) => (
            <Pill key={i} tone={t.tone} className="text-xs">
              {t.label}
            </Pill>
          ))}
        </div>
        {post.kind === "bevis" && post.bevisTyp === "start" && (
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
            Löftet publicerades och granskningen godkändes. Resultatet jämförs
            mot detta löfte.
          </p>
        )}
        {post.kind === "bevis" && post.bevisTyp === "utbetalning" && (
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
            Pengar har lämnat plattformen och nått den verifierade insamlaren.
          </p>
        )}
        {post.kind === "bevis" && post.bevisTyp === "resultat" && post.text && (
          <p
            className="mt-2 whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: "var(--color-ink-1)" }}
          >
            {post.text}
          </p>
        )}
        {post.kind === "bevis" && post.bevisTyp === "resultat" && !post.text && (
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
            Resultat-bevis lämnat — väntar på granskning.
          </p>
        )}
        {post.kind === "uppdatering" && (
          <>
            <p
              className="mt-2 whitespace-pre-wrap text-sm leading-relaxed"
              style={{ color: "var(--color-ink-1)" }}
            >
              {post.text}
            </p>
            {community && (
              <UppdateringCommunity
                insamlingId={insamlingId}
                insamlingPublicId={community.insamlingPublicId}
                uppdateringId={post.id}
                agareId={community.agareId}
                kommentarerAvstangda={community.kommentarerAvstangda}
              />
            )}
          </>
        )}
      </div>
    </li>
  );
}

function ResultatVantar() {
  return (
    <li className="relative grid grid-cols-[28px_1fr] gap-4 pb-2">
      <span
        aria-hidden
        className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full"
        style={{
          background: "var(--color-paper)",
          color: "var(--color-ink-3)",
          border: "2px dashed var(--color-ink-line)",
        }}
      >
        <Icon name="clock" size={12} />
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-semibold uppercase"
            style={{ letterSpacing: "0.08em", color: "var(--color-ink-3)" }}
          >
            Resultat — väntar
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
          Insamlaren postar resultat-bevis när det lovade är genomfört.
        </p>
      </div>
    </li>
  );
}

function postMeta(post: TidslinjePost): {
  heading: string;
  icon: string;
  dotBg: string;
  dotColor: string;
  dotBorder: string;
  headingColor: string;
  taggar: Array<{ label: string; tone: "success" | "copper" | "paper" | "outline" }>;
} {
  if (post.kind === "uppdatering") {
    return {
      heading: "Uppdatering",
      icon: "sparkles",
      dotBg: "var(--color-paper)",
      dotColor: "var(--color-ink-1)",
      dotBorder: "var(--color-ink-line)",
      headingColor: "var(--color-ink-3)",
      taggar: [],
    };
  }
  const godkand = post.godkantAt != null;
  switch (post.bevisTyp) {
    case "start":
      return {
        heading: "Start",
        icon: "flag",
        dotBg: "var(--color-copper-soft)",
        dotColor: "var(--color-copper-deep)",
        dotBorder: "var(--color-copper)",
        headingColor: "var(--color-copper-deep)",
        taggar: [{ label: "Granskat", tone: "success" }],
      };
    case "utbetalning":
      return {
        heading: "Utbetalning",
        icon: "shield-check",
        dotBg: "var(--color-copper-soft)",
        dotColor: "var(--color-copper-deep)",
        dotBorder: "var(--color-copper)",
        headingColor: "var(--color-copper-deep)",
        taggar: [{ label: "Stripe-bekräftat", tone: "success" }],
      };
    case "resultat":
      return {
        heading: "Resultat",
        icon: "check-circle",
        dotBg: godkand ? "var(--color-copper-soft)" : "var(--color-paper)",
        dotColor: godkand ? "var(--color-copper-deep)" : "var(--color-ink-3)",
        dotBorder: godkand ? "var(--color-copper)" : "var(--color-ink-line)",
        headingColor: godkand ? "var(--color-copper-deep)" : "var(--color-ink-2)",
        taggar: godkand
          ? [{ label: "Godkänt", tone: "success" }]
          : [{ label: "Väntar granskning", tone: "copper" }],
      };
  }
}
