# Mona Studio — Known Issues katalógus + Sprint 2 előkészítés

**Cél:** Mielőtt a Sprint 2-ben újraírjuk a meglévő oldalakat Astro-ra, gyűjtsük össze a jelenlegi rendszer **összes ismert problémáját** és definiáljuk hogyan oldjuk meg architektúra szinten — nem foltozással, hanem a layout-rendszer szintjén.

**Készült:** 2026.04.25  
**Státusz:** Cursor implementációhoz előkészítve

---

## 1. Layout és scroll problémák

### 1.1 ❌ Tartalom a sticky nav alá csúszik

**Probléma:** Hash link kattintáskor (`#section`), vagy oldalbetöltéskor anchor-rel a szekció címe a sticky header alá kerül, levágva.

**Megoldás (CSS-szinten, alapból):**
```css
:root {
  --header-height: 72px;     /* desktop */
}

@media (max-width: 1023px) {
  :root {
    --header-height: 64px;   /* mobile */
  }
}

html {
  scroll-padding-top: var(--header-height);
}

/* Minden szekcióra alapból */
section[id],
[data-anchor] {
  scroll-margin-top: var(--header-height);
}
```

**Hová kerül:** `src/styles/tokens.css` és `reset.css`

---

### 1.2 ❌ Sticky header eltűnik scroll up közben

**Probléma:** Mai webshopok a header-t lefelé scrollozáskor elrejtik, felfelé újra megjelenítik (Shopify-stílus). Ez segíti az olvashatóságot.

**Megoldás:**
```css
.site-header {
  position: sticky;
  top: 0;
  transition: transform 200ms ease;
}

.site-header[data-scroll-direction="down"] {
  transform: translateY(-100%);
}
```

JS:
```js
let lastScroll = 0;
let ticking = false;

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const current = window.scrollY;
      const direction = current > lastScroll && current > 100 ? "down" : "up";
      document.querySelector(".site-header")?.setAttribute("data-scroll-direction", direction);
      lastScroll = current;
      ticking = false;
    });
    ticking = true;
  }
});
```

**Hová kerül:** `Header.astro` `<script>` blokk

---

### 1.3 ❌ Footer ugrál különböző hosszú oldalakon

**Probléma:** Rövid oldalakon (404, üres kosár) a footer feljön középre, hosszú oldalakon a végén van — inkonzisztens.

**Megoldás:** sticky footer pattern
```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

.site-footer {
  margin-top: auto;
}
```

**Hová kerül:** `reset.css`

---

### 1.4 ❌ Mobile drawer menü scroll lock hibás

**Probléma:** Drawer megnyitásakor a háttér tovább scrollozható iOS Safari-ban. A `body { overflow: hidden }` nem elég.

**Megoldás:** scroll position lock + restore
```js
let scrollY = 0;

const lockScroll = () => {
  scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
};

const unlockScroll = () => {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollY);
};
```

**Hová kerül:** `Header.astro` mobile menu logika

---

### 1.5 ❌ Layout shift (CLS) képek nélkül

**Probléma:** Képek `width`/`height` nélkül CLS-t okoznak — Google büntet érte.

**Megoldás:** **Kötelező**: minden `<img>`-en explicit width és height, vagy aspect-ratio
```html
<img src="..." alt="..." width="800" height="1000" loading="lazy" />
```

CSS:
```css
img {
  aspect-ratio: attr(width) / attr(height);
  height: auto;
  max-width: 100%;
}
```

---

### 1.6 ❌ Modal megnyitásakor a háttér ugrik

**Probléma:** Body scrollbar eltűnésekor (Windows) ~17px ugrás van.

**Megoldás:** scrollbar gutter
```css
html {
  scrollbar-gutter: stable;
}
```

---

## 2. Form és validáció

### 2.1 ❌ Form validáció csak submit-kor

**Probléma:** Felhasználó csak a submit-nál tudja meg hogy az email rossz formátumú.

**Megoldás:** real-time validation `:invalid` + `:user-invalid` (modern CSS)
```css
input:user-invalid {
  border-color: var(--mona-error);
}

input:user-valid {
  border-color: var(--mona-success);
}
```

---

