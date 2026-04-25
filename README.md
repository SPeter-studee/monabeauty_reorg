# Mona Studio — Astro Sprint 1

A Mona Studio weboldal **Astro keretrendszerre** való áttérésének első sprintje:
- Astro 4 + Cloudflare Pages adapter
- Design system v1.0 (Kiehl's / La Mer paletta — természetes prémium)
- Reszponzív header + footer komponensek
- BaseLayout SEO-val (Open Graph, Twitter, Schema.org BeautySalon)
- i18n routing (HU default, EN, könnyen bővíthető)
- TypeScript szigorú mód
- Cloudflare bindings (D1, KV, R2) bekötve

---

## Mappa-struktúra

```
public/                              ← statikus fájlok (favicon, og kép, robots.txt)
├── favicon.svg
├── favicon-32.png  + .webp
├── apple-touch-icon.png
├── og-default.jpg  + .webp
├── robots.txt
├── _redirects
└── _headers

scripts/
└── generate-webp.mjs                ← npm run images:webp

src/
├── components/
│   ├── common/        Header, Footer, Button, Badge, Modal
│   ├── shop/          ProductCard, FilterPanel, Cart (Sprint 3)
│   └── admin/         AdminGate, AdminSidebar (Sprint 5)
├── layouts/
│   ├── BaseLayout.astro          ← teljes oldal sablon
│   ├── ShopLayout.astro          ← (Sprint 3)
│   └── AdminLayout.astro         ← (Sprint 5)
├── pages/
│   ├── index.astro               ← főoldal
│   ├── api/                      ← API végpontok (auth, products...)
│   └── ...
├── styles/
│   ├── tokens.css                ← CSS változók (paletta, méretek)
│   ├── reset.css
│   ├── layout.css                ← container, grid, flex utility
│   └── components/               ← komponens stílusok
├── i18n/
│   ├── hu.json
│   ├── en.json
│   └── utils.ts
└── lib/                          ← auth, db, foxpost helpers

docs/                                ← projekt specifikációk (.cursorrules-szal)
```

---

## Setup

### 1. Függőségek telepítése
A projekt gyökerében (ahol a `package.json` van):
```powershell
npm install
```

### 2. Wrangler konfig kitöltése
A `wrangler.toml` fájlban cseréld le:
- `REPLACE_WITH_YOUR_D1_ID` → `monastudio-v2-db` D1 ID (vagy a saját V2 DB-d ID-ja)
- `REPLACE_WITH_YOUR_KV_ID` → `monastudio-v2-content` KV namespace ID

A két érték a Cloudflare dashboard → Storage & databases → D1 / KV részen található meg, miután létrehoztad őket.

### 3. Lokális fejlesztés
```powershell
npm run dev
```
Megnyílik: `http://localhost:4321`

### 4. Statikus képek: public/ → WebP → build

Új vagy frissített raszter képnél (JPG/PNG) ezt a 4 lépést kell követni:

1. **Bemásolás** — másold be a képet a `public/` mappába (vagy almappájába)
2. **WebP generálás** — `npm run images:webp` (csak az újabb képeket dolgozza fel — lásd `public/README.md` "WebP script viselkedése" szekciót, mtime alapú kihagyás)
3. **Build** — `npm run build` (a `dist/` gyökerébe kerülnek mindkét formátum)
4. **Hivatkozás a `BaseLayout`-ban** — alap `og:image` és Schema `image` automatikusan a `og-default.webp`-re mutat. Egyedi képek az `image` prop átadásával: `<BaseLayout image={new URL("/blog/cikk-cover.webp", Astro.site).href} ...>`

```powershell
npm run images:webp
npm run build
npm run preview
```

### 5. Deploy
```powershell
npm run deploy
```
Vagy manuálisan:
```powershell
npx wrangler pages deploy ./dist --project-name=monabeauty --commit-dirty=true
```

---

## Mit csinál ez a sprint

✅ **Design system v1.0 implementálva**
- Tört bézs + sötétzöld + szénszürke paletta (WCAG AAA)
- Cormorant Garamond serif címek + Inter sans body
- 8px alapú térköz skála
- Reszponzív breakpoint-ek (mobil → wide)

✅ **Reszponzív Header**
- Logo + tagline
- Desktop nav (1024px+)
- Mobile drawer menu
- Kosár ikon élő számlálóval (localStorage)
- Lang switcher (HU/EN)
- Profil ikon

✅ **Reszponzív Footer**
- 4 oszlopos grid (desktop), 1 oszlop (mobile)
- Social linkek
- Jogi linkek (ÁSZF, adatvédelem, cookies)

✅ **BaseLayout teljes SEO támogatással**
- Title + description + canonical
- Open Graph (Facebook)
- Twitter Card
- Hreflang (HU/EN)
- Schema.org BeautySalon JSON-LD
- Theme color
- Font preconnect/preload
- Skip link a screen readereknek

✅ **i18n alap**
- HU default, EN támogatott
- Új nyelv hozzáadása: új JSON fájl + utils.ts kiegészítés

---

## Mi NINCS még benne (későbbi sprintek)

❌ Webshop oldalak (Sprint 3)
❌ Termék adatlap (Sprint 3)
❌ Auth oldalak — bejelentkezés / regisztráció (Sprint 4)
❌ Profil oldal — ügyfél törzs (Sprint 4)
❌ Admin oldalak (Sprint 5)
❌ FoxPost / GLS / Setmore / Anthropic integrációk (Sprint 6 — backend Functions)

---

## Konvenciók

### Útvonal-aliasok
A `tsconfig.json` beállítja: `@/*` → `src/*`
```ts
import Header from "@/components/common/Header.astro";
import { getTranslations } from "@/i18n/utils";
```

### Szín tokenek használata CSS-ben
```css
.foo {
  background: var(--mona-surface);
  color: var(--mona-text);
  border: 0.5px solid var(--mona-border);
}
```

### Mobile-first
Minden CSS először a mobil méretre íródik, az `@media (min-width: ...)` query-k adják az override-ot a nagyobb képernyőkre.

```css
.foo {
  /* mobil */
  font-size: 14px;
}
@media (min-width: 768px) {
  .foo {
    /* tablet+ */
    font-size: 16px;
  }
}
```

### Új komponens hozzáadás
1. `src/components/{kategória}/{Név}.astro`
2. `src/styles/components/{név}.css`
3. CSS-t importáld a `BaseLayout.astro`-ban

### Új oldal hozzáadás
1. `src/pages/{útvonal}.astro`
2. Használd a `BaseLayout`-ot:
```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
---
<BaseLayout title="Oldalcím" description="...">
  <section class="section">
    <div class="container">
      <h1>Tartalom</h1>
    </div>
  </section>
</BaseLayout>
```

---

## Következő sprint (Sprint 2)

A jelenlegi statikus HTML oldalak migrálása Astro komponensekbe:
- Főoldal (jelenlegi tartalom + új design)
- Rólam oldal (Mónika E-E-A-T)
- Szolgáltatások (és sub-pageek)
- Blog (lista + cikk template)
- Galéria
- Vélemények
- Kapcsolat
- Bejelentkezés
- 404 / hiba oldalak

Akkor jelezz, ha készen vagy ezzel az alappal.
