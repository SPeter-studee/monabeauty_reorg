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

## ⏳ Sprint 3 — Webshop

**Cél**: Teljes webshop funkcionalitás: katalógus, termékoldal, kosár, pénztár, wishlist.

### Tervezett építés

**D1 séma:**
- `products` (lásd `05-product-schema.md`)
- `categories`
- `brands`
- `cart_items` (vagy localStorage-ban + D1 sync)
- `wishlist`
- `orders`
- `order_items`

**Új oldalak:**
- `/webshop` — hub szűrőkkel (kategória, márka, ár)
- `/webshop/[kategoria]` — kategória oldal
- `/webshop/termek/[slug]` — egyedi termékoldal
- `/kosar` — kosár oldal
- `/penztar` — pénztár (vendég / login)
- `/kivansaglista` — wishlist (auth szükséges)

**Új komponensek:**
- `ProductCard.astro`
- `FilterPanel.astro`
- `Cart.astro`
- `CheckoutForm.astro`

**Új API endpointok:**
- `/api/products` (GET — szűrés, lapozás)
- `/api/products/[slug]` (GET)
- `/api/cart` (GET / POST)
- `/api/checkout` (POST)
- `/api/wishlist` (GET / POST / DELETE)

---

## ⏳ Sprint 4 — Ügyfél törzs (auth)

**Cél**: Regisztráció, bejelentkezés (email+jelszó és Google OAuth), profil oldal.

### Tervezett építés

**D1 séma:**
- `customers` (id, email, password_hash, google_id, created_at, ...)
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
- `/api/profile` (GET, PATCH)
- `/api/profile/orders` (GET)
- `/api/profile/addresses` (GET, POST, DELETE)

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
