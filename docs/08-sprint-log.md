# 08 — Sprint napló

A Mona Studio V2 projekt sprint naplója — minden sprint mit tartalmazott, miben döntöttünk, mi hozzáadott / változott.

---

## ✅ Sprint 1 — Astro alap + Design system

**Időszak**: 2026-04-25 (egy nap)  
**Cél**: Astro projekt létrehozása Cloudflare Pages-re, design system v1.0 implementálása.

### Mit építettünk

**Tech alapok:**
- Astro 4 SSR (Cloudflare adapter)
- TypeScript szigorú mód
- Vite alapú dev környezet
- ESLint + Prettier (alapszintű)

**Design system v1.0:**
- CSS változók (`tokens.css`): paletta, tipográfia, térköz, sorköz
- Reset (`reset.css`): modern reset Mona Studio brand-hez
- Layout (`layout.css`): container, grid, flex utility
- Komponens stílusok (`buttons.css`, `badges.css`, `header.css`, `footer.css`)

**Komponensek:**
- `Header.astro` — navigáció, mobile menu
- `Footer.astro` — brand info, linkek, social
- `BaseLayout.astro` — teljes oldal sablon (head meta, OG, Schema.org)

**i18n:**
- `hu.json`, `en.json` szótárfájlok
- `utils.ts` segéd
- Astro `i18n` config (`prefixDefaultLocale: false`)

### Döntések

- **Astro 4 SSR mód** — szerver oldali rendering Cloudflare Workers-en, jó SEO, dinamikus tartalom kezelés
- **Saját design system** — nem Tailwind, nem komponens könyvtár (Material UI, Chakra stb.) — egyedi brand identitás
- **Cormorant Garamond** serif a címeknek + system-ui a body-nak — premium érzet
- **Tört bézs paletta** (`#ebe5db`) — Kiehl's / La Mer "természetes prémium" irány

### Fájlok (új)
- 30+ fájl Astro alap + design system

---

## ✅ Sprint 2A — Cookie consent + Toast + Newsletter

**Időszak**: 2026-04-25  
**Cél**: GDPR cookie consent, toast notification rendszer, newsletter feliratkozás Mailchimp-pel.

### Mit építettünk

**Cookie consent (3 kategóriás GDPR):**
- `consent.ts` — állapot kezelés localStorage-ban
- `CookieConsent.astro` — banner + részletes modal
- 3 kategória: szükséges (always on), analytics (off default), marketing (off default)
- Cookie törlés ha visszavonja a hozzájárulást
- Footer "Cookie beállítások" gomb

**Toast notification:**
- `toast.ts` — esemény-alapú API (`toastSuccess`, `toastError`, `toastCartAdd`)
- `ToastContainer.astro` — UI komponens

**Newsletter feliratkozás:**
- `NewsletterForm.astro` — email input + Mailchimp double opt-in
- `/api/newsletter/subscribe` — Mailchimp API proxy (status: "pending")

**Sale countdown:**
- `SaleCountdown.astro` — vegyes (compact / full variant)
- Csak ≤ 7 napra mutatja, sürgetés < 1 óra alatt

**Cart helper:**
- `cart.ts` — localStorage-alapú kosár logika

**Layout javítások:**
- Sticky footer (`body { display: flex; flex-direction: column }`)
- iOS scroll lock (mobile menu mögött nem scrollozik)
- Hover lock fix (`@media (hover: hover)`)
- Touch target 44px minimum
- Header scroll-direction (lefelé scroll-on eltűnik)
- Scroll-padding-top (anchor link nem csúszik header alá)

### Döntések

- **3 kategóriás consent** — necessary, analytics, marketing — GDPR konform
- **Newsletter NEM popup** — Mailchimp double opt-in, footer felett egy szekcióban
- **Toast jobb felül desktop, alul mobil** — modern UX
- **Akciós időzítő vegyes** — kártyán csendes, termékoldalon hangos

### Fájlok (új + módosítás)
- 8 új fájl (consent, toast, newsletter, sale countdown, cart)
- 5 módosított fájl (tokens, reset, header, footer, BaseLayout)

---

## ✅ Sprint 2B (1. kör) — Statikus oldalak (blog, rólam, kapcsolat, 404)

**Időszak**: 2026-04-26  
**Cél**: Statikus oldalak migrálása az új Astro struktúrába a meglévő tartalom alapján.

### Mit építettünk

**Astro Content Collections:**
- `src/content/config.ts` — schema (blog + services típusok Zod-dal)
- 3 blog cikk markdown fájlokkal:
  - `hogyan-allapitsd-meg-a-bortipusodat.md`
  - `amikor-valaki-kozmetikust-valaszt.md`
  - `az-elso-talalkozasunk.md`

**Új oldalak:**
- `/blog` — lista (kiemelt cikk + grid)
- `/blog/[slug]` — egyedi cikk (Schema.org Article, prev/next nav, author kártya)
- `/rolam` — Mónika E-E-A-T (Schema.org Person)
- `/kapcsolat` — info + kontakt form
- `/404` — egyedi hibaoldal

**Új komponensek:**
- `PageHero.astro` — közös oldal cím + breadcrumb
- `ContactForm.astro` — Resend API + KV rate limit
- `BlogCard.astro` — blog kártya

**Új API:**
- `/api/contact` — Resend email küldés `mona@monastudio.hu`-ra, 5/óra/IP rate limit

**Schema.org BeautySalon kiterjesztés** (BaseLayout):
- `openingHoursSpecification` (H-P nyitvatartás)
- `geo` (47.7821181, 19.1300852)
- `areaServed` (Vác, Budapest, Hungary)
- `priceRange` ($$)

### Döntések

- **Markdown alapú blog** (Astro Content Collections) — Mónika közvetlenül szerkeszthet markdown-t, később D1-be lehet migrálni
- **Cím javítás**: `Bartók Béla utca 3.` → `Zrínyi Miklós u. 3.` (a régi oldalon ez volt a helyes)
- **Email**: `info@monastudio.hu` → `mona@monastudio.hu` (mindenhol egységesen)
- **3 kontakt téma választható**: Kezelés, Időpontfoglalás, Webshop, Egyéb
- **Statikus prerender** a blog oldalakhoz (`export const prerender = true`) — gyorsabb CDN-ből

### Fájlok (új + módosítás)
- 13 új fájl (blog system, oldal, komponens, API)
- 3 módosított fájl (Footer, BaseLayout, astro.config)

---

## ✅ Sprint 2B (2. kör) — Szolgáltatás oldalak

**Időszak**: 2026-04-26  
**Cél**: 8 szolgáltatás oldal a meglévő `monastudio.hu` tartalmából + hub oldal.

### Mit építettünk

**Markdown tartalom (8/8 kész):**
- ✅ `szemoldok-tetovalas.md` (szálazás + ombre)
- ✅ `szemoldok-laminalas-szempilla-lifting.md`
- ✅ `nanopen-kezeles.md`
- ✅ `arckezelesek.md` (7 variáns: Rejuven, Mesotica, Savas hámlasztás, Tini, Hidratáló, Frissítő, Arc-dekoltázs masszázs)
- ✅ `muszempilla.md`
- ✅ `gyantazas.md`
- ✅ `szemoldok-szempilla-festes.md`
- ✅ `smink.md` (egyedi árazással)

**Új oldalak:**
- `/szolgaltatasok` — hub (kiemelt + grid kártyákkal)
- `/szolgaltatasok/[slug]` — egyedi szolgáltatás, Schema.org Service markup, hero kép

**Új komponens:**
- `ServiceCard.astro` — kártya hero képpel és ár-jelzéssel

**Képek bemásolva** (`public/images/`):
- `services/` — 10 hero kép a 8 szolgáltatáshoz (Mona-branded, professzionális)
- `sections/` — `hero-main.webp` (responsive 480/900 variánsokkal), `blog-hero.webp`, `galeria-hero.webp`, `szolgaltatasok-hero.webp`
- `og-default.jpg` — frissítve (Mónika szalon háttérrel)

### Schema változás
- Content Collections: `cover` és `heroImage` mezők → `coverImageUrl` / `heroImageUrl` string formátum (public mappára mutató path)
- Egyszerűbb karbantartás, közvetlenül szerkeszthető markdown frontmatter-ben

### Döntések

- **Markdown alapú szolgáltatások** — könnyen szerkeszthető, később admin felületen át is módosítható
- **Featured flag** — `arckezelesek`, `szemoldok-tetovalas`, `szemoldok-laminalas-szempilla-lifting`, `nanopen-kezeles` kiemelve
- **Schema.org Service markup** — Local SEO: provider (BeautySalon), areaServed (Vác, Budapest), opcionális offers (priceFrom)
- **Smink egyedi árazás** — `priceNote` mező, fix ár nincs (egyeztetés alapján)
- **Slug konzisztencia**: `arckezelesek` többes szám (összetett oldal 7 kezeléssel)
- **Két szolgáltatás összevonva** egy oldalra: szemöldök laminálás + szempilla lifting (egy kezelés alkalom)

