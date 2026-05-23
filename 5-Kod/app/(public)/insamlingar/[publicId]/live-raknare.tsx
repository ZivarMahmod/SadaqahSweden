// Modul M4/M5 — realtidsräknare på publik insamlingssida.
// Plan: Fil 03 §4 — Stripe-webhook → DB → trigger → broadcast → klient.
// Kanaltopic: 'campaign:<insamling_id>'. Webhooken sänder; servern är sanningen.
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { kr, kortBelopp, procentAvMal } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

type MalModell = "fast" | "intervall" | "oppet";

interface Props {
  insamlingId: string;
  initialInsamlatOre: number;
  malbeloppModell: MalModell;
  malbeloppOre: number | null;
  malbeloppMinOre: number | null;
  malbeloppMaxOre: number | null;
  dagarKvar: number | null;
}

interface BeloppPayload {
  insamlat_ore: number;
}

export function LiveRaknare(props: Props) {
  const [insamlat, setInsamlat] = useState<number>(props.initialInsamlatOre);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createBrowserClient(url, key);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const channelName = `campaign:${props.insamlingId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "belopp_updated" }, ({ payload }) => {
      const p = payload as BeloppPayload | null;
      if (!p) return;
      if (typeof p.insamlat_ore === "number" && p.insamlat_ore >= 0) {
        setInsamlat(p.insamlat_ore);
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, props.insamlingId]);

  // Vid återanslutning: hämta beloppet på nytt (robusthet, Fil 03 §4.2).
  useEffect(() => {
    if (!supabase) return;
    let stopped = false;
    const tick = async () => {
      const { data } = await supabase
        .from("insamling")
        .select("insamlat_ore")
        .eq("id", props.insamlingId)
        .maybeSingle();
      if (!stopped && data && typeof data.insamlat_ore === "number") {
        setInsamlat(data.insamlat_ore);
      }
    };
    const onFocus = () => void tick();
    window.addEventListener("focus", onFocus);
    return () => {
      stopped = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [supabase, props.insamlingId]);

  const malbelopp =
    props.malbeloppModell === "fast"
      ? props.malbeloppOre
      : props.malbeloppModell === "intervall"
      ? props.malbeloppMaxOre
      : null;

  const procent = procentAvMal(
    insamlat,
    props.malbeloppModell,
    props.malbeloppOre,
    props.malbeloppMaxOre,
  );

  return (
    <>
      <div className="flex items-baseline justify-between">
        <span
          className="tabular"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 44,
            color: "var(--color-forest)",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {kr(insamlat)}
        </span>
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--color-ink-3)" }}>
        {malbelopp ? (
          <>
            av <span className="tabular">{kortBelopp(malbelopp)}</span>
            {props.malbeloppModell === "intervall" && props.malbeloppMinOre && (
              <> (min {kortBelopp(props.malbeloppMinOre)})</>
            )}
          </>
        ) : (
          "öppen insamling — inget specifikt mål"
        )}
      </p>

      {procent != null && (
        <div className="mt-4">
          <Progress value={procent} ariaLabel={`${procent} % av målet`} />
          <div
            className="mt-2 flex justify-between text-xs"
            style={{ color: "var(--color-ink-3)" }}
          >
            <span>{procent} % av målet</span>
            {props.dagarKvar != null && <span>{props.dagarKvar} dgr kvar</span>}
          </div>
        </div>
      )}
    </>
  );
}
