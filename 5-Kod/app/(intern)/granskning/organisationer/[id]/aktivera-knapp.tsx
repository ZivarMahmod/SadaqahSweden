"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { aktiveraForeningsKontoAction, type AktiveraResultat } from "./forenings-konto-action";

export function AktiveraForeningsKontoKnapp({ orgId, alreadyActive }: { orgId: string; alreadyActive: boolean }) {
  const [res, setRes] = useState<AktiveraResultat | null>(null);
  const [pending, start] = useTransition();

  if (alreadyActive) {
    return (
      <Alert tone="success">
        Förenings-konto är aktiverat och bundet till organisationen.
      </Alert>
    );
  }

  function aktivera() {
    if (!confirm("Skapa förenings-konto för kontaktperson? En invite-länk genereras.")) return;
    start(async () => {
      const r = await aktiveraForeningsKontoAction(orgId);
      setRes(r);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
        När föreningen är publicerad: skapa det separata förenings-kontot för
        kontaktpersonen och dela invite-länken (e-post skickas automatiskt om
        SMTP är kopplat).
      </p>
      <Button
        type="button"
        size="sm"
        onClick={aktivera}
        disabled={pending}
        leftIcon={<Icon name="user-plus" size={14} />}
      >
        {pending ? "Skapar…" : "Aktivera förenings-konto"}
      </Button>
      {res && !res.ok && <Alert tone="danger">{res.message}</Alert>}
      {res && res.ok && (
        <Alert tone="success">
          <div className="text-sm">
            <strong>Konto skapat</strong> för {res.email}.
          </div>
          {res.invite_url ? (
            <div className="mt-2">
              <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                Invite-länk (skicka manuellt om e-posten inte når fram):
              </p>
              <textarea
                readOnly
                className="mt-1 w-full rounded border p-2 text-xs"
                value={res.invite_url}
                rows={2}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          ) : (
            <p className="mt-2 text-xs">Ingen invite-länk genererades — be kontaktpersonen logga in via e-post-OTP.</p>
          )}
        </Alert>
      )}
    </div>
  );
}