### Fájlok (új)
- 8 új markdown fájl (`src/content/services/`)
- 1 új komponens (`ServiceCard.astro`)
- 2 új oldal (hub + dynamic slug)
- 17 új kép (`public/images/services/` + `public/images/sections/` + `og-default.jpg`)
- `src/content/config.ts` schema módosítás
- 2 új oldal (`/szolgaltatasok/index.astro`, `/szolgaltatasok/[slug].astro`)
- 1 új komponens (`ServiceCard.astro`)

---

## ✅ Sprint 2B (3. kör) — Főoldal + jogi oldalak + responsive fix

**Időszak**: 2026-04-26  
**Cél**: Vélemények, galéria, jogi oldalak, főoldal teljes bővítés akcióval, responsive header fix.

### Mit építettünk

**Új Astro Content Collection**:
- `src/content/promotions/` — markdown akciónaptár schema-val (`badge`, `serviceSlug`, `discountPercent`, `startsAt`, `endsAt`, `showOnHomepage`, `ctaText`, `ctaUrl`)
- Demó akció: `szemoldok-tetovalas-bevezeto.md` (−20% bevezető, 2026-04-01 → 2026-05-31)


**Új főoldal komponensek** (`src/components/home/`):
- `HomeHero.astro` — Mónika portré responsive `<picture>` 480/900/main + signature
- `BrandPillars.astro` — 4 alapelv kártya (csendes/személyes/természetes/szakmai)
- `FeaturedTreatment.astro` — kiemelt szolgáltatás Mónika idézettel (szemöldök tetoválás default)
- `ActivePromotion.astro` — aktuális akció + `SaleCountdown` integráció (csak ha aktív)
- `ServicesPreview.astro` — featured szolgáltatások (max 4)
- `BlogPreview.astro` — 3 legutolsó cikk
- `AboutMonikaTeaser.astro` — Mónika rövid teaser link a /rolam oldalra
- `TrustindexReviews.astro` — Trustindex.io widget integráció (widgetUrl prop)

**Új főoldal** (`src/pages/index.astro`) szekció-sorrend:
```
HomeHero → BrandPillars → FeaturedTreatment → ActivePromotion
→ ServicesPreview → BlogPreview → AboutMonikaTeaser
→ TrustindexReviews → NewsletterForm
```

**Header responsive fix** (TODO 11. issue):
- Mobile menu drawer bővítve: foglalás CTA gomb, HU/EN switcher, social linkek (FB+IG), telefon, email, cím
- Mobile menu footer szekció CSS-sel a `header.css`-ben
- A jelenlegi 1024px breakpoint megfelelő (tablet portrait + mobil → hamburger, desktop → teljes nav)

**Maradék statikus oldalak**:
- `/galeria` — kezelési képek galéria + Instagram link
- `/velemenyek` — Trustindex widget egész oldal + Google review CTA
- `/szalon` — Vác Local SEO oldal Google Maps embed-del + nyitvatartással + környékbeli települések
- `/aszf` — Általános Szerződési Feltételek (11 szakasz, placeholder szakaszokkal a finalizáláshoz)
- `/adatvedelem` — GDPR Adatkezelési tájékoztató (9 szakasz)
- `/cookies` — Cookie tájékoztató (3 kategóriás magyarázat)
- `/szallitas` — FoxPost / GLS / személyes átvétel infó
- `/bejelentkezes` — login form (statikus, Sprint 4-ben funkcionálissá)
- `/regisztracio` — register form (statikus, Sprint 4-ben funkcionálissá)

### Döntések

- **Akciók markdown alapon** (most), Sprint 5-ben admin felület migrálhatja D1-be
- **Trustindex widget** vendég véleményekhez — 3rd party, embed scripttel; widgetUrl prop a komponensben (placeholder ha üres)
- **Login/register oldalak már most** — statikus formok placeholder-rel, hogy a UX teljes legyen, Sprint 4-ben kapnak funkciót
- **Jogi oldalak placeholder-ekkel** — nyilvántartási szám, adószám, fizetési szolgáltatók, díjszabás → finalizálandó éles indulás előtt
- **Mobile menu drawer kiterjesztve** — foglalás gomb + nyelv váltó + social + kapcsolat egy helyen
- **Galéria most a meglévő szolgáltatás képeket használja** — később kezelési előtte/utána fotók is bekerülnek

### Fájlok (új + módosítás)

- 1 új Content Collection (promotions)
- 1 demó markdown akció
- 8 új főoldal komponens
- 1 új főoldal (index.astro újraírva)
- 9 új statikus oldal (galéria, vélemények, szalon, aszf, adatvedelem, cookies, szallitas, bejelentkezes, regisztracio)
- Header.astro mobile menu drawer bővítve
- header.css mobile menu footer szekció hozzáadva
- src/content/config.ts — promotions schema

---

## ✅ Sprint 2B (4. kör) — Tartalom finomítás + verziózás

**Időszak**: 2026-04-26  
**Cél**: A 8 szolgáltatás oldal szövegeinek átírása Mónika személyes hangján, és verziózás bevezetése a UI-ban.

### Mit építettünk

**Mind a 8 szolgáltatás oldal markdown újraírva**:
- `szemoldok-tetovalas.md` — szálazás vs ombre Mónika tapasztalatával + 5/6 javallat-ellenjavallat
- `szemoldok-laminalas-szempilla-lifting.md` — összevonva, kombinált kezelésként
- `nanopen-kezeles.md` — szakmai magyarázat miért hatékonyabb (London Beauty por aktiválás)
- `arckezelesek.md` — 7 kezelés egyenként Mónika hangján, döntési útmutatóval a végén
- `muszempilla.md` — őszinte (nem mindenkinek való), 1D/3D/5D/7D életstílus szerint
- `gyantazas.md` — patron vs wax választás bőrtípus szerint, mire figyelek
- `szemoldok-szempilla-festes.md` — pozícionálva mint "belépő szint" a szemöldök-világba
- `smink.md` — nem fed, hanem kiemel; egyedi árazás indoklással

**Részletes szolgáltatás oldal struktúra változás** (`[slug].astro`):
- **Hero kép levétel** — a kártyán már látta a vendég, itt felesleges duplikáció
- A `heroImageUrl` mező marad a frontmatter-ben (kártya + OG meta tag használja)
- A részletes oldal a **szövegre fókuszál**

**Verziózás bevezetése**:
- `package.json` verzió: `1.0.0` → `0.5.1` (tényleges projektfázis)
- `package.json` deploy parancs: `monabeauty` → `monabeauty2`
- `astro.config.mjs` — Vite `define` plugin a verzió + build dátum beégetéséhez
- `env.d.ts` — `ImportMetaEnv` típus a `PUBLIC_APP_VERSION` és `PUBLIC_BUILD_DATE`-hez
- **Footer verziósor**: `v0.5.1 · SP Design` (diszkrét, jobb oldalt, hover-re kicsit erősebb)
- **HTML meta tag-ek**: `<meta name="app-version">`, `<meta name="build-date">`
- **`GET /api/version`** endpoint — JSON: name, version, buildDate, runtime, framework
- **Új doksi**: `docs/10-versioning.md` — semver konvenció, bump folyamat

### Döntések

- **Mónika E-E-A-T hang** — első személyű, személyes, szakmai őszinteséggel
- **"Kinek nem ajánlom" szekció kötelező** — Mónika filozófiájának része ("ha nem fog segíteni, megmondom")
- **Concrete tippek és figyelmeztetések** — terhesség, gyógyszerek, érzékenység rögzítve
- **Folyamat leírása** — vendégeknek jó tudni mit várhatnak (időtartam, fájdalom, utógondozás)
- **Hero kép a részletes oldalról levéve** — letisztultabb, szöveg-fókuszú UX
- **Verzió build-időben beégetve** — automatikus, nem kézi karbantartás
- **Verzió diszkrét megjelenítés** — alacsony opacity, hover-re erősebb (nem zavaró, de a szakmaiság jele)

### SEO előny
- Lényegesen több egyedi tartalom oldalanként (~3-4× hosszabb)
- Természetes long-tail kulcsszavak ("ki ne csináltassa", "alkalmas-e", "fájdalmas-e")
- Strukturált information (kérdés-válasz alapú szekciók)

### Fájlok (új + módosítás)
- 8 markdown újraírva (`src/content/services/*.md`)
- `src/pages/szolgaltatasok/[slug].astro` — hero kép szekció + CSS levéve
- `package.json` — verzió + deploy név javítva
- `astro.config.mjs` — Vite define hozzáadva
- `env.d.ts` — ImportMetaEnv típusok
- `src/components/common/Footer.astro` — verzió szekció hozzáadva
- `src/layouts/BaseLayout.astro` — meta tag-ek hozzáadva
- `src/pages/api/version.ts` — új endpoint
- `docs/10-versioning.md` — új dokumentum
- `docs/06-api-reference.md` — `/api/version` hozzáadva
- `docs/README.md` — 10-es indexben

---

## ✅ Sprint 2B (5. kör) — 26 akciónaptár

