"use client";

// Karta-klient (M12 Block 9.1) — MapLibre GL JS över Sveriges 21 län +
// 290 kommuner. Basemap: OpenFreeMap positron (gratis, ingen API-nyckel;
// brief 09-Goal-Steg-12-16 Steg 12-beslut). Choropleth-färgen joinas
// klient-sidan från aggregat-payloaden — noll extra anrop per klick.
// Drill-down via side-panel; M12 Block 1.3 / Block 6.

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KartData, LanAggregat, KommunAggregat } from "@/lib/karta";
import type { HjalpPlats } from "@/lib/karta-hjalp";
import type { EventPin } from "@/lib/karta-events";
import { kortBelopp, antal, kr } from "@/lib/format";

// Konfigurerbar basemap-källa så Steg 12 enkelt kan bytas till Protomaps
// PMTiles på R2 senare (brief "Batchade uppföljningar"-punkt 1).
const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

type Vy = "lan" | "kommun" | "hjalp";

type ValdOmrade =
  | { typ: "lan"; kod: string; namn: string }
  | { typ: "kommun"; kod: string; namn: string; lan_kod: string }
  | { typ: "hjalp"; land: string }
  | null;

export function KartaKlient({
  data,
  hjalp,
  events,
}: {
  data: KartData;
  hjalp: HjalpPlats[];
  events: EventPin[];
}) {
  const [visaEvents, setVisaEvents] = useState(false);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const [klar, setKlar] = useState(false);
  const [vy, setVy] = useState<Vy>("lan");
  const [valt, setValt] = useState<ValdOmrade>(null);

  // Indexera aggregat per kod för O(1)-lookup när vi joinar med GeoJSON.
  const lanByKod = useMemo(() => new Map(data.lan.map((l) => [l.kod, l])), [data.lan]);
  const kommunByKod = useMemo(
    () => new Map(data.kommuner.map((k) => [k.kod, k])),
    [data.kommuner],
  );

  // Max-värdet styr färgskalan (Block 1.1: en enda varm skala, mer/mindre).
  const maxLanAktiva = useMemo(
    () => Math.max(1, ...data.lan.map((l) => l.aktiva_antal)),
    [data.lan],
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    let avbruten = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      if (avbruten || !mapContainer.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: BASEMAP_STYLE_URL,
        center: [15.5, 62.5],
        zoom: 3.7,
        minZoom: 3,
        maxZoom: 10,
        attributionControl: { compact: true },
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      map.on("load", async () => {
        // Ladda GeoJSON-filerna — statiska assets serverade av Cloudflare.
        const [lanResp, komResp] = await Promise.all([
          fetch("/geo/sverige-lan.geojson"),
          fetch("/geo/sverige-kommuner.geojson"),
        ]);
        const [lanGeo, komGeo] = await Promise.all([lanResp.json(), komResp.json()]);

        // Joina aggregat-värden in i GeoJSON-properties så MapLibre kan
        // använda dem direkt i `fill-color` data-driven expression.
        for (const f of lanGeo.features) {
          const a = lanByKod.get(f.properties.kod);
          f.properties.aktiva = a?.aktiva_antal ?? 0;
          f.properties.summa_ore = a?.insamlat_summa_ore ?? 0;
          f.properties.levererade = a?.avslutade_levererade ?? 0;
          f.properties.under_troskel = false; // län har ingen tröskel
        }
        for (const f of komGeo.features) {
          const a = kommunByKod.get(f.properties.kod);
          f.properties.aktiva = a?.aktiva_antal ?? 0;
          f.properties.summa_ore = a?.insamlat_summa_ore ?? 0;
          f.properties.levererade = a?.avslutade_levererade ?? 0;
          f.properties.under_troskel = a?.under_troskel ?? false;
        }

        map.addSource("lan", { type: "geojson", data: lanGeo, generateId: true });
        map.addSource("kommun", { type: "geojson", data: komGeo, generateId: true });

        // Lugn enfärgsskala (Block 1.1) — palett från designsystemet
        // (paper-deep → copper → forest-deep). Linjär interpolering.
        const lanFillColor: maplibregl.ExpressionSpecification = [
          "interpolate",
          ["linear"],
          ["get", "aktiva"],
          0, "#ECE5D2",
          Math.max(1, Math.ceil(maxLanAktiva * 0.25)), "#D4A567",
          Math.max(2, Math.ceil(maxLanAktiva * 0.5)), "#B8843E",
          Math.max(3, maxLanAktiva), "#8E6429",
        ];

        // Lägg LÄN-skiktet först — synligt i vy="lan".
        map.addLayer({
          id: "lan-fill",
          type: "fill",
          source: "lan",
          paint: {
            "fill-color": lanFillColor,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.85,
              0.7,
            ],
          },
        });
        map.addLayer({
          id: "lan-line",
          type: "line",
          source: "lan",
          paint: {
            "line-color": "#1F4636",
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2.5,
              0.6,
            ],
          },
        });

        // HJÄLP-vyns markörer (M12 Block 4). En GeoJSON med punkt per land
        // där minst en aktiv insamling levererar hjälp. Cirkelradien skalas
        // efter antal insamlingar (Block 4.1: större markör = mer aktivitet).
        const hjalpFC = {
          type: "FeatureCollection" as const,
          features: hjalp
            .filter((h) => h.lat != null && h.lng != null)
            .map((h) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [h.lng!, h.lat!] },
              properties: {
                land: h.land,
                antal: h.antal,
                summa_ore: h.insamlat_ore,
              },
            })),
        };
        map.addSource("hjalp", { type: "geojson", data: hjalpFC, generateId: true });

        // EVENT-pin-lager (M14 ⇄ M12) — av-/påslagbart eget lager.
        const eventFC = {
          type: "FeatureCollection" as const,
          features: events.map((e) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [e.lng, e.lat] },
            properties: {
              id: e.id,
              public_id: e.public_id,
              slug: e.slug,
              titel: e.titel,
              typ: e.typ,
              start_at: e.start_at,
            },
          })),
        };
        map.addSource("events", { type: "geojson", data: eventFC, generateId: true });
        map.addLayer({
          id: "events-circle",
          type: "circle",
          source: "events",
          paint: {
            "circle-radius": 7,
            "circle-color": "#2D6B4F",
            "circle-opacity": 0.85,
            "circle-stroke-color": "#0F2A1F",
            "circle-stroke-width": 1.5,
          },
          layout: { visibility: "none" },
        });
        map.on("click", "events-circle", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const pid = f.properties?.public_id as string;
          const slug = f.properties?.slug as string;
          if (pid && typeof window !== "undefined") {
            window.location.href = `/event/${pid}-${slug ?? ""}`;
          }
        });
        map.on("mouseenter", "events-circle", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "events-circle", () => (map.getCanvas().style.cursor = ""));
        map.addLayer({
          id: "hjalp-circle",
          type: "circle",
          source: "hjalp",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "antal"],
              1, 8,
              5, 14,
              20, 22,
              100, 32,
            ],
            "circle-color": "#B8843E",
            "circle-opacity": 0.7,
            "circle-stroke-color": "#0F2A1F",
            "circle-stroke-width": 1.5,
          },
          layout: { visibility: "none" },
        });

        // KOMMUN-skiktet — initialt dolt, syns när användaren zoomar in
        // eller väljer vy="kommun".
        map.addLayer({
          id: "kommun-fill",
          type: "fill",
          source: "kommun",
          paint: {
            "fill-color": [
              "case",
              ["get", "under_troskel"],
              "#F5F0E4",
              [
                "interpolate",
                ["linear"],
                ["get", "aktiva"],
                0, "#F5F0E4",
                3, "#D4A567",
                10, "#B8843E",
                20, "#8E6429",
              ],
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.85,
              0.55,
            ],
          },
          layout: { visibility: "none" },
        });
        map.addLayer({
          id: "kommun-line",
          type: "line",
          source: "kommun",
          paint: { "line-color": "rgba(31,70,54,0.4)", "line-width": 0.35 },
          layout: { visibility: "none" },
        });

        // Hover-effekt (cursor + fill-opacity via feature-state).
        let hoveredLan: number | null = null;
        let hoveredKom: number | null = null;
        function settHover(skikt: "lan" | "kommun", id: number | null) {
          if (skikt === "lan") {
            if (hoveredLan !== null) {
              map.setFeatureState({ source: "lan", id: hoveredLan }, { hover: false });
            }
            hoveredLan = id;
            if (id !== null) {
              map.setFeatureState({ source: "lan", id }, { hover: true });
            }
          } else {
            if (hoveredKom !== null) {
              map.setFeatureState({ source: "kommun", id: hoveredKom }, { hover: false });
            }
            hoveredKom = id;
            if (id !== null) {
              map.setFeatureState({ source: "kommun", id }, { hover: true });
            }
          }
        }

        map.on("mousemove", "lan-fill", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const f = e.features?.[0];
          if (f?.id != null) settHover("lan", Number(f.id));
        });
        map.on("mouseleave", "lan-fill", () => {
          map.getCanvas().style.cursor = "";
          settHover("lan", null);
        });
        map.on("mousemove", "kommun-fill", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const f = e.features?.[0];
          if (f?.id != null) settHover("kommun", Number(f.id));
        });
        map.on("mouseleave", "kommun-fill", () => {
          map.getCanvas().style.cursor = "";
          settHover("kommun", null);
        });

        // Klick på län → öppna panel + zooma in.
        map.on("click", "lan-fill", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const kod = f.properties?.kod as string;
          const namn = (f.properties?.namn as string) ?? (f.properties?.kort_namn as string) ?? kod;
          setValt({ typ: "lan", kod, namn });
        });
        map.on("click", "kommun-fill", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const kod = f.properties?.kod as string;
          const namn = (f.properties?.namn as string) ?? kod;
          const lan_kod = (f.properties?.lan_kod as string) ?? "";
          setValt({ typ: "kommun", kod, namn, lan_kod });
        });
        map.on("click", "hjalp-circle", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const land = (f.properties?.land as string) ?? "";
          if (land) setValt({ typ: "hjalp", land });
        });
        for (const lager of ["hjalp-circle"]) {
          map.on("mouseenter", lager, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", lager, () => (map.getCanvas().style.cursor = ""));
        }

        // Auto-byt till kommun-vy vid djup zoom (Block 6.1: drill-down sker
        // även genom panorering/zoom, inte bara genom klick).
        map.on("zoomend", () => {
          if (map.getZoom() >= 6) setVy("kommun");
          else setVy("lan");
        });

        setKlar(true);
      });
    })();

    return () => {
      avbruten = true;
      const m = mapRef.current as { remove?: () => void } | null;
      if (m?.remove) m.remove();
      mapRef.current = null;
    };
  }, [lanByKod, kommunByKod, maxLanAktiva]);

  // Växla lager-synlighet + flyto när vy ändras. Hjälp-vyn zoomar ut till
  // världen (Block 4.1: "växlar man till Hjälp-vyn zoomar kartan ut till
  // hela världen"); Sverige-vyer centreras på landet.
  useEffect(() => {
    const map = mapRef.current as
      | {
          getLayer?: (id: string) => unknown;
          setLayoutProperty?: (id: string, k: string, v: string) => void;
          flyTo?: (opts: { center: [number, number]; zoom: number; duration?: number }) => void;
        }
      | null;
    if (!map?.getLayer || !map.getLayer("kommun-fill")) return;
    const visa = (id: string, on: boolean) =>
      map.setLayoutProperty!(id, "visibility", on ? "visible" : "none");
    visa("kommun-fill", vy === "kommun");
    visa("kommun-line", vy === "kommun");
    visa("lan-fill", vy === "lan");
    visa("lan-line", vy === "lan");
    visa("hjalp-circle", vy === "hjalp");
    visa("events-circle", visaEvents);
    if (vy === "hjalp" && map.flyTo) {
      map.flyTo({ center: [20, 30], zoom: 1.6, duration: 700 });
    } else if (vy === "lan" && map.flyTo) {
      map.flyTo({ center: [15.5, 62.5], zoom: 3.7, duration: 700 });
    }
  }, [vy, klar, visaEvents]);

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: "var(--color-ink-line)",
          background: "var(--color-paper-soft)",
          height: 560,
        }}
      >
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Vy-växlare — insamlar-vy (län/kommun) ⇄ hjälp-vy (världen). */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-md">
          {(
            [
              ["lan", "Län"],
              ["kommun", "Kommun"],
              ["hjalp", "Hjälp-vy"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVy(id)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: vy === id ? "var(--color-forest)" : "transparent",
                color: vy === id ? "var(--color-paper-soft)" : "var(--color-ink-2)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVisaEvents((v) => !v)}
          className="rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-colors"
          style={{
            background: visaEvents ? "var(--color-success)" : "white",
            color: visaEvents ? "var(--color-paper-soft)" : "var(--color-ink-2)",
          }}
          aria-pressed={visaEvents}
        >
          {visaEvents ? "Events ✓" : "Visa events"}
        </button>
      </div>

      {/* Drill-down-panel */}
      {valt && (
        <OmradePanel
          val={valt}
          lanByKod={lanByKod}
          kommunByKod={kommunByKod}
          hjalpByLand={new Map(hjalp.map((h) => [h.land, h]))}
          onStang={() => setValt(null)}
          troskel={data.troskel}
        />
      )}
    </div>
  );
}

function OmradePanel({
  val,
  lanByKod,
  kommunByKod,
  hjalpByLand,
  onStang,
  troskel,
}: {
  val: NonNullable<ValdOmrade>;
  lanByKod: Map<string, LanAggregat>;
  kommunByKod: Map<string, KommunAggregat>;
  hjalpByLand: Map<string, HjalpPlats>;
  onStang: () => void;
  troskel: number;
}) {
  const data =
    val.typ === "lan"
      ? lanByKod.get(val.kod)
      : val.typ === "kommun"
        ? kommunByKod.get(val.kod)
        : undefined;
  const hjalp = val.typ === "hjalp" ? hjalpByLand.get(val.land) : undefined;

  const underTroskel = val.typ === "kommun" && (data as KommunAggregat | undefined)?.under_troskel === true;

  const titel = val.typ === "hjalp" ? val.land : (val as { namn: string }).namn;
  const eyebrow = val.typ === "lan" ? "Län" : val.typ === "kommun" ? "Kommun" : "Hjälp-plats";

  return (
    <div
      className="absolute right-4 top-4 max-h-[calc(100%-32px)] w-[320px] overflow-y-auto rounded-2xl border bg-white p-5 shadow-lg"
      style={{ borderColor: "var(--color-ink-line)" }}
      role="dialog"
      aria-label={`Information om ${titel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3 className="h-3 mt-1">{titel}</h3>
        </div>
        <button
          type="button"
          onClick={onStang}
          aria-label="Stäng"
          className="text-xl"
          style={{ color: "var(--color-ink-3)", lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {val.typ === "hjalp" ? (
        hjalp ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                Insamlingar hit
              </dt>
              <dd className="text-lg font-semibold">{antal(hjalp.antal)}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>
                Insamlat
              </dt>
              <dd className="text-lg font-semibold" title={kr(hjalp.insamlat_ore)}>
                {kortBelopp(hjalp.insamlat_ore)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm" style={{ color: "var(--color-ink-2)" }}>
            Inga insamlingar hit ännu.
          </p>
        )
      ) : underTroskel ? (
        <p
          className="mt-4 rounded-md p-3 text-sm"
          style={{
            background: "var(--color-paper-deep)",
            color: "var(--color-ink-2)",
          }}
        >
          För få insamlingar för att visa statistik här ännu. Kommunen
          behöver minst {troskel} insamlingar innan siffror visas
          (k-anonymitet).
        </p>
      ) : data && data.insamlingar_antal > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>
              Aktiva
            </dt>
            <dd className="text-lg font-semibold">{antal(data.aktiva_antal)}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>
              Levererade
            </dt>
            <dd className="text-lg font-semibold">{antal(data.avslutade_levererade)}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>
              Verifierade insamlare
            </dt>
            <dd className="text-lg font-semibold">{antal(data.verifierade_insamlare)}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: "var(--color-ink-3)" }}>
              Insamlat totalt
            </dt>
            <dd className="text-lg font-semibold" title={kr(data.insamlat_summa_ore)}>
              {kortBelopp(data.insamlat_summa_ore)}
            </dd>
          </div>
        </dl>
      ) : (
        <p
          className="mt-4 text-sm"
          style={{ color: "var(--color-ink-2)" }}
        >
          Ingen insamling startad här ännu — vill du bli först?
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Link
          href={
            val.typ === "lan"
              ? `/insamlingar?lan=${val.kod}`
              : val.typ === "kommun"
                ? `/insamlingar?kommun=${val.kod}`
                : `/insamlingar?hjalp_land=${encodeURIComponent(val.land)}`
          }
          className="btn btn-secondary btn-sm btn-block"
        >
          Se insamlingar
        </Link>
        {val.typ !== "hjalp" && (
          <Link href="/insamling" className="btn btn-primary btn-sm btn-block">
            Starta härifrån
          </Link>
        )}
      </div>
    </div>
  );
}
