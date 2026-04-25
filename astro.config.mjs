// astro.config.mjs
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

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
      redirectToDefaultLocale: false,
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
});