**Időszak**: 2026-04-26  
**Cél**: A teljes éves marketing kampánynaptár (26 db kéthetes ciklus) markdown formában a `src/content/promotions/`-ban, hogy az `ActivePromotion` komponens automatikusan az aktuálisan futó akciót mutassa a főoldalon.

### Mit építettünk

**Forrás**: `MonaStudio_Marketing_Kampanynaptar.xlsx` (5 munkalap, 26 ciklus)

**26 markdown akció** generálva Mónika hangján — egyenként:
- Frontmatter: `title`, `description`, `badge`, `serviceSlug`, `discountPercent`, `startsAt`, `endsAt`, `showOnHomepage`, `heroImageUrl`, `ctaText`, `ctaUrl`, `sortOrder`
- Body: 800-1500 karakter Mónika hangján — leírás, "Kinek ajánlom", konkrét utógondozás, időzítés

### Akciók szezonális megoszlás

| Hónap | Ciklus | Cím | Kategória | Akció |
|---|---|---|---|---|
| ápr 21 - máj 4 | #01 | Tavaszi Frissítés | Arckezelés | −15% csomag |
| máj 5 - máj 18 | #02 | Anyák Napja | Komplex | Ajándékkártya −10% |
| máj 19 - jún 1 | #03 | Esküvői Szezon | Smink | −10% + ingyenes próba |
| jún 2 - jún 15 | #04 | Nyárra Készülünk | Gyantázás | 2 az 1-ért |
| jún 16 - jún 29 | #05 | Permanens Nyár | PMU | −5% + konzultáció |
| jún 30 - júl 13 | #06 | Nyári Szempilla | Műszempilla | −2.000 Ft |
| júl 14 - júl 27 | #07 | Uborkaszezon | Arckezelés | −20% hétköznap |
| júl 28 - aug 10 | #08 | Back to Beauty | Szemöldök | −1.500 Ft csomag |
| aug 11 - aug 24 | #09 | Szeptemberi Hangolás | Komplex | 2 kezelés csomag |
| aug 25 - szept 7 | #10 | Őszi PMU | PMU | Ingyenes konzultáció |
| szept 8 - 21 | #11 | Szempilla Ősz | Műszempilla | Refill −1.500 Ft |
| szept 22 - okt 5 | #12 | Őszi Mélyápolás | Arckezelés | −10% peptid csomag |
| okt 6 - okt 19 | #13 | Halloween Glamour | Smink | Csomag |
| okt 20 - nov 2 | #14 | November Frissítés | Gyantázás | 3. alkalom −50% |
| nov 3 - nov 16 | #15 | Karácsonyi PMU I. | PMU | −5% (utolsó esély) |
| nov 17 - nov 30 | #16 | Black Friday | Komplex | Ajándékkártya +10% |
| dec 1 - dec 14 | #17 | Karácsonyi Ragyogás | Smink | Csomag |
| dec 15 - dec 22 | #18 | Utolsó Helyek | Komplex | Express időpontok |
| jan 5 - jan 18 | #19 | Január Megújulás | Arckezelés | Ingyenes diagnózis |
| jan 19 - febr 1 | #20 | Valentin Ajándék | Komplex | Páros kártya −8% |
| febr 2 - febr 15 | #21 | Tavaszvárás | Szemöldök | Laminálás −10% |
| febr 16 - márc 2 | #22 | Farsang & Smink | Smink | Ingyenes konzultáció |
| márc 3 - márc 16 | #23 | Nőnapi Special | Komplex | 3 kezelés −12% |
| márc 17 - márc 30 | #24 | Húsvét Frissítés | Gyantázás | 2 zóna −10% |
| márc 31 - ápr 13 | #25 | Tavaszi PMU | PMU | −5% + konzultáció |
| ápr 14 - ápr 20 | #26 | Évforduló | Komplex | Törzsvendég −15% |

### Hogyan működik

Az `ActivePromotion.astro` komponens minden főoldal-megjelenéskor:
1. Lekéri az összes promotion markdown-t (`getCollection("promotions")`)
2. Szűr azokra ahol `showOnHomepage: true` ÉS `startsAt <= ma <= endsAt`
3. Sortolja `sortOrder` szerint, és **az első aktívat** mutatja
4. Ha nincs aktív akció, a komponens **nem renderelődik** (üres szekció helyett semmi)

### Technikai jellemzők

- **Service slug mapping** — minden akció kötődik egy szolgáltatás slug-hoz (kivéve "Komplex"), ezért a hero kép automatikus
- **Badge automatikus** — az `akcio_tipus` szövegéből parse-olódik ("−15%", "INGYEN", "AJÁNDÉK", "EXPRESS", "2 az 1-ért")
- **CTA URL mapping** — Időpontfoglalás → /idopontfoglalas, Ajándékkártya vásárlás → /ajandekkartya
- **Hero kép kategóriák** — Arckezelés, Smink, Gyantázás, PMU, Műszempilla, Szemöldök festés mind külön hero
- **Sortérend** — sortOrder mező a ciklus száma, így a #1 prioritás a #2 előtt (ha mindkettő aktív lenne)

### Brand alapelvek a tartalomban

- ✅ **Csendes** — nincs felkiáltó marketing, "nyugodt" hangú szövegek
- ✅ **Személyes** — Mónika első személyben, "én ajánlom", "nálam"
- ✅ **Természetes** — szezonális logika (őszi PMU, nyári lifting, téli mélyápolás)
- ✅ **Szakmai** — minden akciónál "Kinek ajánlom" / "Kinek nem ajánlom" szekciók

