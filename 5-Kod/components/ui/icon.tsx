// Designsystem-primitiv — Icon (inline SVG, port av handoff-to-code/assets/shared.js icon-set).
import type { SVGProps } from "react";

const PATHS: Record<string, string> = {
  "arrow-right": "M5 12h14M13 5l7 7-7 7",
  "arrow-left": "M19 12H5M11 19l-7-7 7-7",
  check: "M5 12l5 5L20 7",
  shield: "M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z",
  user: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-7 8-7s8 3 8 7",
  users:
    "M9 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 21c0-4 3-6 7-6s7 2 7 6M17 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM22 19c0-2.5-2-4-4.5-4",
  building: "M4 3h16v18H4zM8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  filter: "M3 5h18M6 12h12M10 19h4",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  "chevron-right": "M9 6l6 6-6 6",
  "chevron-down": "M6 9l6 6 6-6",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z",
  "shield-check": "M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4zM8 12l3 3 5-5",
  lock: "M4 11h16v10H4zM8 11V8a4 4 0 0 1 8 0v3",
  "file-check": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 14l2 2 4-4",
  inbox: "M3 13l3-8h12l3 8M3 13v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6M3 13h5l2 3h4l2-3h5",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z",
  "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  "alert-triangle": "M12 2L1 21h22zM12 9v4M12 17h.01",
  "check-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  sparkles: "M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5L8 16M16 8l2.5-2.5",
  "map-pin": "M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  gift: "M3 8h18v13H3zM3 12h18M12 8v13M7 8s-1-5 5-3-5 3-5 3M17 8s1-5-5-3 5 3 5 3",
  external: "M14 3h7v7M21 3l-9 9M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6",
  flag: "M4 21V4M4 4h12l-2 4 2 4H4",
  // v0.3-tillägg (brief 35) — additivt, samma stroke-stil.
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M12 11v5",
  refresh: "M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5",
  "cloud-off": "M3 3l18 18M6.5 10A4 4 0 0 0 7 18h9.5M9 5.6A6 6 0 0 1 18 9a3.5 3.5 0 0 1 2.4 6",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  "book-open": "M12 7v14M12 7C10.5 5.5 8 5 6 5H3v13h3c2 0 4.5.5 6 2 1.5-1.5 4-2 6-2h3V5h-3c-2 0-4.5.5-6 2z",
};

type IconName = keyof typeof PATHS | string;

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 18, ...rest }: IconProps) {
  const d = PATHS[name as keyof typeof PATHS];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d ? <path d={d} /> : <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}
