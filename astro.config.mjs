// astro.config.mjs
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
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

  // ── Integrációk ─────────────────────────────────────────────────────────────
  integrations: [
    sitemap({
      // Sprint 4-ben aktiválandó (login/register) oldalak nem indexelendők
      filter: (page) =>
        !page.includes("/admin/") &&
        !page.includes("/api/") &&
        !page.includes("/profil/") &&
        !page.includes("/bejelentkezes") &&
        !page.includes("/regisztracio"),
      i18n: {
        defaultLocale: "hu",
        locales: { hu: "hu-HU", en: "en-US" },
      },
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      // Egyedi prioritás a fő oldalakhoz
      serialize(item) {
        if (item.url === "https://monastudio.hu/") {
          item.priority = 1.0;
          item.changefreq = "daily";
        } else if (item.url.includes("/szolgaltatasok/") || item.url.includes("/blog/")) {
          item.priority = 0.8;
          item.changefreq = "weekly";
        } else if (item.url.includes("/aszf") || item.url.includes("/adatvedelem") || item.url.includes("/cookies")) {
          item.priority = 0.3;
          item.changefreq = "monthly";
        }
        return item;
      },
    }),
  ],

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
  vite: {
    define: {
      "import.meta.env.PUBLIC_APP_VERSION": JSON.stringify(APP_VERSION),
      "import.meta.env.PUBLIC_BUILD_DATE": JSON.stringify(BUILD_DATE),
    },
  },
});
