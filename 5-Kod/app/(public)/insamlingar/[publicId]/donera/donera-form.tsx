// Modul M4 — Donator-flödet (klientkomponent).
// Stripe Payment Element inbäddat (Fil 03 §3.3 beslut 6).
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { kr } from "@/lib/format";
import { skapaPaymentIntent, type DoneraSvar } from "./actions";

const PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise: Promise<Stripe | null> | null = PUBLISHABLE
  ? loadStripe(PUBLISHABLE)
  : null;

const SNABBVAL_KR = [100, 300, 500, 1000];

interface Props {
  insamlingId: string;
  insamlingPublicId: string;
  enhetNamn: string | null;
  enhetPrisOre: number | null;
}

export function DoneraForm({ insamlingId, insamlingPublicId, enhetNamn, enhetPrisOre }: Props) {
  const [beloppKr, setBeloppKr] = useState<number>(300);
  const [friBelopp, setFriBelopp] = useState<string>("");
  const [tipAktivt, setTipAktivt] = useState<boolean>(true);
  const [tipProcent, setTipProcent] = useState<number>(10);
  const [epost, setEpost] = useState<string>("");
  const [anonym, setAnonym] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationPublicId, setDonationPublicId] = useState<string | null>(null);

  const beloppOre = useMemo(() => {
    const v = friBelopp ? Number(friBelopp.replace(/\s/g, "")) : beloppKr;
    return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
  }, [beloppKr, friBelopp]);

  const tipOre = useMemo(() => {
    if (!tipAktivt || beloppOre === 0) return 0;
    return Math.round((beloppOre * tipProcent) / 100);
  }, [tipAktivt, tipProcent, beloppOre]);

  const total = beloppOre + tipOre;

  const enhetAntal = useMemo(() => {
    if (!enhetPrisOre || enhetPrisOre <= 0) return undefined;
    if (beloppOre % enhetPrisOre !== 0) return undefined;
    return beloppOre / enhetPrisOre;
  }, [beloppOre, enhetPrisOre]);

  async function startaBetalning(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (beloppOre < 1000) {
      setError("Minsta donation är 10 kr.");
      return;
    }
    if (!epost.trim()) {
      setError("E-post krävs så vi kan skicka kvitto.");
      return;
    }

    setSubmitting(true);
    const result: DoneraSvar = await skapaPaymentIntent({
      insamling_id: insamlingId,
      belopp_ore: beloppOre,
      frivilligt_bidrag_ore: tipOre,
      enhet_antal: enhetAntal,
      donator_epost: epost.trim(),
      anonym,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setClientSecret(result.client_secret);
    setDonationPublicId(result.donation_public_id);
  }

  if (clientSecret && stripePromise && donationPublicId) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#0d4a3a",
              fontFamily: "system-ui, sans-serif",
              borderRadius: "8px",
            },
          },
        }}
      >
        <BetalSteg
          insamlingPublicId={insamlingPublicId}
          donationPublicId={donationPublicId}
          beloppOre={beloppOre}
          tipOre={tipOre}
        />
      </Elements>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={startaBetalning}>
      <div>
        <span className="eyebrow">VÄLJ BELOPP</span>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {SNABBVAL_KR.map((v) => (
            <button
              key={v}
              type="button"
              className={
                "btn " +
                (beloppKr === v && !friBelopp ? "btn-primary" : "btn-secondary")
              }
              onClick={() => {
                setBeloppKr(v);
                setFriBelopp("");
              }}
            >
              {v} kr
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs" style={{ color: "var(--color-ink-3)" }}>
            Eller annat belopp (kr)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            step={1}
            placeholder="Annat belopp"
            value={friBelopp}
            onChange={(e) => setFriBelopp(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            style={{ borderColor: "var(--color-ink-line)" }}
          />
        </div>
        {enhetNamn && enhetPrisOre && enhetAntal && (
          <p className="mt-2 text-xs" style={{ color: "var(--color-ink-3)" }}>
            ≈ {enhetAntal} {enhetNamn}
            {enhetAntal === 1 ? "" : "or"} ({kr(enhetPrisOre)} st)
          </p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={tipAktivt}
            onChange={(e) => setTipAktivt(e.target.checked)}
          />
          Lägg till frivilligt bidrag till plattformen ({tipProcent}%)
        </label>
        {tipAktivt && (
          <div className="mt-2 flex gap-2">
            {[5, 10, 15].map((p) => (
              <button
                type="button"
                key={p}
                className={"btn " + (tipProcent === p ? "btn-primary" : "btn-secondary")}
                onClick={() => setTipProcent(p)}
              >
                {p}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs" style={{ color: "var(--color-ink-3)" }}>
          E-post (för kvitto)
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="din@email.se"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
          style={{ borderColor: "var(--color-ink-line)" }}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={anonym}
          onChange={(e) => setAnonym(e.target.checked)}
        />
        Visa mig som anonym donator
      </label>

      <div
        className="rounded-md p-4 text-sm"
        style={{ background: "var(--color-cream)", color: "var(--color-ink-2)" }}
      >
        <div className="flex justify-between">
          <span>Gåva</span>
          <span className="tabular">{kr(beloppOre)}</span>
        </div>
        {tipOre > 0 && (
          <div className="flex justify-between">
            <span>Frivilligt bidrag</span>
            <span className="tabular">{kr(tipOre)}</span>
          </div>
        )}
        <div
          className="mt-2 flex justify-between border-t pt-2 font-semibold"
          style={{ color: "var(--color-ink)", borderColor: "var(--color-ink-line)" }}
        >
          <span>Att betala</span>
          <span className="tabular">{kr(total)}</span>
        </div>
      </div>

      {error && (
        <div
          className="rounded-md p-3 text-sm"
          style={{ background: "#fee", color: "#900" }}
        >
          {error}
        </div>
      )}

      {!stripePromise && (
        <div
          className="rounded-md p-3 text-sm"
          style={{ background: "#fef9e6", color: "#7a5a00" }}
        >
          Stripe är inte konfigurerat (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY saknas).
          Knappen aktiveras när Zivar satt test-nycklarna.
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        variant="copper"
        block
        disabled={submitting || !stripePromise}
      >
        {submitting ? (
          "Laddar..."
        ) : (
          <>
            <Icon name="heart" size={18} /> Donera {kr(total)}
          </>
        )}
      </Button>
    </form>
  );
}

function BetalSteg(props: {
  insamlingPublicId: string;
  donationPublicId: string;
  beloppOre: number;
  tipOre: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/insamlingar/${props.insamlingPublicId}/donera/tack?d=${props.donationPublicId}`;
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (stripeError) {
      setError(stripeError.message ?? "Betalningen kunde inte slutföras");
      return;
    }
    router.push(`/insamlingar/${props.insamlingPublicId}/donera/tack?d=${props.donationPublicId}`);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleConfirm}>
      <div>
        <span className="eyebrow">BETALNING</span>
        <h3 className="h-3 mt-2">
          Betala {kr(props.beloppOre + props.tipOre)}
        </h3>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
          Stripe sköter all betaldata. Vi ser aldrig dina kortuppgifter.
        </p>
      </div>

      <PaymentElement />

      {error && (
        <div className="rounded-md p-3 text-sm" style={{ background: "#fee", color: "#900" }}>
          {error}
        </div>
      )}

      <Button type="submit" size="lg" variant="copper" block disabled={submitting || !stripe}>
        {submitting ? "Bekräftar..." : `Bekräfta ${kr(props.beloppOre + props.tipOre)}`}
      </Button>
    </form>
  );
}

