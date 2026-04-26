# 09 — Verziónapló (Changelog)

A Mona Studio V2 projekt változásnaplója. [Keep a Changelog](https://keepachangelog.com/) formátumot követi, [Semantic Versioning](https://semver.org/) szerint.

---

## [Unreleased]

### Hozzáadás tervezett
- _Sprint 4 — Ügyfél törzs (auth)_

---

## [0.7.8] — 2026-04-27 — Pénztár + kosár + header mobile redesign

> **Folytatása a v0.7.3–v0.7.6 UI csiszolási hullámnak** (lásd a verziókat alább).
> A v0.7.6-ban bevezetett `hide-tablet` logika valójában nem működött (specificitás
> ütközés a `.btn` osztállyal) — itt javítjuk véglegesen, és a mobile menüt
> drawer-ből dropdown overlay-re alakítjuk.

### Javítva
- **Pénztár — GDPR checkbox layout**:
  - A `.form-checkbox` `<span>` szövege a globális `reset.css` `label` szabálya miatt
    nagybetűsen + szétfolyt letter-spacing-gel jelent meg ("ELOLVASTAM ÉS ELFOGADOM
    AZ ÁSZF...")
  - Fix: explicit `text-transform: none` + `letter-spacing: normal` mind a `.form-checkbox`
    label-en, mind a belső `> span`-en (védőháló)
  - Checkbox méret egységesítve a v0.7.5 standardra: 18×18px (mint a radio gombok)
  - `accent-color: var(--mona-warm)` — branded checkbox szín
- **`/kosar` full page — termékkép méret**:
  - Eddig csak `aspect-ratio: 4 / 5` volt, explicit `max-height` nélkül
  - A v0.7.5 fix csak a CartDrawer-t és a checkout summary-t fedte le, a `/kosar` 
    full page kimaradt — egyes esetekben a kép kifolyt a 100×125px keretből
  - Fix: explicit `width: 100px; height: 125px; max-width/max-height` mind a link 
    wrapper-en, mind a belső `<img>`-en (a CartDrawer és checkout summary mintájára)

### Változott — Header mobile redesign (a v0.7.6 folytatása)

- **`.hide-tablet` specificitás bug fix** ⭐:
  - A v0.7.6-ban bevezetett `.hide-tablet` osztály **nem működött** az `Időpontfoglalás`
    gombon: a `.hide-tablet { display: none }` és a `.btn { display: inline-flex }` 
    ütközött (mindkettő 0,1,0 specificitás), és mivel a `buttons.css` később töltődik
    mint a `layout.css`, a `.btn` nyert → a gomb tablet/landscape mobile-on csonkulva 
    látszott
  - Fix: `.hide-mobile`, `.hide-tablet`, `.hide-desktop` utility-k **`!important`** flag-gel
  - Plusz: `display: initial` → `display: revert` (jobb flex/grid container kezelés —
    a `.lang-switcher` korábban `display: initial` miatt `inline`-ra váltott volna 
    desktop-on, ami a flex layout-ot törte)
- **Mobile menu: full-screen drawer → dropdown overlay**:
  - Az eddigi balról csúszó full-screen drawer helyett **dropdown overlay** a header alól
  - `position: absolute; top: 100%` — a sticky header-hez kötve
  - Animáció: `max-height: 0 → calc(100vh - var(--header-height))`
  - Backdrop overlay a tartalom fölött (`rgb(0 0 0 / 0.32)`) — kattintásra bezár
  - A `.mobile-menu__header` (logo + bezárás gomb) eltávolítva — a hamburger ikon 
    maga vált X-re, ha nyitva van a menü
  - Link kattintás auto-zárja a menüt
  - Viewport átméretezés desktop-ra (≥1024px) miközben nyitva van — auto-zár
- **HU/EN nyelvválasztó visszahozva mobile-on a header bar-ra**:
  - A v0.7.6-ban `hide-tablet` osztályt kapott — most levéve
  - Minden viewport-on látszik a bar-on (a duplikált `.mobile-menu__lang` blokk 
    eltávolítva a dropdown footer-éből)
  - Plusz fix: `.lang-switcher` explicit `display: inline-flex` (eddig csak 
    `align-items: center` volt rajta `display` nélkül — örökölt bug)
- **Header bar 5 elemes layout — esztétikus elrendezés mobile-on**:
  ```
  [Mona Studio]  [HU·EN]  [🛍️]  [👤]  [☰]
  ```
  - Action ikonok: 40×40px → 36×36px keskeny mobile-on (≤768px), SVG 20px → 18px
  - Action gap: `var(--space-1)` (~4px) → `2px` keskeny mobile-on
  - Logo méret: 18px (≤480px) → 20px (≥480px) → 22px (≥768px) → 24px (≥1024px)
- **Hamburger / X ikon váltás animálva**:
  - Egy gomb, két SVG (`.site-header__hamburger-icon` + `.site-header__close-icon`)
  - `aria-expanded="true"` állapot kapcsolja átmenetet (opacity + 90° rotate)
  - `aria-label` is dinamikusan vált ("Menü megnyitása" / "Menü bezárása")

### Megjegyzés
- A teljes responsive logika érvényes mobile portrait + landscape + tablet portrait + 
  landscape mobile mind ≤1024px tartományban — egységes mobile menu viselkedés
- Az `Időpontfoglalás` gomb most véglegesen rejtett ≤1024px alatt — a dropdown 
  menüben CTA-ként elérhető

### Fájlok (5)
- `package.json` — verzió `0.7.7` → `0.7.8`
- `src/components/common/Header.astro` — markup + JS átalakítás
- `src/styles/components/header.css` — bar layout + dropdown overlay CSS
- `src/styles/layout.css` — `.hide-*` utility-k `!important` + `revert`
- `src/pages/penztar/index.astro` — `.form-checkbox` CSS
- `src/pages/kosar.astro` — `.cart-page-item__image` méret

---

## [0.7.7] — 2026-04-26 — (placeholder)

> Ennek a verziónak a tényleges tartalma nem került naplózásra a session során 
> (`package.json` 0.7.7-en volt rögzítve, de az ehhez kapcsolódó konkrét változtatás 
> nem azonosítható egyértelműen). Lehetséges hogy egy gyors UI tweak vagy build hotfix 
> volt — a rákövetkező v0.7.8 ezt a hiányt is rendezi a header redesign keretében.

---

## [0.7.6] — 2026-04-26 — Header mobile/tablet kompakt + tagline rejtés

**Patch bump**. A Sprint 3 funkciók befejezése után utolsó jelentős UI fix: a mobil 
header zsúfolt és nem fér ki. (Visszamenőlegesen dokumentálva.)

### Probléma
Mobile screen-en (iPhone Pro ~390px széles) a header **6 elemet** próbált egy sorba 
zsúfolni: logo + tagline + Időpontfoglalás gomb + HU·EN + 3 ikon. Eredmény: 
átlapolódás, vagy a hamburger menü kicsúszott a viewport-ról iOS Safari-ban.

### Változott
- **`src/styles/components/header.css`**:
  - Tagline mobile-tablet rejtve, csak desktop-on (≥1024px) látszik
  - Logo szöveg kompaktabb: 18px mobile, 20px tablet, 22px desktop, `white-space: nowrap`
  - Header padding kompaktabb mobile-on
  - Actions gap szűkítve mobile-on
  - Action gombok `flex-shrink: 0`
- **`src/components/common/Header.astro`**:
  - `hide-mobile` → `hide-tablet` csere az Időpontfoglalás gombon és a `.lang-switcher` 
    div-en (cél: tablet-en is rejtett legyen)
- **`src/styles/layout.css`** — responsive helper logika tisztítás:
  ```css
  .hide-mobile { display: none }              /* < 768px-en rejt */
  @media (min-width: 768px) { .hide-mobile { display: initial } }
  .hide-tablet { display: none }              /* < 1024px-en rejt */
  @media (min-width: 1024px) { .hide-tablet { display: initial } }
  .hide-desktop { display: initial }
  @media (min-width: 1024px) { .hide-desktop { display: none } }
  ```

### Ismert probléma (a v0.7.8-ban javítva)
A `.hide-tablet { display: none }` valójában **NEM működött** az Időpontfoglalás 
gombon, mert specificitás-konfliktusban volt a `.btn { display: inline-flex }`-szel 
(mindkettő 0,1,0), és a `buttons.css` később töltődik mint a `layout.css`. A v0.7.8 
ezt `!important` flag-gel oldja meg.

### Fájlok (4)
- `package.json` — verzió `0.7.5` → `0.7.6`
- `src/components/common/Header.astro`
- `src/styles/components/header.css`
- `src/styles/layout.css`

---

## [0.7.5] — 2026-04-26 — Kép méret korlátok + fieldset → div csere

**Patch bump**. (Visszamenőlegesen dokumentálva.)

### Változott
- **`src/components/shop/CartDrawer.astro` — termékkép méret kényszerítés**:
  ```css
  .cart-item__image-link {
    width: 80px; height: 100px;
    max-width: 80px; max-height: 100px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .cart-item__image {
    width: 100%; height: 100%;
    max-width: 80px; max-height: 100px;
    object-fit: contain;
  }
  ```
  Korábban a kép a teljes drawer szélességére (~400px) kifújódott, mert a globális 
  `img { max-width: 100% }` felülírta a 80px szándékot, és az `aspect-ratio: 4/5` 
  egyedül nem volt elég kényszer.
- **`src/pages/penztar/index.astro` — `<fieldset>` → `<div class="checkout-section">` csere** ⭐:
  - Mind az 5 form szekciónál (Vásárlói adatok, Szállítási mód, Szállítási cím, 
    Fizetési mód, Megjegyzés, GDPR)
  - `<legend>` → `<h3 class="checkout-section__title">` csere
  - **Indok**: a böngészők (különösen Chrome) inkonzisztensen renderelik a `<legend>`-et,
    fehér háttér + barna kontúr glitch-csel ami a screenshot-okon "barna doboz"-ként 
    jelent meg. A `<div>` + `<h3>` ugyanaz vizuálisan, viselkedés szempontból 
    kontrollálhatóbb.
- **Checkout summary kép méret korlát**:
  ```css
  .checkout-item { display: grid; grid-template-columns: 60px 1fr; min-width: 0 }
  .checkout-item__image-wrap { width: 60px; max-width: 60px; flex-shrink: 0 }
  .checkout-item__image { max-width: 60px }
  ```

### Egységesítő ZIP
A session során sok kis ZIP készült, a v0.7.5 záróverziójához egy **`v0.7.5-final-overrides.zip`** 
(110 KB, 25 fájl) készült — a teljes Sprint 3.3 + 3.4 + UI fix-ek v0.7.3-5 egybe.

### Fájlok (3)
- `package.json` — verzió `0.7.4` → `0.7.5`
- `src/components/shop/CartDrawer.astro`
- `src/pages/penztar/index.astro`

---

## [0.7.4] — 2026-04-26 — Termékoldal qty + tabok + globális overflow ⭐

**Patch bump**. (Visszamenőlegesen dokumentálva.) — **Kritikus fix** a globális 
horizontális overflow miatt.

### Változott
- **`src/pages/webshop/termek/[slug].astro`**:
  - **Qty kontroll középre igazítás**:
    - `.qty-control { justify-content: center; width: fit-content }`
    - `.qty-control__btn { display: flex; align-items: center; justify-content: center }`
    - `.qty-control__input { text-align: center !important }`
    - Korábban a `1`-es szám az input bal oldalán ragadt, mert valamelyik globális 
      stylesheet `text-align: left`-et adott az `<input>`-nak.
  - **Qty + Kosárba gomb wrapping**: `.product-buy { flex-wrap: wrap }` + 
    `.product-buy__cta { min-width: 200px }`
  - **Tabok scrollbar elrejtés**: `.product-tabs__nav { overflow-x: auto; overflow-y: hidden; 
    scrollbar-width: none }` + `::-webkit-scrollbar { display: none }`
  - **Number input spinner standardizálás**: `appearance: none|textfield`
- **`src/styles/reset.css`** ⭐ **KRITIKUS**:
  ```css
  html { overflow-x: hidden; width: 100%; max-width: 100% }
  body { overflow-x: hidden; width: 100%; max-width: 100% }
  ```
  Az "egész oldal végtelenül görgethető jobbra-balra" jelenség megszűnik. Ez a bug a 
  Sprint 1 óta megvolt — valamelyik szekció kilógott a viewport-on túl.

### Tanulság
A `npm run deploy` CLI direct upload **preview URL-re** ment (pl. 
`a6ce11d6.monabeauty2.pages.dev`), és **NEM Production-ra**. A Production a 
GitHub → CF Pages auto-build-ből frissül `git push origin main`-nel. Ez félreértést 
okozott — Peter `v0.7.3`-at látott a footer-ben, miközben a Claude `v0.7.4`-et 
feltételezett aktívnak. **Tanulság**: production deploy-hoz mindig commit + push, 
soha csak CLI deploy.

### Fájlok (3)
- `package.json` — verzió `0.7.3` → `0.7.4`
- `src/pages/webshop/termek/[slug].astro`
- `src/styles/reset.css`

---

## [0.7.3] — 2026-04-26 — Cart UI fix (radio + üres állapot + sortörés)

**Patch bump**. (Visszamenőlegesen dokumentálva.) Az első UI fix kör v0.7.2 után.

### Változott
- **`src/components/shop/CartDrawer.astro`**:
  - **Radio gombok méret rögzítés**: `.cart-shipping__option input { width: 18px; 
    height: 18px; flex-shrink: 0; accent-color: var(--mona-warm) }`. Korábban a 
    globális reset hiányos `input` szabálya miatt a flex layout ~60-70px átmérőjű 
    kék óriási körökre fújta a radio gombokat.
  - **Üres állapot + footer egyszerre láthatóság fix**: `.cart-drawer__footer`, 
    `.cart-drawer__empty`, `.cart-drawer__items` `[hidden]` attribute selectorral 
    `display: none !important`. Korábban a `display: flex/grid` felülírta a HTML 
    `hidden` attribute alapértelmezett `display: none`-ját → "fantom kosár" 
    (üres üzenet alatt mégis látszott a 31.000 Ft összesen).
  - **"FoxPost csomagautomata 1.990 Ft" sortörés**: `.cart-shipping__option-content 
    { gap: var(--space-2); min-width: 0 }`, `.cart-shipping__option-name { flex: 1; 
    min-width: 0 }`, `.cart-shipping__option-price { white-space: nowrap; flex-shrink: 0 }`
- **`src/pages/kosar.astro`** — ugyanazok a fix-ek mint a CartDrawer-ben
- **`src/pages/penztar/index.astro`**:
  - `.shipping-option input, .payment-option input { width: 18px; height: 18px; 
    flex-shrink: 0; accent-color: var(--mona-warm) }`

### Megjegyzés
- Az `[hidden] { display: none !important }` mintát Tailwind és más design rendszerek 
  is használják — CSS specificitás-trükk, nem szép, de szükséges, ha a komponens 
  `display: flex|grid` van állítva.
- Az `accent-color` modern CSS feature (Chrome 93+, Firefox 92+, Safari 15.4+) — 
  natív radio/checkbox színezésre. Régebbi böngészőkön a radio kék marad, de a 
  mérete jó lesz (a fő bug).

### Fájlok (4)
- `package.json` — verzió `0.7.2` → `0.7.3`
- `src/components/shop/CartDrawer.astro`
- `src/pages/kosar.astro`
- `src/pages/penztar/index.astro`

---

## [0.7.2] — 2026-04-26 — Sprint 3.4 — Pénztár + email + Mailchimp tag

### Hozzáadva
- **`src/pages/api/checkout/index.ts`** (~600 sor) — checkout endpoint:
  - Body validáció + termék frissítés D1-ből + készlet ellenőrzés
  - Order number: `MS-YYYY-NNNN` formátum
  - D1 INSERT: orders + order_items + készlet csökkentés
  - Resend email vendégnek + Mónikának (HTML template-ek)
  - Mailchimp tag-elés (csak ha email a listán) — non-fatal
  - Saját MD5 implementáció Mailchimp member hash-hez
- **`src/pages/penztar/index.astro`** — checkout oldal:
  - Vendég adatok form (név, email, telefon)
  - Szállítási mód (FoxPost / Personal) + dinamikus cím szekció
  - Fizetési mód (átutalás / utánvét)
  - Sticky summary jobb oldalon
  - localStorage → API call → redirect
- **`src/pages/penztar/koszonjuk.astro`** — thank-you oldal:
  - Server-side D1 lookup
  - Hero + tételek + szállítás/fizetés info + kapcsolat
  - `noindex`

### Változott
- **Verzió bump**: `0.7.1` → `0.7.2` (patch — Sprint 3 kiegészítés)

### Megjegyzés
- A **Resend env var** (`RESEND_API_KEY`) **kötelező** a checkout flow-hoz
- **Sprint 3 LEZÁRVA** — a webshop élesen rendelést tud fogadni

---

## [0.7.1] — 2026-04-26 — Newsletter Mailchimp error handling fix

### Változott
- **`src/pages/api/newsletter/subscribe.ts`** — érdemi hibakezelés:
  - Csak konkrét `"Member Exists"` string-et fogad sikeresként (előtte minden 400-as error sikeres volt!)
  - Részletes Mailchimp HTTP error logging (status, title, detail, type, errors)
  - 401 → "Hitelesítési hiba" specifikus üzenet
  - 404 → "Konfigurációs hiba" specifikus üzenet
  - Sikeres feliratkozáskor `console.log` is
- **Verzió bump**: `0.7.0` → `0.7.1` (patch — bug fix)

### Megjegyzés
- Az előző hibás kódban minden 400-as Mailchimp hiba (pl. "Invalid Resource", rossz API kulcs) **sikeresnek** nyilvánult → frontend "Köszönjük"-öt írt, miközben a Mailchimp valójában elutasította a kérést

---

## [0.7.0] — 2026-04-26 — Sprint 3.3 — Termékoldal + kosár drawer + /kosar

**MINOR bump** — vásárlási folyamat első fele, új user flow.

### Hozzáadva
- **`src/pages/webshop/termek/[slug].astro`** — egyedi termékoldal:
  - Kép galéria (fő + thumbnailek)
  - Akció / Új / Mónika ajánlja badge
  - Tartalom: márka link, név, lead, ár, méret, készlet státusz
  - **Mónika ajánlása blokk** kiemelve (warm bal border)
  - Mennyiség választó (− / + qty)
  - Kosárba gomb → drawer megnyit
  - 3 fülek: Leírás / Összetevők / Használat
  - Kapcsolódó termékek szekció (max 4)
  - Schema.org Product JSON-LD
- **`src/pages/api/products/[slug].ts`** — egy termék GET endpoint
- **`src/pages/kosar.astro`** — full page kosár nézet:
  - Üres állapot CTA-val
  - 2 oszlop layout (termékek + sticky summary)
  - `noindex` (ne kerüljön Google indexbe)
- **`src/components/shop/CartDrawer.astro`** — oldalsó panel:
  - Right-side slide-in animation
  - Backdrop + body scroll lock + Esc bezárás
  - Tételek: kép + név + qty + ár + eltávolítás
  - Szállítási mód radio (FoxPost / Személyes)
  - Free shipping progress bar (20.000 Ft küszöbig)
  - "Tovább a pénztárhoz" + "Kosár megtekintése"
- **`src/components/shop/CartIcon.astro`** — alternatív kosár ikon (most nem használt)

### Változott
- **`src/lib/cart.ts`** — teljes átírás:
  - `CartItem` interface a `shop.ts` típusokra (`productId`, `slug`, `priceAtAddFt`, `maxQty`, `brandName`)
  - localStorage kulcs: `mona_cart` → `mona_cart_v2` (séma váltás)
  - `getShippingMethod()` / `setShippingMethod()`
  - `getCartSummary()` — szállítási költséggel együtt
  - `addToCart` — készlet ellenőrzés (cap a stockQty-re), `capped` jelzés toast-ban
  - Custom események: `mona-cart-update`, `mona-cart-open`
- **`src/components/common/Header.astro`** — kosár ikon átalakítás:
  - `data-cart-trigger` attribute
  - Click → drawer megnyitás (preventDefault)
  - Ctrl/Cmd-klikk + középső gomb klikk → engedi a `/kosar` navigációt új fülbe
  - Counter `mona-cart-update` event-re
- **`src/layouts/BaseLayout.astro`** — `CartDrawer` import + render
- **Verzió bump**: `0.6.4` → `0.7.0` (MINOR — új user flow: vásárlási folyamat)

### Megjegyzés
- A **régi `mona_cart` localStorage** értékek **invalid-ok lesznek** — friss kezdés
- A **/penztar oldal még nem létezik** — Sprint 3.4-ben jön. A "Tovább a pénztárhoz" gomb kattintáskor 404
- A **kosár ikon Ctrl-klikk** opció megőrzi a `/kosar` URL-t (új fülben nyitja) — accessibility + SEO miatt
- A **Probiotic utazó készlet** termék (8.) a placeholder ikont mutatja a galériában — Sprint 5 (admin)-ban Mónika tölthet fel képet

---

## [0.6.4] — 2026-04-26 — Sprint 3.2 (2. rész) — Webshop oldalak

### Hozzáadva
- **`src/components/shop/ProductCard.astro`** — termék kártya komponens:
  - 4:5 aspektrátió kép, hover effekt
  - Badge-ek: akció (`−15%`), új, Mónika ajánlja
  - Akciós ár megjelenítés (piros + áthúzott eredeti)
  - Készlet jelzés (low / out of stock)
  - 3 soros line-clamp short_description
- **`src/components/shop/FilterPanel.astro`** — szűrő oldalsáv:
  - Kategória + márka + ár + rendezés szűrők
  - URL state alapú (search params) — canonical-friendly
  - Sticky desktop, mobile statikus
- **`src/pages/webshop/index.astro`** — webshop hub:
  - Akciós + kiemelt termék szekciók
  - 5 kategória tile (arclemosok, tonikok, szerumok, arckremek, csomagok)
  - Márka tile-ok (KRX)
  - Szállítási info CTA blokk
- **`src/pages/webshop/[kategoria].astro`** — kategória oldal szűrőkkel + lapozással
- **`src/pages/webshop/markak/[marka].astro`** — márka oldal márka bemutatással
- **`src/pages/api/products/index.ts`** — GET endpoint:
  - Query: `kategoria`, `marka`, `ar`, `sort`, `keres`, `akcios`, `page`, `per_page`
  - JSON válasz: `{ products, total, page, perPage, totalPages }`
  - Validáció: max 100 termék/oldal

### Változott
- **Verzió bump**: `0.6.3` → `0.6.4` (patch — új funkcionalitás Sprint 3 keretén belül)

### Teszt URL-ek deploy után
- `/webshop` — hub oldal
- `/webshop/szerumok` — Szérumok kategória (4 KRX termék)
- `/webshop/markak/krx` — KRX márka (8 termék)
- `/webshop/szerumok?ar=5000-10000&sort=price_asc` — szűrt + rendezett
- `/api/products?akcios=1` — csak akciós termékek JSON

### Megjegyzés
- A **termékoldal** (`/webshop/termek/[slug]`) **még nincs** — Sprint 3.3-ban jön
- A ProductCard `<a>` tag már a `/webshop/termek/{slug}` URL-re mutat — Sprint 3.3 előtt ez 404 lesz, **a kártyák kattinthatóak de hibás oldalra mennek**
- Ha gyorsan élesíthető teszt-termékoldalt akarunk Sprint 3.3 előtt, a ProductCard `productUrl`-t lehet `#`-ra állítani átmenetileg

---

## [0.6.3] — 2026-04-26 — Hírlevél újrapozícionálás Mónika hangjára

### Változott
- **`NewsletterForm.astro`** — teljes szöveg újraírás:
  - Eyebrow: "Szakmai hírlevél" → **"Mónika havi naplója"**
  - Cím: "Mónika kurátori válogatása" → **"Bőrápolás, közvetlenül tőlem"**
  - Blurb: új koncepció — bőrtípus szerinti tanácsok, kezelés ajánlások, alkalmankénti próbatermék/kedvezmény
  - CTA: "Feliratkozás" → **"Igen, küldd a naplót"**
  - **Eltávolítva** a "kéretlen levelek nélkül" fordulat — implicit, és modernebbül "Csak email cím kell"
  - **Eltávolítva** a "kizárólagos kedvezmények előfizetőknek" — Mónika brand-je nem kuponújság

### Hozzáadva
- **`/api/newsletter/subscribe.ts`** — strukturált Mailchimp tag rendszer:
  - `source` paraméter támogatás (footer, popup, signup-form, stb.) a felhasználói viselkedés követéséhez
  - Tag-ek: `website-signup` + forrás-jelölő automatikusan
  - Üzenet hangja: "havi napló" — nem "feliratkozás"
- **Sprint 4 hírlevél ↔ regisztráció összekapcsolás dokumentálva**:
  - A `/api/auth/register` és OAuth callback-ek Sprint 4-ben Mailchimp lekérdezést végeznek (MD5 email hash)
  - Ha az email már a Mailchimp listán van → `registered` tag automatikusan adódik
  - Plusz `customers.is_newsletter_member` flag jelöli a kapcsolatot
  - Jutalom-logika: első rendelés -10% (vagy más kedvezmény Mónika döntése alapján), korai hozzáférés új termékekhez, alkalmanként próbatermék

### Stratégiai döntés
- **A hírlevél nem előfizetés** — szakmai tartalom mindenkinek, **a regisztrált fiókokat plusz jutalmazzuk**
- A "premium" / "subscriber" / "exkluzív" szóhasználat kerülése — nem illik Mónika természetes-szakmai brand-jébe
- A tartalom **kevert**: bőrtípus tanácsok, kezelés ajánlások, termék bemutatók, alkalmanként próbatermékkel

### Megjegyzés
- Az `/api/newsletter/subscribe.ts` változás **backward-compatible** — a régi `{ email }` request body továbbra is működik (a `source` opcionális)
- A frontend NewsletterForm jelenleg **nem küldi** a `source` paramétert — Sprint 3.2 (2. rész)-ben hozzáadjuk amikor több helyen lesz a form (pl. /webshop oldalon, vagy popup-ban)

---

## [0.6.2] — 2026-04-26 — Sprint 3.2 (1. rész — javítások)

### Javítva
- **`@astrojs/sitemap` SSR build crash** — `Cannot read properties of undefined (reading 'reduce')`:
  - Verzió pinnelve `3.6.0`-ra (a `^3.2.0` caret 3.7.x-et hozott le, ami SSR módban broken)
  - **`patch-package`** telepítve mint védőháló — `postinstall` hook + `patches/` mappa (lásd `patches/README.md`)
- **`db:seed` idempotens lett** — többször is futtatható duplikálás / unique hiba nélkül:
  - Kategóriák, márkák: `INSERT OR IGNORE`
  - Termékek: `INSERT OR REPLACE` (megőrzi az ID-t, így a FK-k jók)
  - Termékképek: `DELETE` slug-prefixre, aztán `INSERT`

### Hozzáadva
- **`migrations/9999_reset_seed_data.sql`** — biztonságos reset SQL ami **csak** a seed táblákat üríti (categories, brands, products, product_images). Az `orders` és `order_items` érintetlenül marad, az `order_items.product_id` NULL-ra állítódik a snapshot mezők megőrzésével.
- **`db:reset` és `db:reseed` scriptek** (remote + local variánssal):
  - `db:reset` — csak a seed adatok ürítése
  - `db:reseed` — `db:reset` + `db:seed` egyben (tiszta újratöltés)
- **`patches/` mappa** — `patch-package` által kezelt patch fájlok helye (jelenleg 1 fájl: `@astrojs+sitemap+3.7.2.patch` mint biztonsági fallback)
- **7 KRX termékkép** elhelyezve: `public/images/products/krx-*.webp`
  - Cica vonal: 4/4 kép
  - Probiotic vonal: 3/4 kép (Probiotic utazó készlet képe később jön)

### Változott
- **`package.json`**:
  - `"@astrojs/sitemap": "3.6.0"` (pin, nem caret)
  - `+ "patch-package": "^8.0.0"` dependency
  - `+ "postinstall": "patch-package"` script
  - `+ db:reset, db:reseed (+ :local variánsok)` scriptek
- **`migrations/0002_sprint3_seed_krx_products.sql`** — idempotens UPSERT-ekkel
- **Verzió bump**: `0.6.1` → `0.6.2` (patch — bugfix)

### Megjegyzés
- A `patches/@astrojs+sitemap+3.7.2.patch` jelenleg **nem aktív** (3.6.0 van pinnelve), Cursor figyelmeztetést írhat ki ami **nem hiba** — a fájl csak akkor lép működésbe ha valaki frissítené 3.7.x-re a sitemap-et
- Ha a Cursor pontos hash-eket akar a patch fájlban, regenerálható: `npx patch-package @astrojs/sitemap` (a node_modules-ből kiolvassa az aktuális tartalmat)

---

## [0.6.1] — 2026-04-26 — Sprint 3.2 (1. rész) — KRX termékek migráció + Footer Maps

### Hozzáadva
- **`migrations/0002_sprint3_seed_krx_products.sql`** — 8 KRX termék migráció a régi `site_content.json`-ből:
  - **Cica vonal** (Centella Asiatica, érzékeny/rosaceás bőrre): 4 termék
  - **Probiotic vonal** (mikrobiom-támogatás): 4 termék
  - 5 új kategória: arclemosok, tonikok, szerumok, arckremek, csomagok
  - 1 márka: KRX (Korea)
- **Mónika hangú rövid `monika_recommends`** minden termékhez:
  - Bőrtípus + kombináció + mikor — marketing-fókuszú
  - Példa: "Érzékeny, rosaceára vagy aknéra hajlamos bőrre. Tökéletes párosa: Cica Tonik utána, majd Cica Szérum vagy Krém."
- **`short_description` (max 120 kar.)** kártyán optimalizált leírások
- **Footer Google Maps link**:
  - A `2600 Vác, Zrínyi Miklós u. 3.` cím **kattintható** Google Maps-re
  - Telefonszám is kattintható (`tel:` link)
  - Hover effekt: warm tónusú szín

### Eltávolítva
- `migrations/0002_sprint3_seed_demo.sql` (a régi 8 demo termék — Eclado/Mesotica/London Beauty/Image Skincare placeholder)

### Változott
- **`package.json`** — `db:seed` script az új SQL fájlra
- **Verzió bump**: `0.6.0` → `0.6.1` (patch — tartalmi finomítás, séma változatlan)

### Megjegyzés
- A 8 KRX termék képei a `public/images/products/krx-...webp` útvonalon várhatók — Mónika feltöltheti, vagy átmásolhatóak a régi rendszer `images/products/` mappájából
- A `description` mezőben **markdown formázás** működik (Astro built-in markdown), így a termékoldalon a kiemelések és listák szépen jelennek meg

---

## [0.6.0] — 2026-04-26 — Sprint 3.1 — Webshop D1 séma + demo

### Hozzáadva
- **D1 séma** (`migrations/0001_sprint3_webshop.sql`):
  - `categories` (hierarchikus, parent_id-val)
  - `brands` (Eclado, Mesotica, London Beauty, Image Skincare)
  - `products` (28 mező: ár, akció, készlet, méret, SEO, megjelölések, Mónika ajánlása)
  - `product_images` (1-N kapcsolat termékkel, is_primary jelzéssel)
  - `orders` (vendég adatok közvetlenül a táblában, customer_id NULL Sprint 3-ban)
  - `order_items` (freezeled árak: price_at_order_ft, product_name snapshot)
  - Triggerek `updated_at` automatikus frissítéshez
- **Demo seed** (`migrations/0002_sprint3_seed_demo.sql`):
  - 7 kategória, 4 márka, 8 demo termék
  - 1 akciós termék (London Beauty hialuron por -15%)
- **TypeScript típusok** (`src/lib/types/shop.ts`):
  - `Product`, `Category`, `Brand`, `ProductImage`, `Order`, `OrderItem`, `CartItem`, `CartSummary`
  - Helper függvények: `effectivePrice`, `isOnSale`, `discountPercent`, `stockStatus`
  - `SHIPPING_OPTIONS` konstans (foxpost: 1990 Ft, personal: 0 Ft)
  - `FREE_SHIPPING_THRESHOLD_FT = 20000`
  - `calculateShipping` függvény
- **D1 lekérdezések** (`src/lib/products.ts`):
  - `listProducts(filter)` — szűrés, lapozás, bulk enrichment
  - `getProduct(slug)` — egyedi termék kapcsolt adatokkal
  - `listCategories`, `listBrands`, `getCategory`, `getBrand`
  - `listFeaturedProducts`, `listOnSaleProducts`, `getPriceRange`
- **package.json scriptek**:
  - `npm run db:migrate` — séma feltöltés (remote)
  - `npm run db:seed` — demo adatok
  - `npm run db:migrate:local` / `db:seed:local` — lokális teszt

### Változott
- **`wrangler.toml`** — ⚠️ KV ID javítva: `REPLACE_WITH_YOUR_KV_ID` → `b2da4e4639ec4141a4f0c91ab3c5e8b7` (a régi rendszer KV-jét használjuk a CONTENT binding-hez)
- **`wrangler.toml`** — új `[vars]` szekció Sprint 3 szállítási konstansokkal
- **Verzió bump**: `0.5.3` → `0.6.0` (minor — Sprint 3 indítás)

### Megjegyzés
- A demo termékek **a régi rendszer adatokkal felül lesznek írva** Sprint 3.2-ben (`export-regi-termekek.ps1` script futtatása után)
- **`npm install` nem kötelező** új dep nincs, de a `db:migrate` parancsok a `wrangler` CLI-t használják ami már installálva van

---

## [0.5.3] — 2026-04-26 — Sprint 2B (6. kör) — SEO optimalizáció + FB OAuth előkészítés

### Hozzáadva
- **`@astrojs/sitemap` integráció** (`astro.config.mjs`):
  - Build-time automatikus sitemap.xml generálás
  - Filter: admin, api, profil, login/register oldalak kihagyva
  - i18n hreflang map: hu-HU + en-US
  - Custom prioritások: főoldal 1.0 (daily), szolgáltatások/blog 0.8 (weekly), jogi oldalak 0.3 (monthly)
- **LCP optimalizáció — hero kép preload**:
  - BaseLayout `heroImage` és `heroImageMobile` props
  - `<link rel="preload" as="image" fetchpriority="high">` responsive media queries-vel
  - Index.astro főoldal hero kép preload aktív (hero-main.webp + hero-480.webp)
- **Facebook OAuth előkészítés (Sprint 4 előtt)**:
  - `env.d.ts` — `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` env vars típusok
  - `bejelentkezes.astro` — Facebook gomb hozzáadva (disabled, Sprint 4-ben aktiválódik)
  - API endpoint terv: `/api/auth/facebook`, `/api/auth/facebook-callback`
  - `customers` tábla `facebook_id` és `apple_id` mezők előre megtervezve

### Változott
- **`docs/06-api-reference.md`** — Sprint 4 endpoint-ok bővítve FB OAuth-tal, FB Login követelmények dokumentálva
- **`docs/07-deployment.md`** — FACEBOOK_APP_ID/SECRET env vars, FB Redirect URI-k, Mailchimp env vars szekció bővítve, `.dev.vars` minta frissítve
- **`docs/08-sprint-log.md`** — Sprint 4 leírás bővítve OAuth provider összehasonlító táblával (Google/FB/Apple)
- **`docs/03-known-issues.md`** — SEO problémák státuszok frissítve:
  - 5.1 Sitemap.xml ✅ MEGOLDVA
  - 5.4 404 oldal ✅ MEGOLDVA
  - 5.5 Open Graph ✅ MEGOLDVA
  - 5.6 LCP optimalizáció ✅ MEGOLDVA (új issue)
  - 5.7 Schema.org JSON-LD ✅ MEGOLDVA (új issue)

### Brand alapelvek megerősítve
- ✅ **Apple Sign-In elhalasztva** — drága ($99/év), csak iOS app esetén kötelező; a Mónika célcsoport (25-50 nők, magyar piac) Google + FB-vel 95%-ban lefedhető

### Megjegyzés
- Az `@astrojs/sitemap` package a `package.json`-ben hozzáadva, **`npm install` szükséges Cursor-ban** a deploy előtt!
- A FB OAuth funkcionalitás Sprint 4-ben aktiválódik (a gomb most disabled placeholderrel)

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