### 2.2 ❌ Mobile számbillentyűzet nem jelenik meg telefonszámra

**Megoldás:** `inputmode` attribútum
```html
<input type="tel" inputmode="tel" autocomplete="tel">
<input type="email" inputmode="email" autocomplete="email">
<input type="number" inputmode="numeric">
```

---

### 2.3 ❌ Autocomplete attribútumok hiányoznak

**Probléma:** A böngészők nem tudják kitölteni a form-okat.

**Megoldás:** minden form mezőre `autocomplete=""`
- `name` → `name`
- `email` → `email`
- `tel` → `tel`
- `address` → `street-address`, `postal-code`, `address-level2` (város)

---

## 3. Akadálymentesség

### 3.1 ❌ Focus state nem látható
- Add `:focus-visible` outline mindenhol (megvan a tokens.css-ben ✓)

### 3.2 ❌ Modal megnyitás után focus nem ugrik a modálba
- Modal megnyitásakor `focus()` az első interaktív elemen
- Tab trap a modalon belül
- Bezárás után focus visszaadása a megnyitó gombra

### 3.3 ❌ Színt csak vakon jelölt információ
- Akciós ár — ne csak piros legyen, hanem `−20%` szöveg + áthúzott eredeti
- Hiba állapot — ne csak piros border, hanem ❌ ikon + szöveg

### 3.4 ❌ Aria labelek hiányoznak
- Minden icon-only gombnak `aria-label`
- Lapozáshoz `aria-current="page"`
- Nyitható elemekhez `aria-expanded`
- Élő tartalomváltozáshoz `aria-live="polite"`

---

## 4. Performance

### 4.1 ❌ Cormorant Garamond minden súlyban betöltve
- Csak 400 és 500 kell — 700, 900 stb. ne töltődjön

### 4.2 ❌ Képek WebP nélkül
- R2-be feltöltéskor automatikus konverzió WebP-re
- `<picture>` tag fallbackkel

### 4.3 ❌ JS minden oldalon a teljes anyagot tölti
- Astro segítségével: csak az adott oldalon használt JS töltődik be
- `client:visible` és `client:idle` direktívák

### 4.4 ❌ Largest Contentful Paint > 2.5s
- Hero kép `fetchpriority="high"`
- Font preload (megvan ✓)
- Inline kritikus CSS (Astro auto)

---

## 5. SEO problémák

### 5.1 ❌ Nincs sitemap.xml
- Astro plugin: `@astrojs/sitemap` automatikus generálás

### 5.2 ❌ Nincs robots.txt
- `public/robots.txt` létrehozni

### 5.3 ❌ Hibás canonical URL-ek (szűrt nézeteken)
- Webshop oldalon szűrt URL → canonical az alapra (`/webshop`)

### 5.4 ❌ 404 oldal nem custom
- `src/pages/404.astro` egyedi designnal

### 5.5 ❌ Nincs Open Graph kép minden oldalon
- Megvan a BaseLayout-ban (default), de oldalanként override

---

## 6. Mobil-specifikus problémák

### 6.1 ❌ Touch target túl kicsi
- Minimum 44×44px (Apple HIG, Google Material)
- Gombok, link, ikonok mind

### 6.2 ❌ Hover state mobile-on "beragad"
- `@media (hover: hover)` kondíció a hover stílusokra
```css
@media (hover: hover) {
  .btn:hover { background: ...; }
}
```

### 6.3 ❌ Viewport zoom kikapcsolva
- `<meta name="viewport" content="user-scalable=no">` ❌ NE
- Helyette: `width=device-width, initial-scale=1, viewport-fit=cover` (megvan ✓)

### 6.4 ❌ iOS Safari "rubber band" overscroll
- `overscroll-behavior: none` a kosár drawer-en, modal-okon

---

## 7. Felugró és inline elemek — specifikáció

### 7.1 Cookie Consent (GDPR kötelező)

**Komponens:** `src/components/common/CookieConsent.astro`

**Megjelenés:**
- Bal alsó sarokban, **nem felugró ablak**, egy kis sávon
- Mobil: alul lebegő sáv (full width)
- Desktop: bal alul max 400px

