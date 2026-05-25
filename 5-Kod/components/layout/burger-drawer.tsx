// Designsystem-chrome — BurgerDrawer.
// Mörk drawer från höger, overlay-klick / ESC / stäng-knapp stänger.
// Klient-komponent: hanterar open-state, key-listener och body-scroll-lock.
// Designreferens: handoff v2.1/source/studio/components.jsx (BurgerDrawer)
// + handoff v2.1/source/studio/styles.css § "Hamburger".
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DrawerItem = { href: string; label: string; mono?: string };
export type DrawerSection = { label: string; items: DrawerItem[] };

type BurgerDrawerProps = {
  sections: DrawerSection[];
};

export function BurgerDrawer({ sections }: BurgerDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const tidigareOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = tidigareOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="chrome-burger"
        aria-label="Öppna meny"
        aria-expanded={open}
        aria-controls="burger-drawer-panel"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div
          className="burger-drawer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Meny"
        >
          <div className="burger-drawer-panel" id="burger-drawer-panel">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="close"
              aria-label="Stäng meny"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {sections.map((sec) => (
              <div key={sec.label} className="burger-section">
                <div className="label">{sec.label}</div>
                <ul>
                  {sec.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setOpen(false)}>
                        <span>{item.label}</span>
                        {item.mono && <span className="mono">{item.mono}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
