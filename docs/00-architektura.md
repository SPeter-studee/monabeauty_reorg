# 00 — Architektúra

A Mona Studio V2 rendszer **technikai architektúrája**: tech stack, komponens diagram, adatfolyamok, deployment topológia.

---

## Tech stack

### Frontend
- **Astro 4** — meta-framework (SSG + SSR vegyes), Vite alapú
- **TypeScript** — szigorú típusok
- **CSS** — saját design system, nincs Tailwind / komponens könyvtár
- **Lucide ikonok** — SVG inline (nincs ikon font)

### Backend
- **Cloudflare Pages Functions** — serverless TS endpointok az `/api/*` útvonalakon
- **D1** — Cloudflare SQLite (binding: `DB`)
- **KV** — kulcs-érték store cache-hez (binding: `CONTENT`)
- **R2** — object storage termékképekhez (binding: `PRODUCT_IMAGES`)

### Külső szolgáltatások
- **Resend** — tranzakciós email küldés
- **Mailchimp** — hírlevél listák, double opt-in
- **Google OAuth** — admin (Mónika) belépés
- **FoxPost** — csomagautomata szállítás
- **GLS** — házhozszállítás (Sprint 6-ban)
- **Setmore** — időpontfoglalás
- **Anthropic** — chatbot + AI termék import
- **DeepL** — automatikus HU/EN fordítás

---

## Deployment topológia

```
GitHub: SPeter-studee/monabeauty_reorg (main branch)
                     │
                     ▼ (auto-deploy webhook)
            Cloudflare Pages: monabeauty2
                     │
        ┌────────────┼────────────────┐
        ▼            ▼                ▼
    Pages SSR     D1 binding      R2 binding
   (Worker JS)    (DB)            (PRODUCT_IMAGES)
        │            │                │
        ▼            ▼                ▼
   monabeauty2.   monastudio-     mona-products-v2
   pages.dev      v2-db           bucket

   Env vars:
   - GOOGLE_CLIENT_ID / SECRET (OAuth)
   - RESEND_API_KEY (email)
   - MAILCHIMP_API_KEY / AUDIENCE_ID / SERVER (newsletter)
   - FOXPOST_USERNAME / PASSWORD / API_KEY (Sprint 6-tól)
   - SETMORE_REFRESH_TOKEN (Sprint 6-tól)
   - ANTHROPIC_API_KEY (chatbot, AI)
   - DEEPL_API_KEY (fordítás)
```

### Két környezet stratégia

**Production (régi)**: `monabeauty` projekt → `monastudio.hu` — élesben fut, érintetlen marad amíg V2 nem készül el.

**Development (új)**: `monabeauty2` projekt → `monabeauty2.pages.dev` (később `dev.monastudio.hu`) — itt fejlesztünk.

**Cutover** (Sprint 7): DNS váltás `monastudio.hu` → V2, régi `legacy.monastudio.hu`-n marad backup-ként.

---

## Mappa struktúra

```
monabeauty_reorg/
├── public/                       statikus fájlok (favicon, og-default, robots.txt)
├── scripts/
│   └── generate-webp.mjs         WebP-generátor sharp-pal
├── src/
│   ├── components/
│   │   ├── common/               Header, Footer, CookieConsent, Toast,
│   │   │                         Newsletter, PageHero, ContactForm
│   │   ├── shop/                 ProductCard, FilterPanel, Cart, SaleCountdown (Sprint 3-tól)
│   │   ├── blog/                 BlogCard
│   │   └── admin/                AdminGate, AdminSidebar (Sprint 5-től)
│   ├── content/                  Astro Content Collections
│   │   ├── config.ts             schema (blog + services)
│   │   ├── blog/                 markdown cikkek
│   │   └── services/             markdown szolgáltatás oldalak
│   ├── i18n/                     hu.json, en.json, utils.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro      teljes oldal sablon (header + footer + meta)
│   │   ├── ShopLayout.astro      (Sprint 3)
│   │   └── AdminLayout.astro     (Sprint 5)
│   ├── lib/                      helper függvények (consent, toast, cart, auth, db)
│   ├── pages/
│   │   ├── index.astro           főoldal
│   │   ├── rolam.astro
│   │   ├── kapcsolat.astro
│   │   ├── 404.astro
│   │   ├── blog/
│   │   │   ├── index.astro       lista
│   │   │   └── [slug].astro      egyedi cikk
│   │   ├── szolgaltatasok/       (Sprint 2B 2. kör)
│   │   ├── webshop/              (Sprint 3)
│   │   └── api/                  serverless endpointok
│   │       ├── contact.ts
│   │       └── newsletter/
│   │           └── subscribe.ts
│   └── styles/
│       ├── tokens.css            CSS változók
│       ├── reset.css
│       ├── layout.css
│       └── components/           komponens-specifikus stílusok
├── docs/                         projekt dokumentáció
├── astro.config.mjs              Astro + Cloudflare adapter
├── wrangler.toml                 Cloudflare bindings + projekt név
├── package.json
├── tsconfig.json
├── env.d.ts                      Astro env típusok (CF bindings)
├── .dev.vars.example             lokális env vars sablon
├── .gitignore
├── .cursorrules                  Cursor automatikus kontextus
├── README.md                     projekt áttekintés
├── SETUP.md                      setup útmutató
└── SPRINT-2A-README.md           sprint specifikus dokumentum
```

