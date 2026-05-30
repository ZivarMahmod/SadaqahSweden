// Designsystem v0.3+ — Tabs (tvärgående primitiv, efter brief 35).
//
// Generisk, tillgänglig in-page-flikkomponent (role=tablist/tab/tabpanel, roving
// tabindex, piltangents-navigering). För tabbat innehåll på en yta (t.ex.
// inställningar, utility-vyer). För route-baserade nivå-2-rumsflikar: använd
// RoomTabs (components/layout/room-tabs.tsx) istället.
//
// "use client": intern aktiv-flik-state + tangentbord. Båda tonlägena.
"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export type TabItem = { key: string; label: string; content: ReactNode };

type TabsProps = {
  items: TabItem[];
  defaultKey?: string;
  ariaLabel?: string;
};

export function Tabs({ items, defaultKey, ariaLabel }: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const base = useId();
  const tablistRef = useRef<HTMLDivElement>(null);

  const move = (dir: 1 | -1) => {
    const i = items.findIndex((it) => it.key === active);
    if (i < 0) return;
    const next = items[(i + dir + items.length) % items.length];
    setActive(next.key);
    tablistRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(`${base}-tab-${next.key}`)}`)
      ?.focus();
  };

  return (
    <div className="tabs-root">
      <div role="tablist" aria-label={ariaLabel} className="tabs" ref={tablistRef}>
        {items.map((it) => {
          const selected = it.key === active;
          return (
            <button
              key={it.key}
              type="button"
              role="tab"
              id={`${base}-tab-${it.key}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${it.key}`}
              tabIndex={selected ? 0 : -1}
              className={`tab${selected ? " active" : ""}`}
              onClick={() => setActive(it.key)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  move(1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  move(-1);
                }
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {items.map((it) => (
        <div
          key={it.key}
          role="tabpanel"
          id={`${base}-panel-${it.key}`}
          aria-labelledby={`${base}-tab-${it.key}`}
          hidden={it.key !== active}
          tabIndex={0}
          className="tab-panel"
        >
          {it.key === active && it.content}
        </div>
      ))}
    </div>
  );
}