**Tartalom:**
```
🍪 Cookie-kat használunk
A weboldal megfelelő működéséhez és a webshop élményéhez 
sütiket használunk. A részletek a [Cookie tájékoztatóban].

[Csak a szükségeseket]  [Mindent elfogadok]
```

**Funkcionálisan:**
- 3 kategória: szükséges (mindig on), analitika (GA4), marketing
- Választás `localStorage`-ban (`mona_cookie_consent`)
- Ha még nincs döntés: a sáv jelenjen meg
- Ha "Mindent" → GA4 + Facebook Pixel betöltődik
- Ha "Szükségesek" → csak a session cookie

**Megjelenés időzítés:**
- Page load után 2 mp-cel (ne legyen ott azonnal villogó CLS)

---

### 7.2 Kosárba tétel toast

**Komponens:** `src/components/common/Toast.astro`

**Megjelenés:**
- Jobb felül, header alatt
- Mobil: középen alul
- 4 sec után automatikusan eltűnik

**Tartalom:**
```
✓ Kosárba helyezve
Cica Tonik · 7.050 Ft

[Kosárhoz]  [Tovább vásárolok]
```

**Trigger:** kosárba tétel után, kosár ikonnál is felugró +1 számláló

**Stílus:**
- Háttér: `--mona-elevated`
- Bal oldali zöld accent border (success)
- Animáció: jobbról bal slide + fade

---

### 7.3 Termék gyors nézet modal

**Komponens:** `src/components/shop/QuickViewModal.astro`

**Trigger:** Termékkártyán "👁 Gyors nézet" gomb (csak hover-en jelenik meg, mobile-on nincs)

**Tartalom:**
- Termékkép (egy nagy)
- Név + márka
- Ár
- Rövid leírás (description_short)
- Mennyiség + Kosárba gomb
- "Részletek" link → teljes termékoldal

**Méret:**
- Desktop: 720px wide modal
- Mobil: nincs gyors nézet — egyenesen a termékoldalra

**Animáció:** fade-in + scale (0.96 → 1)

**Bezárás:** ESC, X gomb, háttér kattintás

---

### 7.4 Akciós időzítő (countdown)

**Komponens:** `src/components/shop/SaleCountdown.astro`

**Megjelenés:**
- Termékkártyán: piros sáv tetején
- Termékoldalon: ár alatt egy sávon
- "Még 3 nap, 14 óra" formátum

**Logika:**
```js
const remaining = saleEndDate - new Date();
const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
```

**Frissítés:** percenként, csak desktop-on

**Tartalom:**
- Ha > 7 nap: ne mutasson (nincs sürgősség)
- Ha 1-7 nap: "Még 3 nap, 14 óra"
- Ha < 24 óra: "Már csak 14 óra"
- Ha < 1 óra: "Már csak 47 perc" (piros, lüktető)

**Anti-pattern elkerülés:** ne legyen "FAKE" countdown — csak valós akcióhoz.

---

### 7.5 Newsletter signup form footerben

**Komponens:** `src/components/common/NewsletterForm.astro`

**Helye:** footer felett, külön szekció (nem popup)

**Tartalom:**
```
SZAKMAI HÍRLEVÉL

Havonta egyszer Mónika kurátori válogatása: új termékek, 
oktató cikkek, kizárólagos kedvezmények előfizetőknek.

[ email cím ]  [ Feliratkozás ]

Adataidat kizárólag a hírlevélhez használjuk.
```

**Funkcionálisan:**
- Email validáció (formátum + duplikátum)
- Resend API-n keresztül double opt-in
- Sikeres feliratkozás után üdvözlő email
- `subscribers` D1 tábla: `email`, `subscribed_at`, `is_confirmed`, `unsubscribe_token`

**Stílus:**
- `--mona-warm` (patina arany) accent
- Inline form, nem popup

---

### 7.6 Termékcímkék (badge-ek)

**Komponens:** `src/components/shop/ProductBadges.astro`

**Logika** (priorizálva, csak max 2 jelenik meg):

