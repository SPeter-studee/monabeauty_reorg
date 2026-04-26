# 09 — Verziónapló (Changelog)

A Mona Studio V2 projekt változásnaplója. [Keep a Changelog](https://keepachangelog.com/) formátumot követi, [Semantic Versioning](https://semver.org/) szerint.

---

## [Unreleased]

### Hozzáadva
- _A következő szolgáltatás oldalak a Sprint 2B 2. körében_

---

## [0.3.0] — 2026-04-26 — Sprint 2B (1. kör) + dokumentáció

### Hozzáadva
- **Astro Content Collections** — `src/content/config.ts` (blog + services schema)
- **3 blog cikk markdown** formátumban a régi oldalról:
  - "Hogyan állapítsd meg a bőrtípusodat?"
  - "Amikor valaki kozmetikust választ..."
  - "Az első találkozásunk"
- **3 szolgáltatás markdown** (1. félidő):
  - Szemöldök laminálás + Szempilla lifting
  - Nanopen kezelés
  - Műszempilla
- **Új oldalak**:
  - `/blog` — lista (kiemelt + grid)
  - `/blog/[slug]` — egyedi cikk Schema.org Article-vel, prev/next nav
  - `/rolam` — Mónika E-E-A-T (Schema.org Person)
  - `/kapcsolat` — info + kontakt form
  - `/404` — egyedi hibaoldal
- **Új komponensek**:
  - `PageHero.astro` — közös oldal cím + breadcrumb
  - `ContactForm.astro` — Resend API integráció
  - `BlogCard.astro` — blog kártya
- **Új API**: `POST /api/contact` — kontakt form Resend-en + KV rate limit (5/óra/IP)
- **Schema.org BeautySalon kiegészítés** (BaseLayout):
  - `openingHoursSpecification`
  - `geo` (47.7821181, 19.1300852)
  - `areaServed` (Vác, Budapest, Hungary)
  - `priceRange` ($$)
- **Statikus prerender** a blog oldalakhoz (`export const prerender = true`)
- **Dokumentáció bővítés**:
  - `docs/00-architektura.md` — teljes tech architektúra
  - `docs/06-api-reference.md` — API endpoint referencia
  - `docs/07-deployment.md` — Cloudflare setup útmutató
  - `docs/08-sprint-log.md` — sprint napló
  - `docs/09-changelog.md` — ez a fájl
  - `docs/README.md` frissítve — új fájlok indexelése

### Változott
- **BaseLayout.astro**:
  - Email: `info@monastudio.hu` → `mona@monastudio.hu`
  - Cím Schema.org-ban: `Bartók Béla utca 3.` → `Zrínyi Miklós u. 3.`
  - Schema.org BeautySalon kiegészítve a fenti kulcsokkal
- **Footer.astro**:
  - Cím: `Bartók Béla utca 3.` → `Zrínyi Miklós u. 3.`

### Javítva
- **astro.config.mjs**: i18n.routing-ban eltávolítva a `redirectToDefaultLocale: false` (csak `prefixDefaultLocale: true` mellett van értelme — Astro 4 figyelmeztetés)
- **wrangler.toml**:
  - KV ID placeholder lecserélve valós értékre: `b2da4e4639ec4141a4f0c91ab3c5e8b7`
  - Pages projekt név: `monabeauty2`
- **package.json**: deploy parancs `monabeauty` → `monabeauty2` (egyezés a CF projekttel)

### Szükséges env vars (új)
- `RESEND_API_KEY` — kontakt form email küldéshez

---

## [0.2.0] — 2026-04-25 — Sprint 2A (Cookie consent + Toast + Newsletter)

### Hozzáadva
- **3 kategóriás GDPR cookie consent**:
  - `consent.ts` — állapot kezelés localStorage-ban
  - `CookieConsent.astro` — banner + részletes modal
  - Kategóriák: szükséges (mindig on), analytics, marketing
  - Cookie törlés ha visszavonja a hozzájárulást
- **Toast notification rendszer**:
  - `toast.ts` — esemény-alapú API
  - `ToastContainer.astro` — UI komponens
  - Helper-ek: `toastSuccess`, `toastError`, `toastCartAdd`
- **Newsletter feliratkozás**:
  - `NewsletterForm.astro` — Mailchimp double opt-in
  - `/api/newsletter/subscribe` — Mailchimp API proxy
- **Sale countdown időzítő**:
  - `SaleCountdown.astro` — vegyes (compact / full variant)
  - Sürgetés ≤ 1 óra alatt, max 7 napra mutat
- **Cart helper**: `cart.ts` — localStorage-alapú kosár logika
- **Layout javítások**:
  - Sticky footer (`body { display: flex; flex-direction: column }`)
  - iOS scroll lock fix (mobile menu)
  - Hover lock `@media (hover: hover)` médián
  - Touch target 44px minimum
  - Header scroll-direction (lefelé scroll-on eltűnik)
  - Scroll-padding-top (anchor link nem csúszik header alá)
- **WebP automatikus generálás**:
  - `scripts/generate-webp.mjs` — sharp-pal rekurzív
  - `npm run images:webp` script
  - mtime alapú kihagyás (csak újabb forrásokat dolgozza fel)

### Változott
- **tokens.css**:
  - Új változó: `--header-height` (scroll-padding-hoz)
  - Új változó: `--touch-target` (44px)
- **reset.css**:
  - Sticky footer pattern
  - Hover lock fix
- **Header.astro**:
  - Scroll direction logika
  - iOS-kompatibilis scroll lock
- **Footer.astro**:
  - "Cookie beállítások" gomb hozzáadva
- **BaseLayout.astro**:
  - CookieConsent + ToastContainer integráció
  - Analytics consent-gating

### Szükséges env vars (új)
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_AUDIENCE_ID`
- `MAILCHIMP_SERVER`

---

## [0.1.0] — 2026-04-25 — Sprint 1 (Astro alap + Design system)

### Hozzáadva
- **Astro 4 projekt** Cloudflare Pages adapter-rel (SSR mód)
- **TypeScript** szigorú konfigurációval
- **Design system v1.0**:
  - `tokens.css` — paletta (tört bézs + sötétzöld + patina arany), tipográfia (Cormorant Garamond + system-ui), térköz, sorköz
  - `reset.css` — modern reset
  - `layout.css` — container, grid, flex utility
  - Komponens stílusok: `buttons.css`, `badges.css`, `header.css`, `footer.css`
- **Komponensek**:
  - `Header.astro` — navigáció, mobile menu
  - `Footer.astro` — brand info, linkek, social
  - `BaseLayout.astro` — teljes oldal sablon (head meta, OG, Schema.org BeautySalon)
- **i18n**:
  - `hu.json`, `en.json` szótárfájlok
  - `utils.ts` segéd
  - Astro i18n config (HU default, EN támogatott)
- **Cloudflare config**:
  - `wrangler.toml` — D1, KV, R2 bindings sablon
  - `astro.config.mjs` — Cloudflare adapter, i18n, image domains
- **Dokumentáció**:
  - `README.md` — projekt áttekintés
  - `SETUP.md` — telepítési útmutató
  - `docs/01-design-system.md` — paletta, tipográfia, komponensek
  - `docs/02-reorganization-plan.md` — brand stratégia, SEO
  - `docs/03-known-issues.md` — régi rendszer hibái
  - `docs/04-v2-migration-plan.md` — átfogó projekt terv
  - `docs/05-product-schema.md` — termék adatlap séma
  - `.cursorrules` — Cursor automatikus kontextus

### Tech stack
- Astro 4.16.x
- @astrojs/cloudflare 11.2.x
- TypeScript 5.6.x
- wrangler 3.78.x

---

## Verziózási konvenció

A projekt **Semantic Versioning**-et követ:
- **MAJOR** (1.0.0): breaking change, új arch, API kompatibilitás vesztés
- **MINOR** (0.1.0): új funkció, sprint vége
- **PATCH** (0.0.1): bugfix, kis javítás

Sprintek **MINOR** verziót kapnak (0.1.0 = Sprint 1, 0.2.0 = Sprint 2A, 0.3.0 = Sprint 2B...).

---

## Karbantartás

Minden push előtt:
1. Hozzáadni az új commit-ot a `[Unreleased]` szekcióhoz
2. Sprint végén "kiadás": `[Unreleased]` → `[0.X.0] — DÁTUM — Sprint NÉV`
3. Új `[Unreleased]` szekciót nyitni a következő munkának
