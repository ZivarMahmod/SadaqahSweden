"use client";

// Skolan F10 — Koran-skrift-canvas. Öva på att SPÅRA bokstäverna/verserna på
// skärmen med penna eller finger. 56b §3.
//
// - Pointer Events (pointerdown/move/up) + getCoalescedEvents för jämna streck.
// - pressure → linjebredd (iPad/Apple Pencil/Wacom); mus/finger → fast bredd.
// - Två staplade canvas: en MALL (faint ayah-text att spåra) + ett RIT-lager.
//   Suddet raderar bara dina streck, aldrig mallen (destination-out).
// - INGEN serverlagring av streck (dataminimering, särskilt barn). Allt i minnet;
//   valfri nedladdning som PNG sker helt i klienten.
// - Ingen streak/tävling/poäng — detta är inte tillbedjan-gamification.
//
// Texten som visas är demo-ayah (tydlig platshållare) tills #6:s grindade data
// finns; komponenten bryr sig inte om källan, bara om `ayahs`-listan den får.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoAyah } from "@/lib/skola/typer";

type Verktyg = "penna" | "sudd";

type Punkt = { x: number; y: number; p: number };
type Streck = { verktyg: Verktyg; farg: string; storlek: number; punkter: Punkt[] };

const FARGER = ["#0E1411", "#1F4636", "#B8843E", "#8B3A2E"];
const STORLEKAR = [3, 6, 10];

// Arabisk-vänlig serif-stack; faller tillbaka på systemfont om inget finns.
const ARABISK_FONT = '"Scheherazade New", "Amiri", "Noto Naskh Arabic", "Traditional Arabic", Georgia, serif';

