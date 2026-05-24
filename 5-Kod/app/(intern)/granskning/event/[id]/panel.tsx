"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { granskareEventBeslut } from "@/app/(konto)/event/actions";

export function EventBeslutPanel({ granskningId }: { granskningId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [motiv, setMotiv] = useState("");
  const [fel, setFel] = useState<string | null>(null);

  function beslut(b: "godkann" | "begar_andring" | "avvisa") {
    setFel(null);
    if (b !== "godkann" && motiv.trim().length < 10) {
      setFel("Motivering krävs (minst 10 tecken) för ändring/avvisa");
      return;
    }
    start(async () => {
      const res = await granskareEventBeslut(granskningId, b, motiv.trim());
      if (!res.ok) {
        setFel(res.fel);
        return;
      }
      router.push("/granskning/event");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={motiv}
        onChange={(e) => setMotiv(e.target.value.slice(0, 1000))}
        placeholder="Motivering (obligatorisk vid ändring/avvisa)"
        rows={3}
        className="textarea"
        disabled={pending}
      />
      {fel && <p className="field-error">{fel}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => beslut("godkann")} disabled={pending} className="btn btn-primary btn-sm">
          Godkänn &amp; publicera
        </button>
        <button type="button" onClick={() => beslut("begar_andring")} disabled={pending} className="btn btn-secondary btn-sm">
          Begär ändring
        </button>
        <button type="button" onClick={() => beslut("avvisa")} disabled={pending} className="btn btn-danger btn-sm">
          Avvisa
        </button>
      </div>
    </div>
  );
}
