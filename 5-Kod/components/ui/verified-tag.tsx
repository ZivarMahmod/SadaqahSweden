// Designsystem v0.3 — VerifiedTag (F5). DESIGN-mönstret för "Verifierad X".
//
// Anti-dubbelbyggnad: brief 35 äger DESIGNEN, brief 38 äger SEMANTIKEN. Den här
// komponenten bygger mönstret; brief 38 fyller i de fem konkreta betydelserna och
// deras vanligaspråks-förklaringar (explanation-texten). Brief 35 skriver ingen
// av de fem betydelserna.
//
// Bygger på v0.2:s tag (.mag-tag) med success-ton + en attributions-rad: VEM
// verifierade (by), NÄR (at), och valfritt enligt vilken METOD/auktoritet
// (method). Förklaringen (explanation) visas vid tryck — aldrig en pampig
// "✓ VERIFIERAD"-banderoll (#11 R3, #18 R5). Diskret, attribuerad.
//
// `kind` är en typ-diskriminator (#19 R5) så att fem olika markeringar är
// visuellt åtskiljbara nog att inte läsas som EN stämpel — den sätts som
// data-attribut och kan styra ikon/nyans inom samma token-palett.
//
// A11y: klick-ytan är ≥44×44 px (osynligt utökad, F7) trots att den synliga
// taggen är ~22 px. Status bärs inte av färg ensam — ikon + textetikett finns.
//
// "use client": disclosure-toggle för förklaringen.
"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export type VerifiedKind =
  | "insamlare"
  | "forening"
  | "imam"
  | "innehall"
  | "identitet"
  | "generisk";

type VerifiedTagProps = {
  /** T.ex. "Verifierad insamlare". Textetikett — färg är aldrig enda signalen. */
  label: string;
  /** Vem som verifierade (auktoritet/roll). */
  by?: string;
  /** När (ISO-datum eller färdig sträng). */
  at?: string;
  /** Enligt vilken metod/auktoritet. */
  method?: string;
  /** Vanligaspråks-förklaring (visas vid tryck). Fylls per typ av brief 38. */
  explanation?: ReactNode;
  /** Typ-diskriminator — håller de fem markeringarna visuellt åtskilda. */
  kind?: VerifiedKind;
  /** Ikon-override; default shield-check. */
  icon?: ReactNode;
  className?: string;
};

export function VerifiedTag({
  label,
  by,
  at,
  method,
  explanation,
  kind = "generisk",
  icon,
  className,
}: VerifiedTagProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const harDetaljer = Boolean(by || at || method || explanation);

  return (
    <span className={["verified-tag-wrap", className].filter(Boolean).join(" ")} data-kind={kind}>
      <button
        type="button"
        className="verified-tag-trigger"
        aria-expanded={harDetaljer ? open : undefined}
        aria-controls={harDetaljer ? panelId : undefined}
        onClick={() => harDetaljer && setOpen((v) => !v)}
        // Markören är inte klickbar om det inte finns något att fälla ut.
        style={{ cursor: harDetaljer ? "pointer" : "default" }}
      >
        <span className="mag-tag mag-tag-success">
          <span aria-hidden style={{ display: "inline-flex" }}>
            {icon ?? <Icon name="shield-check" size={12} />}
          </span>
          {label}
        </span>
      </button>

      {harDetaljer && open && (
        <div id={panelId} role="region" aria-label={label} className="verified-tag-panel">
          {(by || at || method) && (
            <dl className="verified-tag-attribution">
              {by && (
                <div>
                  <dt>Verifierad av</dt>
                  <dd>{by}</dd>
                </div>
              )}
              {at && (
                <div>
                  <dt>När</dt>
                  <dd>{at}</dd>
                </div>
              )}
              {method && (
                <div>
                  <dt>Metod</dt>
                  <dd>{method}</dd>
                </div>
              )}
            </dl>
          )}
          {explanation && <p className="verified-tag-explanation">{explanation}</p>}
        </div>
      )}
    </span>
  );
}
