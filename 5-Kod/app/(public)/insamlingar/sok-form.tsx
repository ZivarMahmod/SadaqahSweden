// Modul M11 — Klient-form för sök + sortering. Bevarar kategori/hjälp-land
// från URL och postar tillbaka via GET så servern gör all filtrering.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const SORTERINGAR = [
  { value: "nyast", label: "Nyaste först" },
  { value: "snart_i_mal", label: "Snart i mål" },
  { value: "populart", label: "Populärast" },
  { value: "alfabetiskt", label: "A–Ö" },
] as const;

const STATUSAR = [
  { value: "aktiv", label: "Bara aktiva (default)" },
  { value: "alla_publika", label: "Inkl. avslutade & väntar" },
  { value: "avslutad_levererad", label: "Bara levererade" },
] as const;

type Props = {
  hjalpLander: string[];
};

export function SokForm({ hjalpLander }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "nyast");
  const [hjalpLand, setHjalpLand] = useState(params.get("hjalp_land") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "aktiv");

  // Spegla URL → input om man backat hit
  useEffect(() => {
    setQ(params.get("q") ?? "");
    setSort(params.get("sort") ?? "nyast");
    setHjalpLand(params.get("hjalp_land") ?? "");
    setStatus(params.get("status") ?? "aktiv");
  }, [params]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams(params.toString());
    if (q.trim()) sp.set("q", q.trim()); else sp.delete("q");
    if (sort && sort !== "nyast") sp.set("sort", sort); else sp.delete("sort");
    if (hjalpLand) sp.set("hjalp_land", hjalpLand); else sp.delete("hjalp_land");
    if (status && status !== "aktiv") sp.set("status", status); else sp.delete("status");
    router.push(`/insamlingar?${sp.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <Input
          type="search"
          placeholder="Sök på titel, plats eller mottagare…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Sök insamlingar"
        />
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sortering">
          {SORTERINGAR.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Select value={hjalpLand} onChange={(e) => setHjalpLand(e.target.value)} aria-label="Hjälp-land">
          <option value="">Hjälper i — alla länder</option>
          {hjalpLander.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          {STATUSAR.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Button type="submit" size="md">Sök</Button>
      </div>
    </form>
  );
}
