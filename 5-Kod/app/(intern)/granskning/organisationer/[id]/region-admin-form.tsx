// FX3 — Klient-formulär för federations-uppgradering (superadmin-only).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import {
  uppgraderaTillRegionAdminAction,
  type RegionAdminResultat,
} from "./region-admin-action";

type Lan = { kod: string; namn: string };

type Props = {
  orgId: string;
  orgNamn: string;
  currentAdminNiva: string | null;
  currentRegionKod: string | null;
  lanList: Lan[];
};

export function UppgraderaRegionAdminForm({
  orgId,
  orgNamn,
  currentAdminNiva,
  currentRegionKod,
  lanList,
}: Props) {
  const router = useRouter();
  const [regionKod, setRegionKod] = useState(currentRegionKod ?? "");
  const [motivering, setMotivering] = useState("");
  const [bekraftar, setBekraftar] = useState(false);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<RegionAdminResultat | null>(null);

  const valtLan = lanList.find((l) => l.kod === regionKod);

  function submit() {
    start(async () => {
      const r = await uppgraderaTillRegionAdminAction(orgId, regionKod, motivering);
      setFeedback(r);
      if (r.ok) {
        setBekraftar(false);
        setMotivering("");
        router.refresh();
      }
    });
  }

  const klar = !!regionKod && motivering.trim().length >= 5;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
        Sätter förenings-kontot till <code>region_admin</code> med valt län.
        Region-admin granskar insamlingar i sin region. RPC:erna är idempotenta —
        re-set ändrar bara fältet + loggar i admin_ingreppslogg.
      </p>

      <div className="text-xs">
        <strong>Nuvarande:</strong>{" "}
        {currentAdminNiva ? (
          <code style={{ fontFamily: "var(--font-mono)" }}>
            {currentAdminNiva}
            {currentRegionKod ? ` / ${currentRegionKod}` : ""}
          </code>
        ) : (
          <span style={{ color: "var(--color-ink-3)" }}>(ingen admin-nivå)</span>
        )}
      </div>

      <Field label="Län (region_kod)" htmlFor="region_kod" required>
        <Select
          id="region_kod"
          value={regionKod}
          onChange={(e) => setRegionKod(e.target.value)}
          required
        >
          <option value="">— välj län —</option>
          {lanList.map((l) => (
            <option key={l.kod} value={l.kod}>
              {l.kod} — {l.namn}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Motivering"
        htmlFor="motivering-region-admin"
        required
        help="Minst 5 tecken. Loggas i admin_ingreppslogg."
      >
        <Textarea
          id="motivering-region-admin"
          rows={2}
          minLength={5}
          value={motivering}
          onChange={(e) => setMotivering(e.target.value)}
        />
      </Field>

      {feedback && !feedback.ok && <Alert tone="danger">{feedback.message}</Alert>}
      {feedback && feedback.ok && (
        <Alert tone="success">Uppgradering klar. Region-admin satt.</Alert>
      )}

      {!bekraftar ? (
        <Button
          type="button"
          size="sm"
          disabled={pending || !klar}
          onClick={() => setBekraftar(true)}
        >
          Uppgradera till region-admin…
        </Button>
      ) : (
        <div
          className="flex flex-col gap-2 rounded border p-3"
          style={{ borderColor: "var(--color-copper)" }}
        >
          <p className="text-sm">
            Bekräfta: sätt <strong>{orgNamn}</strong>s förenings-konto till{" "}
            <code>region_admin</code> i <strong>{valtLan?.namn ?? regionKod}</strong>?
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={submit} disabled={pending}>
              {pending ? "Sparar…" : "Bekräfta uppgradering"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setBekraftar(false)}
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
