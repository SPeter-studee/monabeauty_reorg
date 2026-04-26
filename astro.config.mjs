// astro.config.mjs
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Verzió kiolvasása package.json-ból build-időben
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8")
);
const APP_VERSION = pkg.version ?? "0.0.0";
const BUILD_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default defineConfig({
  site: "https://monastudio.hu",
  output: "server",                    // SSR Cloudflare Workers-en
  adapter: cloudflare({
    platformProxy: { enabled: true },  // dev környezetben D1 / KV / R2 elérhető
  }),

  // ── Internacionalizáció (HU default, könnyen bővíthető) ─────────────────────
  i18n: {
    defaultLocale: "hu",
    locales: ["hu", "en"],
    routing: {
      prefixDefaultLocale: false,      // / = HU, /en/ = EN
    },
    fallback: { en: "hu" },            // ha angol fordítás hiányzik, magyart mutatja
  },

  // ── Build és gyorsítás ─────────────────────────────────────────────────────
  build: {
    inlineStylesheets: "auto",
    assets: "_astro",
  },

  // ── Image optimalizáció ────────────────────────────────────────────────────
  image: {
    domains: ["images.monastudio.hu"], // R2 custom domain
  },

  // ── HTML compress + scoped CSS ─────────────────────────────────────────────
  compressHTML: true,
  scopedStyleStrategy: "where",

  // ── Vite — build-time konstansok ────────────────────────────────────────────
  // Az APP_VERSION és BUILD_DATE futás közben elérhető import.meta.env-en keresztül
  vite: {
    define: {
      "import.meta.env.PUBLIC_APP_VERSION": JSON.stringify(APP_VERSION),
      "import.meta.env.PUBLIC_BUILD_DATE": JSON.stringify(BUILD_DATE),
    },
  },
});
