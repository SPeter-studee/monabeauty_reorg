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

## ⏳ Sprint 2B (3. kör) — Maradék statikus oldalak

**Cél**: Vélemények, galéria, jogi oldalak, főoldal bővítés.

### Mit fogunk építeni

- `/galeria` — fotó gallery (Mónika fotói, kezelési előtt-utáni)
- `/velemenyek` — vendég vélemények (statikus markdown vagy D1-ben — eldöntendő)
- `/szalon` — Vác Local SEO oldal
- `/aszf` — Általános Szerződési Feltételek
- `/adatvedelem` — GDPR / privacy policy
- `/cookies` — Cookie tájékoztató
- `/szallitas` — FoxPost / GLS infó
- `/bejelentkezes`, `/regisztracio` — login form (Sprint 4-ben funkcionálissá)
- `/500` — egyedi 500 hibaoldal

**Főoldal bővítés:**
- `HomeHero.astro` — Mónika + CTA
- `BrandPillars.astro` — 4 alapelv (csendes/személyes/természetes/szakmai)
- `ServicesPreview.astro` — 3-4 kiemelt szolgáltatás
- `ShopPreview.astro` — Mónika ajánlja termékek (Sprint 3 után élő adat)
- `BlogPreview.astro` — legutolsó 3 cikk
- `Breadcrumb.astro`
- `SocialBar.astro`

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
| Sprint 2B (3. kör) | TBD | ⏳ | 10+ |
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