---

## Komponens hierarchia

```
BaseLayout
├── <head> (meta, OG, Schema.org BeautySalon)
├── Header (sticky, scroll-direction aware)
│   ├── Logo
│   ├── Navigation
│   ├── Language switcher (HU / EN)
│   ├── Cart icon
│   ├── Login icon
│   └── Mobile hamburger menu
├── <main> {slot}
├── Footer
│   ├── Brand info + social
│   ├── Shop / Salon / Info linkek
│   └── Legal links + Cookie beállítások gomb
├── CookieConsent (banner + 3 kategóriás modal)
├── ToastContainer (events alapján)
└── Analytics scripts (consent-gated)
```

### Oldal-szintű komponensek

```
PageHero    (használja: rólam, blog, kapcsolat, szolgáltatások stb.)
├── Eyebrow
├── Title (h1)
├── Description
└── Breadcrumb

NewsletterForm (használja: footer felett vagy egy szekcióban)
└── Mailchimp double opt-in

ContactForm    (használja: kapcsolat oldal)
└── Resend API + KV rate limit

BlogCard       (használja: blog/index, főoldal blog preview)
```

---

## Adatfolyam — pl. kontakt form küldés

```
Felhasználó kitölti a formot
   ↓
Astro client-side JS (validáció)
   ↓
fetch POST /api/contact
   ↓
Cloudflare Pages Function (TS)
   ├── Validáció (név min 2 char, email regex, üzenet min 10 char, consent ≠ true → 400)
   ├── Rate limit ellenőrzés (KV: contact-rate-{IP} > 5/óra → 429)
   ├── Resend API hívás
   │   └── HTML email mona@monastudio.hu-ra (reply-to a felhasználó email)
   └── Response: { success: true } vagy { error: "..." }
   ↓
Felhasználó visszajelzést kap
```

---

## Adatfolyam — pl. termékoldal megnyitás (Sprint 3-ban)

```
Felhasználó: GET /webshop/cica-tonik
   ↓
Astro SSR Worker
   ├── KV cache check: products:cica-tonik
   │   └── Cache miss → D1 query
   ├── D1 query: SELECT * FROM products WHERE slug='cica-tonik' AND active=1
   ├── KV cache write (TTL 5 perc)
   ├── R2 image URLs összeállítás (signed vagy public)
   └── HTML render (BaseLayout + ProductDetail)
   ↓
Cloudflare CDN cache (5 perc)
   ↓
Felhasználó kapja a HTML-t
```

---

## Cookie consent + analytics flow

```
Első látogatás:
   1.5 mp után banner megjelenik (alulról csúszik)
   ↓
Felhasználó:
   - "Mindent elfogadok" → setConsent(true, true)
   - "Csak szükséges" → setConsent(false, false)
   - "Beállítások" → részletes modal nyílik
   ↓
mona-consent-change esemény dispatch
   ↓
BaseLayout script:
   - if isAllowed("analytics") → load GA4
   - if isAllowed("marketing") → load FB Pixel
   ↓
LocalStorage: mona_consent = { necessary: true, analytics, marketing, decidedAt, version }
```

A felhasználó később bármikor módosíthat a Footer "Cookie beállítások" gombjával.

---

## SSR vs Static prerender mátrix

| Oldal | Mód | Indok |
|---|---|---|
| `/` (főoldal) | SSR | Dinamikus webshop preview adatok |
| `/blog` lista | Static (prerender) | Cikkek lassan változnak |
| `/blog/[slug]` | Static (prerender) | Tartalom build idejű |
| `/szolgaltatasok` | Static | Stabil tartalom |
| `/szolgaltatasok/[slug]` | Static | Markdown alapú |
| `/rolam`, `/kapcsolat` | Static | Statikus tartalom |
| `/aszf`, `/adatvedelem`, stb. | Static | Jogi dokumentumok |
| `/webshop` (Sprint 3) | SSR | Készlet, akció, ár valós idejű |
| `/webshop/[slug]` (Sprint 3) | SSR | Termék adatok élő DB |
| `/admin/*` (Sprint 5) | SSR | Auth + élő adatok |
| `/api/*` | SSR (Function) | Backend endpointok |

A static oldalakat `export const prerender = true;` direktívával jelöljük.

---

## SEO + Schema.org

Minden oldal a `BaseLayout`-ot használja, amely automatikusan generál:

- `<title>` (oldal cím + " — Mona Studio")
- `<meta name="description">`
- Open Graph (og:title, og:description, og:image, og:url, og:locale, og:site_name)
- Twitter Card (summary_large_image)
- `<link rel="alternate" hreflang>` HU + EN változatokra
- `<link rel="canonical">`
- **Schema.org BeautySalon** JSON-LD: cím, geo, nyitvatartás, areaServed, social

Specifikus oldalak felülírják:
- `/rolam` → Schema.org Person (E-E-A-T)
- `/blog/[slug]` → Schema.org Article
- `/szolgaltatasok/[slug]` → Schema.org Service (Sprint 2B 2. kör)
- `/webshop/[slug]` → Schema.org Product (Sprint 3)

---

## Kapcsolódó dokumentumok

- [01-design-system.md](./01-design-system.md) — vizuális megvalósítás
- [06-api-reference.md](./06-api-reference.md) — endpointok részletesen
- [07-deployment.md](./07-deployment.md) — Cloudflare setup
