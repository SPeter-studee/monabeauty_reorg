# 09 — Verziónapló (Changelog)

A Mona Studio V2 projekt változásnaplója. [Keep a Changelog](https://keepachangelog.com/) formátumot követi, [Semantic Versioning](https://semver.org/) szerint.

---

## [Unreleased]

### Hozzáadás tervezett
- _Sprint 3 — Webshop_

---

## [0.5.2] — 2026-04-26 — Sprint 2B (5. kör) — 26 akciónaptár

### Hozzáadva
- **26 új akció markdown** (`src/content/promotions/`):
  - Forrás: `MonaStudio_Marketing_Kampanynaptar.xlsx` (5 munkalap)
  - Mind a 26 ciklus Mónika hangján — "Kinek ajánlom" struktúrával
  - Tartalom 800-1500 karakter ciklusonként
  - Frontmatter: badge, serviceSlug, discountPercent, startsAt, endsAt, showOnHomepage, heroImageUrl, ctaText, ctaUrl, sortOrder
- **Aktuális akció (2026-04-26)**: #1 Tavaszi Frissítés (Arckezelés −15% csomag, ápr 21 - máj 4)
- **Következő**: #2 Anyák Napja (máj 5 - máj 18)

### Akcióstruktúra
- **2 hetes ciklusok** — szépségiparban természetes ritmus
- **Szezonalitás**: PMU főleg ősszel + tél, gyantázás nyár előtt + húsvét, smink alkalmakkor
- **Bevételi potenciál cimkék**: Magas, Nagyon magas, Közepes
- **Service slug mapping**: minden akció kötődik egy szolgáltatáshoz (kivéve "Komplex" csomagok)

### Eltávolítva
- `szemoldok-tetovalas-bevezeto.md` (a régi demó akció) — felülírva az Excel-alapú aktuális #25 Tavaszi PMU-val

### Megjegyzés
A naptár 2026.04 → 2027.04-ig fedi le az évet. Az `ActivePromotion` komponens automatikusan a most aktívat mutatja a főoldalon (`showOnHomepage: true` + dátumok).

---

## [0.5.1] — 2026-04-26 — Sprint 2B (4. kör) — Tartalom finomítás + verziózás

### Hozzáadva
- **Verziózás bevezetése a UI-ban**:
  - `package.json` `version` mező → build-időben beégetve a HTML-be
  - `astro.config.mjs` Vite `define` plugin: `import.meta.env.PUBLIC_APP_VERSION`, `import.meta.env.PUBLIC_BUILD_DATE`
  - **Footer verziósor**: `v0.5.1 · SP Design` diszkrét, hover-re kicsit erősebb, tooltip-ben build dátum
  - **HTML meta tag**: `<meta name="app-version">` és `<meta name="build-date">`
  - **`GET /api/version`** endpoint — JSON: name, version, buildDate, runtime, framework
- **Új doksi**: `docs/10-versioning.md` — verziózási konvenció, bump folyamat, hol látszik

### Változott
- **Mind a 8 szolgáltatás markdown újraírva** Mónika személyes hangján:
  - Szemöldök tetoválás
  - Szemöldök laminálás + szempilla lifting
  - Nanopen kezelés
  - Arckezelések (7 kezeléstípus, döntési útmutatóval)
  - Műszempilla
  - Gyantázás
  - Szemöldök festés + szempilla festés
  - Smink
- **Új struktúra**: `Mitől különleges? / Kinek ajánlott?` (lista) → `Kinek ajánlom / Kinek nem ajánlom` (Mónika hangján, részletes magyarázattal)
- **Részletes szolgáltatás oldal**: hero kép szekció levéve (`[slug].astro`)
  - A kártyán már látta a vendég, duplikáció volt
  - A `heroImageUrl` továbbra is használatos a kártyán + OG meta tag-ben
- **package.json** verzió: `1.0.0` → `0.5.1` (a tényleges projekt fázis szerint)
- **package.json** deploy parancs: `monabeauty` → `monabeauty2`

### SEO előny
- Lényegesen több egyedi tartalom oldalanként (~3-4× hosszabb)
- Természetes long-tail kulcsszavak ("ki ne csináltassa", "alkalmas-e", "fájdalmas-e")
- Strukturált információ (kérdés-válasz alapú szekciók)

### Brand alapelvek megerősítve
- ✅ **Csendes** — kevesebb felkiáltó marketing-szöveg
- ✅ **Személyes** — Mónika beszél első személyben
- ✅ **Természetes** — élet- és bőrtípus szerinti tanácsok
- ✅ **Szakmai** — őszinte ellenjavallatok minden kezelésnél

---

## [0.5.0] — 2026-04-26 — Sprint 2B (3. kör) — Főoldal + jogi oldalak

### Hozzáadva
- **Új Astro Content Collection**: `src/content/promotions/`
  - Schema: `badge`, `serviceSlug`, `discountPercent`, `startsAt`, `endsAt`, `showOnHomepage`, `ctaText`, `ctaUrl`
  - Demó akció: `szemoldok-tetovalas-bevezeto.md` (−20% bevezető akció, 2026-04-01 → 2026-05-31)
- **8 főoldal komponens** (`src/components/home/`):
  - `HomeHero.astro` — Mónika portré responsive `<picture>` 480/900/main
  - `BrandPillars.astro` — 4 alapelv (csendes / személyes / természetes / szakmai)
  - `FeaturedTreatment.astro` — kiemelt szolgáltatás Mónika idézettel
  - `ActivePromotion.astro` — aktív akció + `SaleCountdown`
  - `ServicesPreview.astro` — featured szolgáltatások (max 4)
  - `BlogPreview.astro` — 3 legutolsó cikk
  - `AboutMonikaTeaser.astro` — Mónika rövid teaser
  - `TrustindexReviews.astro` — Trustindex.io widget integráció
- **Új főoldal** (`src/pages/index.astro`) — teljes szekció-sorrend: HomeHero → BrandPillars → FeaturedTreatment → ActivePromotion → ServicesPreview → BlogPreview → AboutMonikaTeaser → TrustindexReviews → NewsletterForm
- **Header mobile menu drawer kibővítve**:
  - Foglalás CTA gomb
  - HU/EN nyelv váltó
  - Social linkek (Facebook + Instagram, frissített URL-ekkel: monastudiovac)
  - Telefon, email, cím
- **9 új statikus oldal**:
  - `/galeria` — kezelési képek + Instagram CTA
  - `/velemenyek` — Trustindex widget egész oldal + Google review CTA
  - `/szalon` — Vác Local SEO oldal Google Maps embed-del
  - `/aszf` — Általános Szerződési Feltételek
  - `/adatvedelem` — GDPR Adatkezelési tájékoztató
  - `/cookies` — Cookie tájékoztató (3 kategóriás magyarázat)
  - `/szallitas` — FoxPost / GLS / személyes átvétel infó
  - `/bejelentkezes` — login form (statikus, Sprint 4-ben funkcionálissá)
  - `/regisztracio` — register form (statikus, Sprint 4-ben funkcionálissá)

### Változott
- **Content Collections schema** — `promotions` collection hozzáadva
- **Header.astro mobile menu** drawer-be bekerült a foglalás gomb, lang switcher, social, kontakt
- **header.css** mobile menu footer szekció CSS

### Megjegyzések
- A jogi oldalakon `placeholder` szakaszok jelölik a finalizálandó részeket (nyilvántartási szám, adószám, fizetési díjszabás stb.) — ezek a webshop élesítésekor frissítendők
- A Trustindex widget URL `index.astro` és `velemenyek.astro` oldalakon `TRUSTINDEX_WIDGET_URL = ""` placeholder — cseréld le a Trustindex.io loader URL-jére
- Login és register formok jelenleg disabled állapotban vannak placeholder üzenettel, Sprint 4-ben funkcionálissá válnak

### Megoldott issue-k
- ✅ 11. — Header tablet + landscape mobil (mobile menu drawer kibővítve)
- ✅ 13. — Főoldal kiemelt szolgáltatás + akció szekciók implementálva

---

## [0.4.0] — 2026-04-26 — Sprint 2B (2. kör) — Szolgáltatás oldalak

### Hozzáadva
- **8 szolgáltatás markdown** (`src/content/services/`):
  - Szemöldök tetoválás (szálazás + ombre technika)
  - Szemöldök laminálás + Szempilla lifting (egy oldalon)
  - Nanopen kezelés (London Beauty hialuron por)
  - Arckezelések (7 variáns: Rejuven, Mesotica peptides, Savas hámlasztás, Tini, Hidratáló, Frissítő, Arc-dekoltázs masszázs)
  - Műszempilla (1D, 3D, 5D, 7D volumen)
  - Gyantázás (patronos + wax)
  - Szemöldök formázás és festés, szempilla festés
  - Smink (egyedi árazással)
- **Új oldalak**:
  - `/szolgaltatasok` — hub (kiemelt + grid kártyákkal)
  - `/szolgaltatasok/[slug]` — egyedi szolgáltatás Schema.org Service markup-pal
- **Új komponens**: `ServiceCard.astro` — hero képpel és ár-jelzéssel
- **17 új kép** (`public/images/`):
  - `services/` — 10 hero kép (Mona-branded, professzionális)
  - `sections/` — `hero-main.webp` (responsive 480/900 variánsokkal), `blog-hero.webp`, `galeria-hero.webp`, `szolgaltatasok-hero.webp`
  - `og-default.jpg` — frissítve (Mónika szalon háttérrel)
- **Schema.org Service markup**: provider (BeautySalon), areaServed (Vác, Budapest), opcionális offers (priceFrom)
- **Related kezelések blokk** minden egyedi szolgáltatás oldal alján (3 random másik)

### Featured kezelések
- Arckezelések (a leggazdagabb tartalom + Eclado/Mesotica brand fókusz)
- Szemöldök tetoválás (`sortOrder: 5`)
- Szemöldök laminálás + Szempilla lifting (`sortOrder: 20`)
- Nanopen kezelés (`sortOrder: 30`)

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
