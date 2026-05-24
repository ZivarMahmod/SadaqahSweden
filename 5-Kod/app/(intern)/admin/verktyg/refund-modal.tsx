"use client";

import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import {
  initieraRefundDonationAction,
  initieraRefundInsamlingAction,
  forhandsberaknaRefundAction,
} from "./actions";

type Anledning = Database["public"]["Enums"]["refund_anledning"];

const ANLEDNING_ETIKETT: Record<Anledning, string> = {
  bedrageri: "Bedrägeri",
  fel_donation: "Fel donation (dubbel/teknisk)",
  admin_beslut: "Admin-beslut",
  donator_begaran: "Donator-begäran",
};

function kortBelopp(ore: number): string {
  return `${(ore / 100).toLocaleString("sv-SE")} kr`;
}

export function RefundModal({
  insamlingId,
  insamlingNamn,
  onClose,
}: {
  insamlingId: string;
  insamlingNamn: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"insamling" | "donation">("insamling");
  const [donationId, setDonationId] = useState("");
  const [anledning, setAnledning] = useState<Anledning>("admin_beslut");
  const [motivering, setMotivering] = useState("");
  const [forhand, setForhand] = useState<{ antal: number; summa_ore: number } | null>(null);
  const [bekrafta, setBekrafta] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function laddaForhandsberakning() {
    start(async () => {
      const res = await forhandsberaknaRefundAction(insamlingId);
      if ("fel" in res) {
        setFel(res.fel);
      } else {
        setForhand(res);
        setBekrafta(true);
      }
    });
  }

  function utforRefund() {
    setFel(null);
    setOk(null);
    start(async () => {
      if (tab === "insamling") {
        const res = await initieraRefundInsamlingAction(
          insamlingId,
          anledning,
          motivering.trim(),
        );
        if (!res.ok) setFel(res.fel);
        else setOk(`${res.antal ?? 0} refunds initierade. Stripe bearbetar nu — slutstatus dyker upp i loggen.`);
      } else {
        const res = await initieraRefundDonationAction(
          donationId.trim(),
          anledning,
          motivering.trim(),
        );
        if (!res.ok) setFel(res.fel);
        else setOk("Refund initierad. Stripe bearbetar nu.");
      }
    });
  }

  if (bekrafta && tab === "insamling" && forhand) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="max-w-md rounded p-6" style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}>
          <h2 className="h-3">Bekräfta refund</h2>
          <p className="mt-3 text-sm">
            Detta refunderar <strong>{forhand.antal}</strong> donation{forhand.antal === 1 ? "" : "er"} för{" "}
            <strong>{kortBelopp(forhand.summa_ore)}</strong> på insamlingen <strong>{insamlingNamn}</strong>.
            Anledning: <strong>{ANLEDNING_ETIKETT[anledning]}</strong>.
          </p>
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
            Går inte att ångra.
          </p>
          {ok && <p className="mt-3 text-sm" style={{ color: "var(--color-success)" }}>{ok}</p>}
          {fel && <p className="mt-3 field-error">{fel}</p>}
          <div className="mt-5 flex gap-2 justify-end">
            <button type="button" onClick={() => setBekrafta(false)} className="btn btn-ghost btn-sm" disabled={pending}>
              Tillbaka
            </button>
            <button type="button" onClick={utforRefund} disabled={pending || !!ok} className="btn btn-primary btn-sm" style={{ background: "var(--color-danger)" }}>
              {pending ? "Refunderar …" : ok ? "Klart" : `Refundera ${forhand.antal} st`}
            </button>
            {ok && (
              <button type="button" onClick={onClose} className="btn btn-primary btn-sm">
                Stäng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="max-w-md rounded p-6" style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink-line)" }}>
        <h2 className="h-3">Initiera refund</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
          Insamling: {insamlingNamn}
        </p>

        <div className="mt-4 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setTab("insamling")}
            className={`btn btn-sm ${tab === "insamling" ? "btn-primary" : "btn-ghost"}`}
          >
            Alla på insamlingen
          </button>
          <button
            type="button"
            onClick={() => setTab("donation")}
            className={`btn btn-sm ${tab === "donation" ? "btn-primary" : "btn-ghost"}`}
          >
            En donation
          </button>
        </div>

        {tab === "donation" && (
          <label className="mt-4 block">
            <span className="field-label">Donation-id</span>
            <input
              type="text"
              value={donationId}
              onChange={(e) => setDonationId(e.target.value)}
              placeholder="UUID"
              className="input mt-1"
            />
          </label>
        )}

        <label className="mt-4 block">
          <span className="field-label">Anledning</span>
          <select
            value={anledning}
            onChange={(e) => setAnledning(e.target.value as Anledning)}
            className="select mt-1"
          >
            {(Object.keys(ANLEDNING_ETIKETT) as Anledning[]).map((a) => (
              <option key={a} value={a}>{ANLEDNING_ETIKETT[a]}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="field-label">Motivering (5–2000 tecken)</span>
          <textarea
            value={motivering}
            onChange={(e) => setMotivering(e.target.value)}
            rows={3}
            className="input mt-1"
            maxLength={2000}
            placeholder="Förklara varför — loggas i ingreppsloggen."
          />
        </label>

        {fel && <p className="mt-3 field-error">{fel}</p>}
        {ok && <p className="mt-3 text-sm" style={{ color: "var(--color-success)" }}>{ok}</p>}

        <div className="mt-5 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" disabled={pending}>
            Avbryt
          </button>
          {tab === "insamling" ? (
            <button
              type="button"
              onClick={laddaForhandsberakning}
              disabled={pending || motivering.trim().length < 5}
              className="btn btn-primary btn-sm"
            >
              {pending ? "Räknar …" : "Fortsätt"}
            </button>
          ) : (
            <button
              type="button"
              onClick={utforRefund}
              disabled={pending || motivering.trim().length < 5 || donationId.trim().length === 0 || !!ok}
              className="btn btn-primary btn-sm"
            >
              {pending ? "Refunderar …" : ok ? "Klart" : "Refundera donation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RefundKnapp({ insamlingId, insamlingNamn }: { insamlingId: string; insamlingNamn: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm"
        style={{ color: "var(--color-danger)" }}
      >
        Refund
      </button>
      {open && (
        <RefundModal insamlingId={insamlingId} insamlingNamn={insamlingNamn} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
