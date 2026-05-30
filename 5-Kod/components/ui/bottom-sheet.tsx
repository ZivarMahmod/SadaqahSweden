// Designsystem v0.3 — BottomSheet (F5). Delad primitiv.
//
// En bottensheet för kartan (mobil) och valfri kompakt detaljvy. På desktop
// degraderar den till en sidopanel från höger (CSS-styrt, se app/globals.css
// .bottom-sheet*). Byggs EN gång här och återanvänds (kartan brief 42, valfria
// detaljvyer) — ingen yta uppfinner sin egen.
//
// A11y, samma disciplin som BurgerDrawer (brief 21): fokushantering (fokus
// flyttas in vid öppning, fokus-trap, återställs vid stängning), ESC-stängning,
// overlay-klick stänger, body-scroll-lås. role="dialog" aria-modal.
//
// "use client": hanterar open/onClose-state och tangentbord. Båda tonlägena
// (sätt data-tone på innehållet via <ToneSurface> om verktygston önskas).
"use client";

import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Tillgänglig rubrik (visas + används som aria-label om titleId saknas). */
  title?: string;
  children: ReactNode;
  /** Maxhöjd på mobil-sheeten (CSS-värde). Default 85vh. */
  maxHeight?: string;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function BottomSheet({ open, onClose, title, children, maxHeight = "85vh" }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Flytta fokus in i sheeten.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        );
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const tidigareOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = tidigareOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="bottom-sheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bottom-sheet-panel" ref={panelRef} style={{ maxHeight }}>
        <div className="bottom-sheet-grip" aria-hidden />
        <div className="bottom-sheet-head">
          {title && <h2 className="heading-3">{title}</h2>}
          <button type="button" className="bottom-sheet-close" onClick={onClose} aria-label="Stäng">
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
        </div>
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>
  );
}
