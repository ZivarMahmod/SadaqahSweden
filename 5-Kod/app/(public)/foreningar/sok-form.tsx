// Modul M10 — Klient-form: sök + filter i katalogen.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ForeningSokForm({
  typeAlt,
  regionAlt,
}: {
  typeAlt: string[];
  regionAlt: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [typ, setTyp] = useState(params.get("typ") ?? "");
  const [region, setRegion] = useState(params.get("region") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setTyp(params.get("typ") ?? "");
    setRegion(params.get("region") ?? "");
  }, [params]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (typ) sp.set("typ", typ);
    if (region) sp.set("region", region);
    router.push(`/foreningar?${sp.toString()}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
      <Input
        type="search"
        placeholder="Sök på namn, stad eller beskrivning…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Sök föreningar"
      />
      <Select value={typ} onChange={(e) => setTyp(e.target.value)} aria-label="Typ">
        <option value="">Alla typer</option>
        {typeAlt.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </Select>
      <Select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
        <option value="">Alla regioner</option>
        {regionAlt.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </Select>
      <Button type="submit">Filtrera</Button>
    </form>
  );
}
