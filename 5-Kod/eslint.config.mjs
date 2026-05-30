import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // OpenNext / Wrangler generated artifacts
      ".open-next/**",
      ".wrangler/**",
      "cloudflare-env.d.ts",
      // Statiska assets — aldrig källkod (t.ex. self-hostad pdf.js-worker).
      "public/**",
    ],
  },
];

export default eslintConfig;