export function KoranSkriftCanvas({ ayahs }: { ayahs: DemoAyah[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mallRef = useRef<HTMLCanvasElement>(null);
  const ritRef = useRef<HTMLCanvasElement>(null);

  const strecken = useRef<Streck[]>([]);
  const aktivt = useRef<Streck | null>(null);
  const matt = useRef<{ w: number; h: number; dpr: number }>({ w: 0, h: 0, dpr: 1 });

  const [ayahIndex, setAyahIndex] = useState(0);
  const [verktyg, setVerktyg] = useState<Verktyg>("penna");
  const [farg, setFarg] = useState(FARGER[0]);
  const [storlek, setStorlek] = useState(STORLEKAR[1]);
  const [kanAngra, setKanAngra] = useState(false);
  const [visaMall, setVisaMall] = useState(true);

  const ayah = ayahs[ayahIndex];

  // ---- Rita mall-texten (faint, RTL, inpassad i bredden) ----
  const ritaMall = useCallback(() => {
    const c = mallRef.current;
    const { w, h, dpr } = matt.current;
    if (!c || w === 0) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!visaMall || !ayah) return;

    ctx.fillStyle = "rgba(14, 20, 17, 0.13)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    // Krymp tills texten ryms på ~88 % av bredden.
    let fontSize = Math.min(h * 0.46, w * 0.22);
    ctx.font = `${fontSize}px ${ARABISK_FONT}`;
    let bredd = ctx.measureText(ayah.arabisk).width;
    const maxBredd = w * 0.88;
    let varv = 0;
    while (bredd > maxBredd && fontSize > 16 && varv < 40) {
      fontSize *= 0.92;
      ctx.font = `${fontSize}px ${ARABISK_FONT}`;
      bredd = ctx.measureText(ayah.arabisk).width;
      varv++;
    }
    ctx.fillText(ayah.arabisk, w / 2, h / 2);
  }, [ayah, visaMall]);

  // ---- Rita ett enskilt streck ----
  const ritaStreck = useCallback((ctx: CanvasRenderingContext2D, s: Streck) => {
    if (s.punkter.length === 0) return;
    ctx.globalCompositeOperation = s.verktyg === "sudd" ? "destination-out" : "source-over";
    ctx.strokeStyle = s.farg;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (s.punkter.length === 1) {
      const p = s.punkter[0];
      ctx.beginPath();
      ctx.fillStyle = s.farg;
      const r = (s.storlek * (0.5 + p.p)) / 2;
      ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    // Mjuk kurva via mittpunkter; bredd följer trycket per segment.
    for (let i = 1; i < s.punkter.length; i++) {
      const a = s.punkter[i - 1];
      const b = s.punkter[i];
      ctx.beginPath();
      ctx.lineWidth = s.storlek * (0.5 + (a.p + b.p) / 2);
      ctx.moveTo(a.x, a.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.quadraticCurveTo(a.x, a.y, mx, my);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }, []);

  // ---- Full omritning av rit-lagret ----
  const ritaAllt = useCallback(() => {
    const c = ritRef.current;
    const { w, h, dpr } = matt.current;
    if (!c || w === 0) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of strecken.current) ritaStreck(ctx, s);
    if (aktivt.current) ritaStreck(ctx, aktivt.current);
  }, [ritaStreck]);

  // ---- Storleks-hantering (DPR-skarp) ----
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const matta = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      matt.current = { w, h, dpr };
      for (const c of [mallRef.current, ritRef.current]) {
        if (!c) continue;
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
      ritaMall();
      ritaAllt();
    };
    matta();
    const ro = new ResizeObserver(matta);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [ritaMall, ritaAllt]);

  // Rita om mallen när ayah/synlighet ändras.
  useEffect(() => {
    ritaMall();
  }, [ritaMall]);

  // ---- Pekhändelser ----
  function punktAv(e: React.PointerEvent<HTMLCanvasElement>): Punkt {
    const rect = ritRef.current!.getBoundingClientRect();
    const tryck = e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : e.pointerType === "mouse" ? 0.5 : 0.5;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, p: tryck };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    ritRef.current?.setPointerCapture(e.pointerId);
    aktivt.current = { verktyg, farg, storlek, punkter: [punktAv(e)] };
    ritaAllt();
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const streck = aktivt.current;
    if (!streck) return;
    e.preventDefault();
    const nativa = e.nativeEvent;
    const coalesced =
      typeof nativa.getCoalescedEvents === "function" ? nativa.getCoalescedEvents() : [];
    if (coalesced.length > 0) {
      const rect = ritRef.current!.getBoundingClientRect();
      for (const ce of coalesced) {
        const tryck = ce.pressure > 0 && ce.pressure !== 0.5 ? ce.pressure : 0.5;
        streck.punkter.push({ x: ce.clientX - rect.left, y: ce.clientY - rect.top, p: tryck });
      }
    } else {
      streck.punkter.push(punktAv(e));
    }
    ritaAllt();
  }

  function onUp() {
    const streck = aktivt.current;
    if (!streck) return;
    if (streck.punkter.length > 0) {
      strecken.current.push(streck);
      setKanAngra(true);
    }
    aktivt.current = null;
    ritaAllt();
  }

  // ---- Kontroller ----
  function angra() {
    strecken.current.pop();
    setKanAngra(strecken.current.length > 0);
    ritaAllt();
  }
  function rensa() {
    strecken.current = [];
    aktivt.current = null;
    setKanAngra(false);
    ritaAllt();
  }
  function laddaNer() {
    const { w, h, dpr } = matt.current;
    const ut = document.createElement("canvas");
    ut.width = Math.floor(w * dpr);
    ut.height = Math.floor(h * dpr);
    const ctx = ut.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#F5F0E4";
    ctx.fillRect(0, 0, ut.width, ut.height);
    if (mallRef.current) ctx.drawImage(mallRef.current, 0, 0);
    if (ritRef.current) ctx.drawImage(ritRef.current, 0, 0);
    const a = document.createElement("a");
    a.download = `koran-skrift-${ayah?.surah ?? "ovning"}.png`;
    a.href = ut.toDataURL("image/png");
    a.click();
  }

  const knappBas =
    "inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 font-medium transition-colors";
  const knappStil: React.CSSProperties = { minHeight: 48, fontSize: 15, border: "1px solid var(--color-paper-line)" };

  return (
    <div className="flex flex-col gap-4">
      {/* Ayah-väljare */}
      <div className="flex flex-wrap items-center gap-2">
        <span style={{ color: "var(--color-ink-3)", fontSize: 14, marginRight: 4 }}>Vers:</span>
        {ayahs.map((a, i) => (
          <button
            key={a.ref}
            type="button"
            onClick={() => setAyahIndex(i)}
            aria-pressed={i === ayahIndex}
            className={knappBas}
            style={{
              ...knappStil,
              background: i === ayahIndex ? "var(--color-forest)" : "var(--color-paper-soft)",
              color: i === ayahIndex ? "var(--color-paper-soft)" : "var(--color-ink-2)",
            }}
          >
            {a.surah} {a.ref}
          </button>
        ))}
      </div>

      {/* Vald ayah — translitteration + översättning (kontext, ej tillbedjan) */}
      {ayah && (
        <div className="flex flex-col gap-1" style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          <span style={{ fontStyle: "italic" }}>{ayah.translitteration}</span>
          <span>«{ayah.oversattning}»</span>
        </div>
      )}

      {/* Rityta */}
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-[var(--radius-lg)]"
        style={{
          height: "min(60vh, 520px)",
          background: "var(--color-paper-soft)",
          border: "1px solid var(--color-paper-line)",
          boxShadow: "var(--shadow-1)",
        }}
      >
        <canvas ref={mallRef} className="pointer-events-none absolute inset-0" />
        <canvas
          ref={ritRef}
          className="absolute inset-0"
          style={{ touchAction: "none", cursor: verktyg === "sudd" ? "cell" : "crosshair" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
      </div>

      {/* Verktygsrad */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVerktyg("penna")}
          aria-pressed={verktyg === "penna"}
          className={knappBas}
          style={{ ...knappStil, background: verktyg === "penna" ? "var(--color-forest-soft)" : "transparent" }}
        >
          Penna
        </button>
        <button
          type="button"
          onClick={() => setVerktyg("sudd")}
          aria-pressed={verktyg === "sudd"}
          className={knappBas}
          style={{ ...knappStil, background: verktyg === "sudd" ? "var(--color-forest-soft)" : "transparent" }}
        >
          Sudd
        </button>

        {/* Färger */}
        <div className="ml-1 flex items-center gap-1" role="group" aria-label="Färg">
          {FARGER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFarg(f);
                setVerktyg("penna");
              }}
              aria-label={`Färg ${f}`}
              aria-pressed={farg === f && verktyg === "penna"}
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: f,
                border: farg === f ? "3px solid var(--color-copper)" : "2px solid var(--color-paper-line)",
              }}
            />
          ))}
        </div>

        {/* Storlek */}
        <div className="ml-1 flex items-center gap-1" role="group" aria-label="Pennstorlek">
          {STORLEKAR.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStorlek(s)}
              aria-pressed={storlek === s}
              className={knappBas}
              style={{
                ...knappStil,
                width: 48,
                background: storlek === s ? "var(--color-forest-soft)" : "transparent",
              }}
            >
              <span style={{ display: "inline-block", width: s * 2, height: s * 2, borderRadius: 999, background: "var(--color-ink)" }} />
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => setVisaMall((v) => !v)} className={knappBas} style={knappStil}>
            {visaMall ? "Dölj mall" : "Visa mall"}
          </button>
          <button type="button" onClick={angra} disabled={!kanAngra} className={knappBas} style={{ ...knappStil, opacity: kanAngra ? 1 : 0.5 }}>
            Ångra
          </button>
          <button type="button" onClick={rensa} className={knappBas} style={knappStil}>
            Rensa
          </button>
          <button type="button" onClick={laddaNer} className={knappBas} style={{ ...knappStil, background: "var(--color-forest)", color: "var(--color-paper-soft)", border: "none" }}>
            Spara bild
          </button>
        </div>
      </div>
    </div>
  );
}