| Prioritás | Címke | Mikor | Szín |
|---|---|---|---|
| 1 | `−XX%` | sale_price aktív | `--mona-sale` |
| 2 | `ÚJDONSÁG` | created_at < 30 nap | `--mona-success` |
| 3 | `ELFOGYÓBAN` | stock < low_stock_threshold | `--mona-sale` |
| 4 | `MÓNIKA AJÁNLJA` | is_mona_recommended = 1 | `--mona-warm` |
| 5 | `VEGÁN` | is_vegan = 1 | `--mona-nature` |
| 6 | `ILLATMENTES` | is_fragrance_free = 1 | outline |
| 7 | `CRUELTY-FREE` | is_cruelty_free = 1 | outline |

Termékkártyán: max 2 badge (a legfontosabb két)
Termékoldalon: mindegyik megjelenik

---

## 8. Akciós beállítások — admin felület

**Helye:** Admin → Akciók (új menüpont)

**Funkciók:**

### 8.1 Egyedi termék akció
- Termékkártyán: "Akció hozzáadása" gomb
- Modal: kezdő dátum, vég dátum, akciós ár vagy %
- Mentéskor: `sale_price`, `sale_price_effective_date` mezők frissülnek

### 8.2 Tömeges akció (kategória/márka)
- Pl. "Minden KRX termék -20% április végéig"
- Termékek lista checkbox-okkal
- Egy gombbal alkalmazás

### 8.3 Promóció kampány
- `promotions` tábla
- Pl. "Anyák napja kampány"
- Kapcsolódó termékek
- Banner image (R2-be tölthető)
- Webshop tetején megjelenik

### 8.4 Időszakos akciók
- Beütemezhető előre
- Cron-szerű worker éjfélkor aktiválja/deaktiválja
- KV cache tisztítás amikor változik

---

## 9. Sprint 2 prioritások (módosítva a katalógus alapján)

A Sprint 2 most **két szakaszra** oszlik:

### Sprint 2A — Layout finomítás + alapkomponensek
1. Header scroll-direction logika
2. Mobile menu scroll lock fix (iOS-kompatibilis)
3. Sticky footer pattern
4. Scroll-padding-top minden anchor alá
5. Cookie Consent komponens
6. Toast komponens
7. Newsletter form footerben
8. **Akkor jelezz, ha ez kész — innen indul a 2B**

### Sprint 2B — Statikus oldalak migrálása
9. Főoldal (új designnal)
10. Rólam (Mónika E-E-A-T)
11. Szolgáltatások hub + sub-pageek
12. Blog (lista + cikk template)
13. Galéria
14. Vélemények
15. Kapcsolat
16. Bejelentkezés (új design)
17. 404 + 500 hibaoldalak

---

## 10. Eldöntendő kérdések Sprint 2A előtt

### A) Cookie consent provider
- **Saját implementáció** (több munka, de saját design)
- **Külső pl. Cookiebot, OneTrust** (ingyenes, de nem testreszabott)
- **Iubenda** (közepes ár, integrált)

### B) Newsletter szolgáltatás
- **Resend** (jelenleg használt) — kicsi listához OK
- **Mailchimp** (ingyenes 500-ig) — gazdag template editor
- **Loops.so** (modern, fizetős) — automatikus flow-k

### C) Akciós időzítő stílus
- Csendes — szöveg "Még 3 nap"
- Hangosabb — vizuális számláló (3 napok 14 óra 22 perc)
- Vegyes — termékoldalon hangosabb, kártyán csendes

---

## Implementáció sorrend

A 2A sprint a **Sprint 1 mellé** kerül (nem új mappa) — ugyanabba a `monabeauty_reorg` projektbe csak új fájlok és néhány meglévő frissítése:

```
src/
├── styles/
│   └── tokens.css                ← +scroll-padding, +touch target
├── components/
│   └── common/
│       ├── Header.astro          ← +scroll-direction logika
│       ├── CookieConsent.astro   ← ÚJ
│       ├── Toast.astro           ← ÚJ
│       └── NewsletterForm.astro  ← ÚJ
├── lib/
│   ├── cart.ts                   ← ÚJ — kosár logika (localStorage)
│   ├── toast.ts                  ← ÚJ — toast trigger
│   └── consent.ts                ← ÚJ — cookie consent állapot
└── layouts/
    └── BaseLayout.astro           ← +CookieConsent + Toast container
```

Várom a választ a 10-es kérdésekre, és onnan indul a 2A sprint kódja.
