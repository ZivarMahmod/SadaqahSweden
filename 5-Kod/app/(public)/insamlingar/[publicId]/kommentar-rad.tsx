"use client";

// Klientkomponent för en enskild kommentar — inklusive svarstråd, "Svara",
// rapportera-formulär och radera-knapp. RLS + server actions säkrar all
// faktisk behörighet.

import { useState, useTransition } from "react";
import Link from "next/link";
import { KommentarForm } from "./kommentar-form";
import {
  rapporteraAction,
  raderaKommentarAction,
  granskareDoljAction,
  granskareAterstallAction,
} from "./community-actions";
import type { KommentarVisa } from "./community-section";

export function KommentarRad({
  kommentar,
  insamlingPublicId,
  insamlingId,
  meUserId,
  agareId,
  kanSvara,
  svar,
  arGranskare,
  djup = 0,
}: {
  kommentar: KommentarVisa;
  insamlingPublicId: string;
  insamlingId: string;
  meUserId: string | null;
  agareId: string;
  kanSvara: boolean;
  svar: KommentarVisa[];
  arGranskare?: boolean;
  djup?: number;
}) {
  const [oppnaSvar, setOppnaSvar] = useState(false);
  const [oppnaRapport, setOppnaRapport] = useState(false);
  const [skal, setSkal] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const arEgenKommentar = meUserId === kommentar.author_id;
  const arAgarensKommentar = kommentar.author_id === agareId;
  const kanRapportera = !!meUserId && !arEgenKommentar && !kommentar.dold;

  function rapportera(e: React.FormEvent) {
    e.preventDefault();
    setFel(null);
    if (!skal.trim()) {
      setFel("Skäl krävs");
      return;
    }
    start(async () => {
      const res = await rapporteraAction(insamlingPublicId, kommentar.id, skal);
      if (!res.ok) {
        setFel(res.fel);
      } else {
        setSkal("");
        setOppnaRapport(false);
      }
    });
  }

  function radera() {
    if (!confirm("Radera den här kommentaren?")) return;
    start(async () => {
      await raderaKommentarAction(insamlingPublicId, kommentar.id);
    });
  }

  function granskareDolj() {
    if (!confirm("Dölj denna kommentar?")) return;
    const motivering = prompt("Kort motivering (synlig i loggen):") ?? "granskar-beslut";
    start(async () => {
      await granskareDoljAction(insamlingPublicId, kommentar.id, motivering);
    });
  }

  function granskareAterstall() {
    start(async () => {
      await granskareAterstallAction(insamlingPublicId, kommentar.id);
    });
  }

  return (
    <div
      className="rounded-md p-4"
      style={{
        background: kommentar.dold ? "var(--color-paper-deep)" : "var(--color-paper-soft)",
        border: "1px solid var(--color-ink-line)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 text-sm">
          {kommentar.author_public_id ? (
            <Link
              href={`/profil/${kommentar.author_public_id}`}
              className="font-semibold"
              style={{ color: "var(--color-forest)" }}
            >
              {kommentar.author_namn}
            </Link>
          ) : (
            <span className="font-semibold">{kommentar.author_namn}</span>
          )}
          {arAgarensKommentar && (
            <span className="pill pill-copper" style={{ fontSize: 11, height: 22, padding: "0 8px" }}>
              Insamlare
            </span>
          )}
          {kommentar.dold && (
            <span
              className="pill pill-paper"
              style={{ fontSize: 11, height: 22, padding: "0 8px" }}
              title={kommentar.dold_skal ?? undefined}
            >
              Dold
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
          {formatDatum(kommentar.created_at)}
        </span>
      </div>

      <p
        className="mt-2 whitespace-pre-wrap text-sm leading-relaxed"
        style={{ color: kommentar.dold ? "var(--color-ink-3)" : "var(--color-ink-1)" }}
      >
        {kommentar.dold && !arEgenKommentar && !arGranskare
          ? "[Kommentaren är dold i väntan på granskning.]"
          : kommentar.text}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {kanSvara && djup === 0 && (
          <button
            type="button"
            onClick={() => setOppnaSvar((v) => !v)}
            className="btn btn-ghost btn-sm"
            style={{ height: 28, padding: "0 10px" }}
          >
            {oppnaSvar ? "Avbryt svar" : "Svara"}
          </button>
        )}
        {kanRapportera && (
          <button
            type="button"
            onClick={() => setOppnaRapport((v) => !v)}
            className="btn btn-ghost btn-sm"
            style={{ height: 28, padding: "0 10px" }}
          >
            {oppnaRapport ? "Avbryt" : "Rapportera"}
          </button>
        )}
        {arEgenKommentar && (
          <button
            type="button"
            onClick={radera}
            disabled={pending}
            className="btn btn-ghost btn-sm"
            style={{ height: 28, padding: "0 10px", color: "var(--color-danger)" }}
          >
            Radera
          </button>
        )}
        {arGranskare && !kommentar.dold && (
          <button
            type="button"
            onClick={granskareDolj}
            disabled={pending}
            className="btn btn-ghost btn-sm"
            style={{ height: 28, padding: "0 10px", color: "var(--color-copper-deep)" }}
          >
            Granskare: dölj
          </button>
        )}
        {arGranskare && kommentar.dold && (
          <button
            type="button"
            onClick={granskareAterstall}
            disabled={pending}
            className="btn btn-ghost btn-sm"
            style={{ height: 28, padding: "0 10px", color: "var(--color-success)" }}
          >
            Granskare: återställ
          </button>
        )}
      </div>

      {oppnaRapport && (
        <form
          onSubmit={rapportera}
          className="mt-3 flex flex-col gap-2 rounded-md p-3"
          style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}
        >
          <label
            className="field-label"
            style={{ fontSize: 12 }}
          >
            Vad är fel med kommentaren? (en mening räcker)
          </label>
          <textarea
            value={skal}
            onChange={(e) => setSkal(e.target.value.slice(0, 500))}
            rows={2}
            className="textarea"
            disabled={pending}
            required
          />
          {fel && (
            <span className="text-xs" style={{ color: "var(--color-danger)" }}>
              {fel}
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="btn btn-secondary btn-sm"
              style={{ height: 32 }}
            >
              {pending ? "Skickar …" : "Skicka rapport"}
            </button>
            <span className="text-xs" style={{ color: "var(--color-ink-3)" }}>
              3 oberoende rapporter döljer kommentaren automatiskt.
            </span>
          </div>
        </form>
      )}

      {oppnaSvar && (
        <KommentarForm
          insamlingId={insamlingId}
          insamlingPublicId={insamlingPublicId}
          uppdateringId={null}
          parentId={kommentar.id}
          kompakt
          onPostat={() => setOppnaSvar(false)}
        />
      )}

      {svar.length > 0 && (
        <ul
          className="mt-4 flex flex-col gap-3 pl-4"
          style={{ borderLeft: "2px solid var(--color-paper-line)" }}
        >
          {svar.map((s) => (
            <li key={s.id}>
              <KommentarRad
                kommentar={s}
                insamlingPublicId={insamlingPublicId}
                insamlingId={insamlingId}
                meUserId={meUserId}
                agareId={agareId}
                kanSvara={false}
                svar={[]}
                arGranskare={arGranskare}
                djup={djup + 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDatum(iso: string): string {
  const d = new Date(iso);
  const sek = Math.round((Date.now() - d.getTime()) / 1000);
  if (sek < 60) return "nyss";
  if (sek < 3600) return `${Math.round(sek / 60)} min sedan`;
  if (sek < 86400) return `${Math.round(sek / 3600)} h sedan`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}