### Fájlok (új)
- 26 új markdown (`src/content/promotions/01-...` → `26-...`)
- A demo `szemoldok-tetovalas-bevezeto.md` törölve (helyét átveszi az #5 Permanens Nyár)

### Karbantartás

A naptár évente egyszer frissítendő. Ha új akció kell:
1. Új markdown a `src/content/promotions/`-ban
2. `startsAt` / `endsAt` dátumok megfelelően
3. `showOnHomepage: true` ha főoldalon mutatandó
4. Commit + push, és a Cloudflare auto-deploy után elérhető

---

## ✅ Sprint 2B (6. kör) — SEO optimalizáció + FB OAuth előkészítés

**Időszak**: 2026-04-26  
**Cél**: SEO és Lighthouse optimalizáció, FB Login előkészítés Sprint 4-re, dokumentáció napra-készség.

### Mit építettünk

**SEO optimalizáció**:
- **`@astrojs/sitemap` integráció** beépítve `astro.config.mjs`-be
  - Build közben automatikus `/sitemap-index.xml` és `/sitemap-0.xml` generálás
  - Filter-ek: `/admin/`, `/api/`, `/profil/`, `/bejelentkezes`, `/regisztracio` kihagyva
  - i18n hreflang map: hu-HU + en-US
  - Custom prioritások: főoldal 1.0 daily, szolgáltatás/blog 0.8 weekly, jogi oldalak 0.3 monthly
- **`package.json`** — `@astrojs/sitemap@^3.2.0` hozzáadva (npm install szükséges Cursor-ban!)

**LCP (Largest Contentful Paint) optimalizáció**:
- **BaseLayout új props**: `heroImage`, `heroImageMobile`
- **`<link rel="preload" as="image" fetchpriority="high">`** responsive media queries-vel:
  - `(max-width: 768px)` → mobile változat
  - `(min-width: 769px)` → desktop változat
- **Index.astro** — főoldal hero-main.webp + hero-480.webp preload aktív
- **Eredmény (becslés)**: LCP javul ~30-40% mobilon, mert a böngésző nem várja meg a HTML parse-t a kép letöltésével

**Facebook OAuth előkészítés**:
- **`env.d.ts`** — `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` env var típusok
- **`bejelentkezes.astro`** — Facebook gomb hozzáadva (disabled, Sprint 4-ben aktív lesz)
- **Sprint 4 terv** bővítve: API endpoint-ok `/api/auth/facebook`, `/api/auth/facebook-callback`
- **`customers` tábla**: `facebook_id` és `apple_id` mezők előre megtervezve a séma migrációk elkerüléséért

**Dokumentáció napra-készség**:
- `06-api-reference.md` — Sprint 4 OAuth endpoint-ok bővítve, FB Login követelmények szekció
- `07-deployment.md` — FACEBOOK_APP_ID/SECRET env vars, FB Redirect URI-k, Mailchimp env vars
- `08-sprint-log.md` — Sprint 4 leírás bővítve OAuth provider összehasonlító táblával
- `03-known-issues.md` — 5.1, 5.4, 5.5, 5.6, 5.7 SEO issue-k ✅ MEGOLDVA státuszra állítva

### Döntések

- **Apple Sign-In elhalasztva** — $99/év Apple Developer account, csak iOS app-hez kötelező; a Mónika célcsoport (25-50 nők, Vác+Budapest, magyar piac) Google + FB-vel 95%-ban lefedhető. A `customers` tábla `apple_id` mezőt előre tartalmazza, hogy később ne kelljen séma migráció.
- **`@astrojs/sitemap` Astro hivatalos integráció** — egyszerűbb mint manuális generálás; minden új oldal automatikusan bekerül a build során.
- **Hero preload csak ott ahol fontos** — nem minden oldalon, csak ahol valódi LCP kép van (most az index.astro). Más oldalakon a `PageHero` szöveges, így nincs preload-olandó kép.

### OAuth providerek összehasonlítás

| Provider | Mit ad | Költség | Magyar piac |
|---|---|---|---|
| **Google** | email, név, kép, locale | Ingyen | ✅ Mindenki használ |
| **Facebook** | email (ha hozzájárul), név, ID | Ingyen, App Review kell | ✅ Magas penetrate |
| **Apple** | email vagy proxy, név (csak 1× ad) | $99/év Developer | 🟡 Csak iPhone |
| **Email/jelszó** | nincs (mi tároljuk) | Ingyen | ✅ Mindenki tudja |

### Fájlok (új + módosítás)
- `astro.config.mjs` — sitemap integráció hozzáadva
- `package.json` — `@astrojs/sitemap@^3.2.0` dependency, verzió bump 0.5.2 → 0.5.3
- `src/layouts/BaseLayout.astro` — heroImage/heroImageMobile props + preload tag-ek
- `src/pages/index.astro` — heroImage prop megadva
- `src/pages/bejelentkezes.astro` — Facebook gomb hozzáadva
- `env.d.ts` — FB env vars típusok
- `docs/03-known-issues.md` — SEO státuszok frissítve
- `docs/06-api-reference.md` — FB OAuth endpoint-ok
- `docs/07-deployment.md` — FB env vars, redirect URI-k
- `docs/08-sprint-log.md` — Sprint 4 OAuth bővítve
- `docs/09-changelog.md` — v0.5.3 release

### Cursor teendő (push előtt)

```powershell
# A package.json-be új dependency került, ezért:
npm install
# vagy ha gyorsabb:
npm i --silent

# Aztán:
git add -A
git commit -m "Sprint 2B (6. kör) — SEO + FB OAuth előkészítés v0.5.3"
git push
```

---

## 🚧 Sprint 3 — Webshop (folyamatban)

**Cél**: Teljes webshop funkcionalitás: katalógus, termékoldal, kosár, pénztár.

### Eldöntött scope (2026-04-26)

| Téma | Döntés |
|---|---|
| **Termékek** | Régi rendszerből exportáljuk (KV `site_content` → új D1) |
| **Vendég/regisztrált** | Csak vendég Sprint 3-ban, regisztráció Sprint 4-ben |
| **Szállítás** | FoxPost 1.990 Ft / Személyes átvétel 0 Ft / 20.000 Ft fölött ingyen |
| **Szűrők** | Kategória + márka + ár csúszka (sweet spot) |
| **Email** | Resend (vendég + Mónika) + Mailchimp tag |
| **Fizetés** | Átutalás + utánvét (SimplePay Sprint 6-ban) |
| **Wishlist** | Sprint 4-ben (auth szükséges) — Sprint 3-ban kihagyjuk |

### Tervezett struktúra

**Sprint 3.1** — D1 séma + alapinfra ✅ (most)  
**Sprint 3.2** — Termékadatok migráció + webshop hub + kategória/márka oldalak  
**Sprint 3.3** — Termékoldal + kosár drawer  
**Sprint 3.4** — Pénztár + email + Mailchimp tag

---

## ✅ Sprint 3.1 — D1 séma + alapinfra

**Időszak**: 2026-04-26  
**Cél**: D1 séma a webshop-hoz, demo seed adatok, lib függvények.

### Mit építettünk

**D1 séma** (`migrations/0001_sprint3_webshop.sql`):
- `categories` — hierarchikus kategóriák (parent_id-val)
- `brands` — márkák (Eclado, Mesotica, London Beauty, Image Skincare)
- `products` — fő termék tábla minden szükséges mezővel:
  - Árazás (price_ft, sale_price_ft, sale_starts_at, sale_ends_at)
  - Készlet (stock_qty, low_stock_threshold)
  - Méret (size_value, size_unit)
  - SEO (meta_title, meta_description)
  - Megjelölések (is_featured, is_recommended, is_new)
  - Mónika ajánlása (`monika_recommends` mező az E-E-A-T-hez)
  - Skin types / concerns (Sprint 5+ szűrőkhöz)
- `product_images` — 1-N kapcsolat (több kép termékenként, is_primary jelzéssel)
- `orders` — vendég adatok közvetlenül a táblában (Sprint 3); customer_id NULL-ozható (Sprint 4-ben kötelező)
- `order_items` — freezeled árak (price_at_order_ft) hogy a rendelés ne változzon
- Triggerek `updated_at` automatikus frissítéshez minden fő tábláról

**Demo seed** (`migrations/0002_sprint3_seed_demo.sql`):
- 7 kategória (arckezeles, szerumok, hidratalok, tisztitas, napvedelem, szemkornyek, eszkozok)
- 4 márka (Eclado, Mesotica, London Beauty, Image Skincare)
- 8 demo termék Mónika hangú leírásokkal és **`monika_recommends`** mezővel
- Köztük 1 akciós termék (London Beauty hialuron por — −15%, Tavaszi Frissítés ciklus alatt)

**TypeScript típusok** (`src/lib/types/shop.ts`):
- `Product`, `Category`, `Brand`, `ProductImage` interface-ek
- `CartItem`, `CartSummary`, `Order`, `OrderItem`
- Helper függvények: `effectivePrice()`, `isOnSale()`, `discountPercent()`, `stockStatus()`
- Szállítási opciók: `SHIPPING_OPTIONS` (foxpost: 1990 Ft, personal: 0 Ft)
- `FREE_SHIPPING_THRESHOLD_FT = 20000`
- `ProductFilter`, `ProductSort` típusok

**Termék lekérdezések** (`src/lib/products.ts`):
- `listCategories()`, `getCategory()`
- `listBrands()`, `getBrand()`
- `listProducts(filter)` — szűrőkkel + lapozással + bulk enrichment (képek, kategória, márka)
- `getProduct(slug)` — egyedi termék minden kapcsolt adattal
- `listFeaturedProducts()`, `listOnSaleProducts()`
- `getPriceRange()` — ár csúszka min/max értékeihez

**wrangler.toml fixek**:
- ⚠️ **KV ID javítva**: `REPLACE_WITH_YOUR_KV_ID` → `b2da4e4639ec4141a4f0c91ab3c5e8b7`
- Új `[vars]` szekció Sprint 3 szállítási konstansokkal:
  - `SHIPPING_FOXPOST_FT = "1990"`
  - `SHIPPING_PERSONAL_FT = "0"`
  - `SHIPPING_FREE_THRESHOLD_FT = "20000"`
  - `ORDER_NOTIFICATION_EMAIL = "mona@monastudio.hu"`

**package.json scriptek**:
- `npm run db:migrate` — séma migrálás (remote D1)
- `npm run db:seed` — demo adatok feltöltése
- `npm run db:migrate:local` / `db:seed:local` — lokális teszthez

### Döntések

- **Vendég adatok közvetlenül az `orders` táblában** — `customer_id` NULL-ozható, így Sprint 3-ban nem kell külön `guests` tábla, és Sprint 4-től egyszerűen párosítjuk a regisztrált fiókokkal.
- **Freezeled árak az `order_items`-ben** — `price_at_order_ft` és `product_name` snapshot, így ha Mónika törli a terméket vagy árat változtat, **a régi rendelések nem változnak**.
- **Akció időzítés a `products` táblán belül** — `sale_price_ft` + `sale_starts_at` + `sale_ends_at` egy táblán, nem külön akciós tábla, mert egy termék egyszerre csak **egy akcióban** lehet (egyszerűbb logika).
- **Hierarchikus kategóriák** — `parent_id`, hogy később lehessen "Arckezelés > Szérumok > Anti-aging" struktúrát csinálni, de Sprint 3-ban csak top-level kategóriákkal indulunk.
- **Vendég ID NEM kerül a session-be** — minden checkout-nál újra megadja a vendég az adatait. Ez nem zavaró, mert a vendég jellemzően **havonta egyszer** vásárol, és a regisztrált fiók (Sprint 4) emlékszik az adatokra.

### Cursor teendő

```powershell
# 1. Behúzás Cursor-ba
# 2. NPM install (új dep nincs, csak biztos ami biztos)
npm install

# 3. Lokális D1 setup és teszt (opcionális):
npm run db:migrate:local
npm run db:seed:local
npm run dev
# Ellenőrizz: a wrangler dev D1 binding lokálban működik

# 4. Remote D1 séma migrálás:
npm run db:migrate

# 5. Demo adatok feltöltése:
npm run db:seed

# 6. Ellenőrzés
npx wrangler d1 execute monastudio-v2-db --remote --command "SELECT COUNT(*) AS c FROM products"
# Eredmény: 8 (a 8 demo termék)

# 7. Commit + push
git add -A
git commit -m "Sprint 3.1 — D1 webshop séma + demo seed v0.6.0

- migrations/0001_sprint3_webshop.sql (categories, brands, products, product_images, orders, order_items)
- migrations/0002_sprint3_seed_demo.sql (7 kategória + 4 márka + 8 termék)
- src/lib/types/shop.ts — TypeScript típusok
- src/lib/products.ts — D1 lekérdező függvények
- wrangler.toml KV ID javítva + Sprint 3 vars
- package.json db:migrate / db:seed scriptek
- Verzió: 0.5.3 → 0.6.0 (minor bump, Sprint 3 indítás)"
git push
```

### Fájlok (új)
- `migrations/0001_sprint3_webshop.sql` — séma
- `migrations/0002_sprint3_seed_demo.sql` — demo adatok
- `src/lib/types/shop.ts` — TS típusok
- `src/lib/products.ts` — D1 lekérdezők
- `wrangler.toml` — KV ID javítva + szállítási vars
- `package.json` — db scriptek + verzió bump 0.5.3 → 0.6.0

### Sprint 3.2 előtt

A **régi `monabeauty` rendszer KV exportja** szükséges (`site_content.json`) — ez a bemenet a tényleges termékadatok migrációjához. A `export-regi-termekek.ps1` scripttel megszerezhető.

---

## ✅ Sprint 3.2 (1. rész) — KRX termékek migráció + Footer Maps fix

**Időszak**: 2026-04-26  
**Cél**: A régi `site_content.json`-ből 8 KRX termék behozatala új D1 sémába, Mónika hangú rövid recommendation-ekkel, Footer Google Maps integráció.

### Mit építettünk

**Termékek migráció** (`migrations/0002_sprint3_seed_krx_products.sql`):
- Régi forrás: `site_content.json` → 8 KRX termék (Cica vonal: 4 db, Probiotic vonal: 4 db)
- 5 új kategória létrehozva (arclemosok, tonikok, szerumok, arckremek, csomagok)
- 1 márka: KRX (Korea, koreai professzionális szépségápolás)
- **A demo seed törölve** — KRX termékek a véglegesek

**Tartalom finomítás**:
- **`short_description` (max 120 karakter)** — kártyára optimalizált, frappáns leírások
- **`description`** — eredeti gyártói leírás, termékoldalon kibontva (markdown formázással kiemelt összetevőkkel)
- **`monika_recommends`** — **rövid, marketing-fókuszú** Mónika ajánlás:
  - **Bőrtípus** (érzékeny, rosaceás, dehidratált, stb.)
  - **Kombináció** (mivel + melyik kezeléssel hatásos)
  - **Mikor** (napszak, gyakoriság)
  - Példa: "Érzékeny, rosaceára vagy aknéra hajlamos bőrre. **Tökéletes párosa:** Cica Tonik utána, majd Cica Szérum vagy Krém. Arckezeléseim után is ezt javasolom."
- **Eltávolítva** a régi rendszer "minden termékhez ugyanaz" sablonszöveg

**Footer Google Maps integráció**:
- A `2600 Vác, Zrínyi Miklós u. 3.` cím **kattintható link** Google Maps-re
- Telefonszám is kattintható (`tel:` link)
- Hover effekt: warm tónusú szín + alulvonás
- A Google Business profilba **közvetlenül** vezet (`/maps/place/Mona+Studio/...`)

**db:seed script frissítve** az új SQL fájlra (`0002_sprint3_seed_krx_products.sql`)

### Termék áttekintés

**Cica vonal** (Centella Asiatica, érzékeny/rosaceás bőrre):
1. Cica Oxigenizáló 2 in 1 arclemosó — **7.750 Ft** / 50 ml
2. Cica Tonik — **7.050 Ft** / 50 ml
3. Cica Szérum — **6.050 Ft** / 15 ml
4. Cica Nappali Krém — **7.050 Ft** / 25 g

**Probiotic vonal** (mikrobiom-támogatás):
5. Probiotikus habzó arclemosó — **10.200 Ft** / 100 ml
6. Probiotikus tonik — **10.200 Ft** / 120 ml
7. Probiotic nappali krém — **11.990 Ft** / 50 g
8. Probiotic utazó készlet — **12.990 Ft** / 60 ml (3×20 ml)

### Döntések

- **Csak KRX márka** Sprint 3-ban — a régi rendszer is csak ezt használta. Új márkák Sprint 5-től (admin felületen).
- **Mónika ajánlás 2-3 mondatos** — marketing-fókusz, nem orvosi szöveg. A részletes orvosi információ a `description`-ben (gyártói).
- **Hierarchikus kategóriák Sprint 5-től** — most flat struktúra (arclemosok, tonikok, szerumok, arckremek, csomagok)
- **Képek**: a régi `images/products/krx-cica-...webp` útvonalak már be vannak állítva. A tényleges képeket Mónika tudja feltölteni (manuálisan a `public/images/products/`-ba most, R2-be Sprint 5-től).

### Cursor teendő

```powershell
# 1. Behúzás
# 2. (Opcionálisan) régi képek átmásolása:
cp ../monabeauty/images/products/*.webp public/images/products/

# 3. Remote D1 séma + adatok feltöltése:
npm run db:migrate
npm run db:seed

# 4. Ellenőrzés:
npx wrangler d1 execute monastudio-v2-db --remote --command "SELECT name, price_ft FROM products"

# 5. Deploy + commit
npm run deploy
git add -A && git commit -m "Sprint 3.2 (1. rész) — KRX termékek + Footer Maps fix v0.6.1"
git push
```

### Fájlok (új + módosítás)
- `migrations/0002_sprint3_seed_krx_products.sql` (új) — KRX termékek
- `migrations/0002_sprint3_seed_demo.sql` (törölve) — régi demo
- `src/components/common/Footer.astro` — Google Maps link
- `package.json` — db:seed új fájlra, verzió 0.6.0 → 0.6.1

---

## ✅ Sprint 3.2 (2. rész) — Webshop oldalak

**Időszak**: 2026-04-26  
**Cél**: Webshop frontend — hub, kategória, márka oldalak ProductCard komponenssel és szűrőkkel.

### Mit építettünk

**Új komponensek** (`src/components/shop/`):
- **`ProductCard.astro`** — termék kártya:
  - Brand C tervezés: tört bézs alap, finom borderek, hover effekt (translateY + scale a képen)
  - Badge-ek: akció (`−15%` patina sale szín), új (`Új` zöld), Mónika ajánlja (warm arany)
  - 4:5 aspektrátió kép (object-fit: contain — a koreai termékek hosszúkás flakónjai kontextusban)
  - 3 soros line-clamp a `short_description`-ra
  - Akciós ár: piros + áthúzott eredeti
  - Készlet státusz: csak ha low/out of stock
  - Méret jelölő (50 ml, 25 g)
- **`FilterPanel.astro`** — szűrő oldalsáv:
  - Kategória + Márka lista
  - Ár szűrő (min/max input + "Alkalmaz" gomb)
  - Rendezés select (auto-submit)
  - Sticky pozíció desktop-on, mobile-on statikus
  - **Hide opciók**: `hideCategoryFilter` (kategória oldalon), `hideBrandFilter` (márka oldalon)
  - **URL state**: minden szűrő search params-ban — canonical-friendly és megosztható

**Új oldalak**:
- **`/webshop`** (hub) — 4 szekció:
  - Akciós termékek (csak ha van legalább 1)
  - Kiemelt termékek ("Mónika ajánlja — Kezdő válogatás")
  - Kategória tile-ok (5 kategória: arclemosok, tonikok, szerumok, arckremek, csomagok)
  - Márka tile-ok (most csak KRX)
  - Szállítási info CTA blokk (személyes átvétel + FoxPost magyarázat)
- **`/webshop/[kategoria]`** — kategória oldal:
  - Bal: FilterPanel (kategóriát rejtve)
  - Jobb: ProductCard grid + lapozás (24/oldal)
  - Üres állapot kezelés
- **`/webshop/markak/[marka]`** — márka oldal:
  - Márka bemutatás szekció (a KRX leírás markdown bold-okkal)
  - Bal: FilterPanel (márkát rejtve, kategóriát mutatva)
  - Jobb: ProductCard grid + lapozás

**Új API**:
- **`GET /api/products`** — szűrésekkel + lapozással:
  - Query params: `kategoria`, `marka`, `ar`, `sort`, `keres`, `akcios`, `page`, `per_page`
  - Validáció: max 100 termék/oldal, min 1
  - Válasz: `{ products, total, page, perPage, totalPages }`

### Döntések

- **URL-állapot a szűrőkhöz** — nem JS-driven kliens oldal, hanem klasszikus form submit + URL params:
  - **Előny**: canonical, megosztható, browser back/forward működik, SEO-barát, JS nélkül is működik
  - **Hátrány**: minden szűrésnél új lapbetöltés
  - **Kompromisszum**: ár szűrőhöz "Alkalmaz" gomb (ne triggerelje minden gépeléskor); a sort dropdown auto-submit
- **`object-fit: contain`** + padding a termék kártyákon — a koreai termékek hosszúkás flakónjai így kontextusban jelennek meg
- **Mónika ajánlja badge nem mutatkozik ha akció vagy új jelölés is van** — vizuális zaj minimalizálás
- **Kategória oldalon kategória szűrő rejtve** (és márka oldalon márka szűrő) — már szűrtünk arra, de a másikra szabadon szűrhet
- **24 termék/oldal** — annyi mint amennyi egy néző session alatt áttekinthető. Ha valaha 50+ termék lesz, érdemes lehet 12-re csökkenteni.

### Teszt URL-ek (deploy után)

```
/webshop                                    — hub
/webshop/szerumok                           — Szérumok kategória (4 termék)
/webshop/szerumok?marka=krx                 — Szérumok + KRX (még mindig 4)
/webshop/szerumok?ar=5000-10000             — Szérumok + ár szűrés
/webshop/szerumok?sort=price_asc            — Szérumok + ár növekvő
/webshop/markak/krx                         — KRX márka (8 termék)
/webshop/markak/krx?kategoria=arckremek     — KRX + arckrémek (2 termék)
/api/products                               — összes 8 termék JSON
/api/products?akcios=1                      — csak akciós termékek
```

### Cursor teendő

```powershell
# 1. Behúzás
# 2. Ellenőrzés: D1-ben vannak-e termékek?
npx wrangler d1 execute monastudio-v2-db --remote --command "SELECT COUNT(*) FROM products"
# Ha nincs 8 → npm run db:reseed

# 3. Lokális teszt (KÖTELEZŐ a deploy előtt — ellenőrizni hogy nincs SSR error):
npm run dev
# Nyisd meg: http://localhost:4321/webshop
# Kattints kategóriákra, márkára, próbáld a szűrőket

# 4. Build:
npm run build
# Ha sikeres → deploy:
npm run deploy

# 5. Commit
git add -A
git commit -m "Sprint 3.2 (2. rész) — Webshop oldalak v0.6.4

- ProductCard komponens (4:5 arány, 3 badge típus, akciós ár, készlet)
- FilterPanel (kategória + márka + ár csúszka + rendezés, URL state)
- /webshop hub (akciós + kiemelt + kategóriák + márkák + szállítási info)
- /webshop/[kategoria] szűrőkkel + lapozással
- /webshop/markak/[marka] márka bemutatással + szűrőkkel
- /api/products GET endpoint (szűrés, lapozás, validáció)"
git push
```

### Fájlok (új)
- `src/components/shop/ProductCard.astro` (új)
- `src/components/shop/FilterPanel.astro` (új)
- `src/pages/api/products/index.ts` (új)
- `src/pages/webshop/index.astro` (új)
- `src/pages/webshop/[kategoria].astro` (új)
- `src/pages/webshop/markak/[marka].astro` (új)
- `package.json` — verzió 0.6.3 → 0.6.4

### Sprint 3.3 előtt

A frontend "böngészés" rész kész — most jön a **vásárlási folyamat**:
- Termékoldal (`/webshop/termek/[slug]`) — galéria, részletes leírás, INCI, használat, kosárba gomb
- Kosár drawer (oldalsó panel)
- localStorage-ban kosár állapot (vendég módban)
- Mennyiség módosítás, törlés
- "Tovább a pénztárhoz" CTA

---

## ✅ Sprint 3.3 — Termékoldal + kosár drawer + /kosar

**Időszak**: 2026-04-26  
**Cél**: Vásárlási folyamat első fele — termékoldal részletekkel, localStorage-alapú kosár, oldalsó drawer, full page kosár nézet.

### Mit építettünk

**Termékoldal** (`src/pages/webshop/termek/[slug].astro`):
- **Kép galéria**: fő kép + thumbnail-ok ha több kép van
- **Akció / Új / Mónika ajánlja badge** (csak egy egyszerre)
- **Tartalom oldal**:
  - Márka link (vissza a márka oldalra)
  - Termék név (clamp 28-40 px)
  - Rövid leírás (lead)
  - Ár (akciós: piros + áthúzott eredeti + −% badge)
  - Méret (50 ml / 25 g / stb.)
  - Készlet státusz színes pill (raktáron / kevés / nincs)
  - **Mónika ajánlása blokk** — patina arany bal border, italic szöveg, **bold** kiemelésekkel
  - Kosárba blokk: mennyiség választó (− qty +) + kosárba gomb
  - Szállítási mini info (személyes átvétel + FoxPost + 20.000 Ft fölött ingyen)
- **Tabs (3 fül)**:
  - Leírás (gyártói teljes leírás markdown formázással)
  - Összetevők (INCI lista monospace fontban + figyelmeztetés)
  - Használat (használati útmutató)
- **Kapcsolódó termékek** szekció (ugyanaz a kategória, max 4, kivéve self)
- **Schema.org Product JSON-LD** SEO-hoz

**Új API**:
- **`GET /api/products/[slug]`** — egy termék lekérés (a kosárba gomb friss adatokkal dolgozik)

**Kosár logika átdolgozás** (`src/lib/cart.ts`):
- `CartItem` interface átírva `shop.ts` típusokra (`productId`, `slug`, `priceAtAddFt`, `maxQty`, `brandName`)
- **localStorage kulcs változott**: `mona_cart` → `mona_cart_v2` (séma váltás miatt friss kezdés)
- `getShippingMethod()` / `setShippingMethod()` — a kosár "emlékszik" mit választott
- `getCartSummary()` — összegzés szállítási költséggel együtt
- `addToCart` — készlet ellenőrzéssel (stockQty cap), `capped` jelzéssel toast-ban
- Custom események: `mona-cart-update`, `mona-cart-open`

**`CartDrawer` komponens** (`src/components/shop/CartDrawer.astro`):
- Right-side slide-in (transform: translateX(100%) → 0)
- Backdrop (rgba(44,41,38,0.4)) + body scroll lock
- Esc + click-outside bezárás
- 3 állapot: üres / tartalmas / loading
- Tételek: kép + márka + név + qty controls + ár + eltávolítás
- Szállítási mód radio (FoxPost / Személyes átvétel)
- Összegzés: subtotal + shipping + total
- **Free shipping progress bar** — ha >0 de <20.000 Ft, mutatja mennyit kell még; 20.000 Ft fölött "✓ Ingyenes szállításra jogosult!"
- "Tovább a pénztárhoz" CTA + "Kosár megtekintése" link

**Header bővítés**:
- A meglévő kosár ikon a `data-cart-trigger` data attribute-tel
- Click → drawer megnyitás (preventDefault)
- Ctrl/Cmd-klikk + középső gomb klikk → engedi a `/kosar` navigációt új fülbe
- Counter a `mona-cart-update` event-re reagál

**`/kosar` full page**:
- Üres állapot: kosár ikon + "A kosarad üres" + CTA `/webshop`-ra
- Tartalmas állapot: 2 oszlop (termékek balra, summary jobbra sticky)
- Item layout: kép + info + qty controls + total/eltávolítás (mobil: stacked)
- Sticky összegző panel jobb oldalt asztalon
- "Tovább a pénztárhoz" + "Vásárlás folytatása" linkek
- Free shipping progress bar
- **`noindex`** — a kosár oldal ne kerüljön a Google indexébe

**`BaseLayout` bővítés**:
- `CartDrawer` import + render Footer után — minden oldalon elérhető

### Döntések

- **Két nézet (drawer + page)**: a drawer **gyors interakciót** ad (kosárba kattintás után azonnal mutatja), a `/kosar` oldal a **részletes nézetet**. Ctrl/Cmd-klikk → új fül a `/kosar`-ra (ez **a Header link miatt** működik default-ként, csak az alap-klikk megakadályozva)
- **localStorage kulcs `mona_cart_v2`**: a régi `mona_cart` kulcsban tárolt adatok séma-inkompatibilisek (a régi cart.ts-ben más struktúra volt). A v2 verzióval **a régi kosár tartalmak nem érvényesek** — ez nem probléma, mert még nem volt élő vásárlás
- **Free shipping progress bar**: pszichológiai motivátor — a 20.000 Ft küszöbnél vizuálisan látja "még X Ft" — emeli az átlag rendelési értéket
- **Sticky summary** asztali nézetben — a vásárló **mindig látja** mire kattint a "Tovább a pénztárhoz" gomb
- **Schema.org Product JSON-LD**: termékek a Google Shopping-ban is megjelenhetnek (Sprint 6 Google Merchant feed előkészítés)

### Cursor teendő

```powershell
# 1. Behúzás (10 új/módosított fájl)
# 2. NPM install — nincs új dep, de újra építjük a node_modules-t
npm install

# 3. Lokális teszt — kritikus
npm run dev
# Ellenőrzés:
#   ✓ /webshop/termek/krx-cica-szerum — termékoldal megjelenik
#   ✓ Galéria thumbnail-ok cserélik a fő képet (ha több is van)
#   ✓ Tabok (Leírás / Összetevők / Használat) működnek
#   ✓ Mennyiség − / + gombok
#   ✓ Kosárba gomb → drawer kinyílik
#   ✓ Header kosár ikon klikk → drawer kinyílik (ne menjen a /kosar-ra)
#   ✓ Header kosár ikon Ctrl+klikk → új fülben /kosar nyílik
#   ✓ Drawer-ben qty − / + + eltávolítás
#   ✓ Szállítási mód radio (FoxPost / Személyes)
#   ✓ Free shipping progress: ha 5000 Ft → "Még 15.000 Ft..."
#   ✓ /kosar oldal megjelenik tartalmasan
#   ✓ Esc + backdrop klikk bezárja a drawer-t
#   ✓ Mobile (DevTools): drawer full screen panel

# 4. Build:
npm run build
# Sitemap-be a /webshop/termek/{slug} ne kerüljön be — várt!

# 5. Deploy:
npm run deploy

# 6. Élesben próba: rakj be 1-2 terméket, ellenőrizd hogy a localStorage perzisztens

# 7. Commit
git add -A
git commit -m "Sprint 3.3 — Termékoldal + kosár drawer + /kosar v0.7.0

- Termékoldal: galéria + tartalom + tabs + kapcsolódó termékek + Schema.org
- /api/products/[slug] GET endpoint
- cart.ts átdolgozás (shop.ts típusok, mona_cart_v2)
- CartDrawer: oldalsó panel, free shipping progress, szállítási mód
- Header: kosár ikon klikk → drawer (Ctrl+klikk → /kosar)
- /kosar full page nézet (2 oszlop, sticky summary)
- BaseLayout: CartDrawer integrálva minden oldalra
- Verzió: 0.6.4 → 0.7.0 MINOR (új user flow: vásárlási folyamat)"
git push
```

### Fájlok (új + módosítás)

**Új**:
- `src/pages/webshop/termek/[slug].astro`
- `src/pages/api/products/[slug].ts`
- `src/pages/kosar.astro`
- `src/components/shop/CartDrawer.astro`
- `src/components/shop/CartIcon.astro` (jelenleg nem használjuk — a Header-be a meglévő gombot bővítettük)

**Módosítás**:
- `src/lib/cart.ts` — átdolgozva shop.ts típusokra
- `src/components/common/Header.astro` — kosár ikon → drawer trigger, counter sync
- `src/layouts/BaseLayout.astro` — CartDrawer import + render
- `package.json` — verzió 0.6.4 → 0.7.0

### Sprint 3.4 előtt

A vásárlási folyamat **első fele kész**. Hátralévő:
- `/penztar` checkout oldal (vendég adatok, szállítás, fizetés)
- `POST /api/checkout` — rendelés létrehozás D1-ben
- Resend email a vendégnek + Mónikának
- Mailchimp tag automatikus (`vasarlas-YYYY-MM` + `vasarolt-{slug}`)
- `/penztar/koszonjuk` — sikeres rendelés visszaigazolás

---

## ⏳ Sprint 3.4 — Pénztár + email + Mailchimp tag

**Tervezett építés**:
- `/penztar` — checkout form (vendég adatok, szállítási cím, fizetési mód)
- `POST /api/checkout` — D1 order + order_items insertion
- Order number generálás: `MS-2026-0001` formátum
- Resend email vendégnek (megerősítés + sorszám)
- Resend email Mónikának (új rendelés értesítés)
- Mailchimp tag: `vasarlas-2026-04` + `vasarolt-{slug}` minden tételhez
- `/penztar/koszonjuk?rendeles=MS-2026-0001` — sikeres oldal

---

## ✅ Sprint 3.2 (1. rész — javítások v0.6.2)

**Időszak**: 2026-04-26  
**Cél**: A 0.6.1 release után felmerült 3 probléma javítása + 7 termékkép behelyezése.

### 1. `@astrojs/sitemap` build crash javítás

**Probléma**: Az `^3.2.0` caret verzió a npm install során **3.7.1**-et hozott le, ami **SSR módban (`output: "server"`) crash-el** a `_routes` undefined miatt:

```
Cannot read properties of undefined (reading 'reduce')
```

**Megoldás kettős védelem**:

1. **Pin pontos verzióra**: `"@astrojs/sitemap": "3.6.0"` (utolsó stabil 3.7.x előtti, lásd GitHub issue #15894)
2. **`patch-package`** telepítve **védőhálóként** — `patches/@astrojs+sitemap+3.7.2.patch` készenlétben, hogy ha valaki valaha frissítené 3.7.x-re, a `(_routes ?? []).reduce` javítás automatikusan ráfusson `npm install` után (`postinstall` hook).

A `patches/` mappa README-vel — Cursor-ban szükség esetén regenerálható a tényleges patch (`npx patch-package @astrojs/sitemap`).

### 2. Idempotens `db:seed` SQL

**Probléma**: A `0002_sprint3_seed_krx_products.sql` második futtatása **UNIQUE constraint hiba**val, vagy duplikált sorokkal végződött.

**Megoldás**:
- **Kategóriák, márkák**: `INSERT OR IGNORE INTO ...` — ha létezik, nem dob hibát
- **Termékek**: `INSERT OR REPLACE INTO ...` — ha létezik a slug, felülírja a tartalommal (megőrzi az ID-t, így a `product_images` FK-k működnek)
- **Termék képek**: először `DELETE` a slug-prefixre, aztán `INSERT` — biztonságos, mert ezek nincsenek máshol hivatkozva

**Új SQL**: `migrations/9999_reset_seed_data.sql` — **csak a seed adatokat törli** (`categories`, `brands`, `products`, `product_images`). Az `orders` és `order_items` táblákat **NEM érinti**, és az `order_items.product_id`-t NULL-ra állítja a snapshot mezők (`product_slug`, `product_name`) megőrzésével.

**Új scriptek**:
- `npm run db:reset` / `db:reset:local` — csak a seed táblák ürítése
- `npm run db:reseed` / `db:reseed:local` — `db:reset` + `db:seed` egyben (tiszta újratöltés)

### 3. Termékképek elhelyezve (7/8)

**`public/images/products/`** mappába behelyezve a Mónika által feltöltött 7 KRX termékkép:
- `krx-cica-2in1-arclemoso.webp` (12 KB)
- `krx-cica-tonik.webp` (12 KB)
- `krx-cica-szerum.webp` (12 KB)
- `krx-cica-nappali-krem.webp` (12 KB)
- `krx-probiotikus-arclemoso.webp` (14 KB)
- `krx-probiotic-tonik.webp` (10 KB)
- `krx-probiotic-nappali-krem.webp` (12 KB)

**Hiányzik**: a **Probiotic utazó készlet** (#8 termék) képe — egyelőre kép nélkül jelenik meg. A frontend komponensekbe (Sprint 3.2 2. rész) **default placeholder** ikont teszünk olyan termékekhez, ahol nincs `is_primary` kép.

A SQL is frissítve: a 8. termék képét eltávolítottuk a SEED-ből (placeholder URL helyett semmi).

### Cursor teendő push előtt

```powershell
# 1. Behúzás
# 2. NPM install — KÖTELEZŐ! Új dep: patch-package
npm install
# A postinstall hook automatikusan lefut. Ha warning-ot ír a 3.7.2 patch-ről,
# az NORMÁL — pinneltünk 3.6.0-ra, a patch csak biztonsági fallback.

# 3. (Opcionális) Lokális teszt:
npm run db:reseed:local
npm run dev

# 4. Remote tiszta újratöltés (törli a 8 régi terméket és újrarakja idempotensen):
npm run db:reseed

# 5. Build ellenőrzés (kritikus — sitemap nem szabad hogy crash-eljen):
npm run build

# 6. Ha a build sikeres → deploy:
npm run deploy

# 7. Commit
git add -A
git commit -m "Sprint 3.2 (1. rész javítás) — sitemap fix + idempotens seed + KRX képek v0.6.2

- @astrojs/sitemap pin 3.6.0 (build crash fix SSR módban)
- patch-package telepítve (postinstall hook + patches/)
- Idempotens db:seed (INSERT OR IGNORE / REPLACE)
- db:reset + db:reseed scriptek
- 7/8 KRX termékkép a public/images/products/-ba"
git push
```

### Fájlok (új + módosítás)
- `package.json` — sitemap pin 3.6.0, patch-package dep, postinstall hook, reset/reseed scriptek
- `patches/README.md` (új)
- `patches/@astrojs+sitemap+3.7.2.patch` (új — biztonsági fallback)
- `migrations/0002_sprint3_seed_krx_products.sql` — idempotensre átírva
- `migrations/9999_reset_seed_data.sql` (új) — biztonságos reset
- `public/images/products/krx-*.webp` — 7 termékkép behelyezve
- Verzió bump: `0.6.1` → `0.6.2` (patch — bugfix)

---

## ⏳ Sprint 4 — Ügyfél törzs (auth)

**Cél**: Regisztráció, bejelentkezés (email+jelszó, Google OAuth, Facebook Login), profil oldal.

### Tervezett építés

**D1 séma:**
- `customers` (id, email, password_hash, google_id, **facebook_id**, **apple_id**, created_at, ...)
- `customer_sessions`
- `customer_addresses` (címkönyv)

**Új oldalak:**
- `/profil` — szerkesztés
- `/profil/rendelesek` — rendelési előzmények
- `/profil/cimek` — címkönyv
- `/profil/kivansaglista` — wishlist (összevonva a Sprint 3-mal)

**Új API endpointok:**
- `/api/auth/register`, `/login`, `/logout`
- `/api/auth/google`, `/google-callback`
- **`/api/auth/facebook`, `/facebook-callback`** ✨ ÚJ
- ~~`/api/auth/apple`~~ — elhalasztva Sprint 7+ vagy iOS app esetén
- `/api/profile` (GET, PATCH)
- `/api/profile/orders` (GET)
- `/api/profile/addresses` (GET, POST, DELETE)

### OAuth providerek — összehasonlítás

| Provider | Mit ad | Költség | Magyar piac |
|---|---|---|---|
| **Google** | email, név, kép, locale | Ingyen | ✅ Mindenki használ |
| **Facebook** | email (ha hozzájárul), név, ID | Ingyen, App Review kell | ✅ Magas penetrate |
| **Apple** | email vagy proxy, név (csak 1× ad) | $99/év Developer | 🟡 Csak iPhone |
| **Email/jelszó** | nincs (mi tároljuk) | Ingyen | ✅ Mindenki tudja |

**Cloudflare env vars** Sprint 4-ben:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (már megvan)
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` (új)

### Apple Sign-In későbbre (opcionális)

Ha valaha **iOS app**ot készítenénk a App Store-ra, **akkor kötelező** az Apple Sign-In a többi social login mellett. Most **kihagyjuk**, mert:
- Az Apple Developer Account **$99/év**
- A Mónika célcsoport (25-50 nők, Vác): Google + FB lefedi 95%-át
- Apple JWT (ES256) bonyolultabb mint a Google/FB OAuth

A `customers` tábla **`apple_id` mezőt** előre létrehozzuk hogy ne kelljen séma-migrációt csinálni később.

### Hírlevél ↔ regisztráció összekapcsolás (új — v0.6.3)

**Koncepció**: Mónika havi naplója (Mailchimp newsletter) **nem előfizetés**, **nem premium** — szakmai tartalom, bárki feliratkozhat. **Ha egy regisztrált felhasználó email címe már a Mailchimp listán van**, automatikusan jutalmazzuk:

**Sprint 4-ben implementálandó logika** (`/api/auth/register` és OAuth callback-ek):

```typescript
// Sprint 4 — registration flow
async function onUserRegister(email: string) {
  // 1. Customer rekord létrehozás D1-ben
  const customerId = await createCustomer({ email, ... });

  // 2. Mailchimp lekérdezés — már fel van-e iratkozva?
  const memberHash = md5(email.toLowerCase());
  const url = `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members/${memberHash}`;

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${btoa(`anystring:${API_KEY}`)}` }
  });

  if (res.ok) {
    // Már feliratkozott a havi naplóra → "registered" tag hozzáadás
    const data = await res.json();
    await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Basic ${btoa(`anystring:${API_KEY}`)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tags: [...data.tags.map(t => t.name), "registered"]
      })
    });

    // Plusz: első rendelés kedvezmény vagy bonusz a customers táblába
    await markCustomerAsNewsletterMember(customerId);
  } else if (res.status === 404) {
    // Nincs még a listán — ajánljuk fel a regisztráció során
    // (a register form-ban egy checkbox: "Igen, küldjétek a havi naplót")
  }
}
```

**Mailchimp tagek struktúra**:
- `website-signup` — alapszintű (minden feliratkozónak)
- `website-footer` / `popup-modal` / `signup-form` — forrás-jelölő (forrás követésért)
- `registered` — Sprint 4-ben aktív, a regisztrált fiókkal egyező email
- `vasarlas-YYYY-MM` — Sprint 3.4-ben adódik a checkout után (havi szegmentáció)
- `vasarolt-<termék-slug>` — termék-specifikus retargeting (pl. `vasarolt-krx-cica-szerum`)

**`customers` tábla bővítés** Sprint 4-ben (megelőző mezők):
- `is_newsletter_member BOOLEAN DEFAULT 0` — flag a hírlevél tagsághoz
- `newsletter_joined_at TEXT` — mikor iratkozott fel (ha későbbi, regisztráció után jön)

**Mit jutalmazunk**:
- **Első rendelés -10%** ha a regisztráció előtt már newsletter tag volt (= már bízott Mónikában)
- **Korai hozzáférés** új termékekhez — pl. KRX új formula 2 héttel hamarabb mint nyilvános indulás
- **Próbatermék** — alkalmanként a rendelés mellé (Sprint 5-ben az admin tudja jelölni mikor legyen)

A pontos kedvezmény értékek és a jutalom-logika **Sprint 4-ben véglegesedik** Mónika döntése alapján.

---

## ⏳ Sprint 5 — Admin (Mónika)

**Cél**: Admin felület termékkezeléshez, ügyfélkezeléshez, rendelés kezeléshez.

### Tervezett építés

**Új oldalak:**
- `/admin` — dashboard (statisztikák)
- `/admin/termekek` — termékkezelő R2 képfeltöltővel
- `/admin/ugyfelek` — ügyfélkezelő (Mónika privát jegyzeteivel)
- `/admin/rendelesek` — rendelés kezelő
- `/admin/akciok` — akció kezelő
- `/admin/setmore` — Setmore unified activity
- `/admin/hulyseg` — hűségpont rendszer

**Új API endpointok**: lásd `06-api-reference.md`

---

## ⏳ Sprint 6 — Integrációk + AI

**Cél**: FoxPost, GLS, Setmore, Anthropic chatbot, AI termék import.

### Tervezett építés

- FoxPost csomagautomata API integráció (átemelés a régiből)
- GLS házhozszállítás API
- Setmore időpontfoglalás (refresh token + KV cache)
- Anthropic Claude chatbot Astro komponensbe
- AI termék import: PDF számla → JSON struktúrált adat
- Google Merchant Center feed
- DeepL automatikus fordítás (HU → EN)

---

## ⏳ Sprint 7 — Cutover (élesítés)

**Cél**: V2 átállítása production-ba, régi rendszer backup.

### Lépések

1. Final adat szinkron (D1 export/import)
2. R2 képek átmásolása (régi → új bucket)
3. DNS váltás `monastudio.hu` → V2
4. Régi `monabeauty` projekt → `legacy.monastudio.hu`
5. Google OAuth Client redirect URI frissítés
6. Monitoring 1 hét
7. 6 hónap után legacy törlése

---

## Sprint összesítő

| Sprint | Időszak | Státusz | Új fájlok |
|---|---|---|---|
| Sprint 1 | 2026-04-25 | ✅ Kész | 30+ |
| Sprint 2A | 2026-04-25 | ✅ Kész | 8 új + 5 módosítás |
| Sprint 2B (1. kör) | 2026-04-26 | ✅ Kész | 13 új + 3 módosítás |
| Sprint 2B (2. kör) | 2026-04-26 | ✅ Kész | 11 új |
| Sprint 2B (3. kör) | 2026-04-26 | ✅ Kész | 19 új |
| Sprint 2B (4. kör) | 2026-04-26 | ✅ Kész | 8 átírás |
| Sprint 2B (5. kör) | 2026-04-26 | ✅ Kész | 26 új akció |
| Sprint 2B (6. kör) | 2026-04-26 | ✅ Kész | SEO + FB előkészítés |
| Sprint 3.1 | 2026-04-26 | ✅ Kész | D1 séma + demo seed |
| Sprint 3.2 (1. rész) | 2026-04-26 | ✅ Kész | KRX termékek + Footer Maps |
| Sprint 3.2 (1. fix) | 2026-04-26 | ✅ Kész | sitemap+seed fix + képek |
| Hírlevél újrapozícionálás | 2026-04-26 | ✅ Kész | "Mónika havi naplója" |
| Sprint 3.2 (2. rész) | 2026-04-26 | ✅ Kész | Webshop hub + kategória + márka |
| Sprint 3.3 | 2026-04-26 | ✅ Kész | Termékoldal + kosár drawer + /kosar |
| Sprint 3 | TBD | ⏳ | 25+ |
| Sprint 4 | TBD | ⏳ | 15+ |
| Sprint 5 | TBD | ⏳ | 30+ |
| Sprint 6 | TBD | ⏳ | 20+ |
| Sprint 7 | TBD | ⏳ | minimal |

---

## Karbantartás

Minden sprint végén ezt a dokumentumot frissítjük:

1. **Sprint kezdetén**: új sprint szekció létrehozása "⏳" státusszal
2. **Sprint közben**: "🟡 Folyamatban" státusz + részletek folyamatosan
3. **Sprint végén**: "✅ Kész" + összegzés
4. **Frissítés a `09-changelog.md`-ben** is — gépi olvashatóan

---

## Kapcsolódó dokumentumok

- [09-changelog.md](./09-changelog.md) — verziónapló (semver)
- [04-v2-migration-plan.md](./04-v2-migration-plan.md) — átfogó projekt terv
