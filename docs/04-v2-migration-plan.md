# Mona Studio V2 — Új projekt + dev környezet

**Cél:** Tiszta lapról építeni az új Mona Studio rendszert a megszerzett tapasztalatokra alapozva — Astro + Cloudflare stack, design system v1.0, az összes elkészült spec figyelembevételével.

A jelenlegi `monastudio.hu` éles oldal **érintetlen marad** amíg az új rendszer nem kész és tesztelt.

---

## 1. Architektúra

### 1.1 Két párhuzamos környezet

```
PRODUCTION                               DEV / STAGING
─────────────────────────────            ─────────────────────────────
Domain: monastudio.hu                    Domain: monastudio-v2.pages.dev
                                                 (vagy dev.monastudio.hu)
GitHub: SPeter-studee/monabeauty         GitHub: SPeter-studee/monastudio-v2
Cloudflare Pages: monabeauty             Cloudflare Pages: monastudio-v2

D1: monabeauty-reviews                   D1: monastudio-v2-db
KV: CONTENT (régi)                       KV: CONTENT (új namespace)
R2: mona-products                        R2: mona-products-v2

Stack: statikus HTML + Functions         Stack: Astro 4 + Functions

Státusz: ÉLES, érintetlen                Státusz: aktív fejlesztés
```

### 1.2 Cutover terv (amikor V2 kész)

```
1. Final teszt v2-n minden funkción
2. Adatok végleges szinkron (D1 export → import)
3. DNS váltás:
   monastudio.hu       → V2 Cloudflare Pages
   legacy.monastudio.hu → régi monabeauty (backup, 6 hónapig)
4. V2 deploy az élesbe
5. Monitoring, hibakeresés
6. 6 hónap után legacy törlés
```

---

## 2. Mit veszünk át és mit nem

### 2.1 Adatok — átvitel D1 export/import-tal

| Tábla | Átvitel | Megjegyzés |
|---|---|---|
| `orders` | ✅ Igen | Rendelések teljes történet |
| `customers` | ✅ Igen | Ügyfél törzs |
| `customer_sessions` | ❌ Nem | Új login után újra-gyártódnak |
| `customer_addresses` | ✅ Igen | Címkönyv |
| `reviews` | ✅ Igen | Termékvélemények |
| `subscribers` | ❌ N/A | Mailchimp-be költöztünk |

### 2.2 R2 képek — bucket sync

```powershell
# Termék képek átmásolása (Cloudflare API-n keresztül)
# Vagy egyszerűbb: wrangler R2 ls + r2 object get + r2 object put
npx wrangler r2 bucket create mona-products-v2

# Másoló script készül (Cloudflare API + listázás)
node scripts/copy-r2-bucket.mjs --from=mona-products --to=mona-products-v2
```

### 2.3 Mit hagyunk el a régi rendszerből

- Rossz minőségű termékképek (új fotózás javasolt)
- Statikus HTML fájlok régi designnal
- Régi CSS (cormorant garamond body fonttal)
- ADMIN_SECRET alapú auth (Google OAuth-ra kicserélve)
- Régi admin gate JS (mona-admin-gate.js)
- Sötét + arany paletta (új: krémes prémium)

### 2.4 Mit viszünk át módosítva

- Setmore integráció (refresh token + KV cache logika megmarad)
- FoxPost integráció (sandbox + éles mód)
- Anthropic chatbot (Cloudflare Functions kód)
- DeepL fordító (i18n alapra építve)
- Resend email küldés
- Google OAuth (csak a callback URL változik új domainre)

---

## 3. Új projekt setup

### 3.1 GitHub repo
```
Név: SPeter-studee/monastudio-v2
Visibility: Private (vagy Public, te döntöd)
```

### 3.2 Cloudflare Pages projekt
```
Név: monastudio-v2
GitHub source: SPeter-studee/monastudio-v2
Branch: main
Build command: npm run build
Build output: dist
Root directory: /
```

### 3.3 Új Cloudflare bindings (V2-höz külön)

**D1 adatbázis:**
```powershell
npx wrangler d1 create monastudio-v2-db
# Eredmény: új database_id
```

**KV namespace:**
```powershell
npx wrangler kv:namespace create monastudio-v2-content
# Eredmény: új KV id
```

**R2 bucket:**
```
Cloudflare dashboard → R2 → Create bucket: mona-products-v2
Custom domain: images-v2.monastudio.hu (vagy ideiglenesen csak r2.dev)
Pages binding: PRODUCT_IMAGES → mona-products-v2
```

### 3.4 Env vars — másolás a régi projektből

A meglévő env vars közül átkerül:
- `GOOGLE_CLIENT_ID` (új redirect URI hozzáadása Google Console-ban!)
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `FOXPOST_USERNAME` / `PASSWORD` / `API_KEY`
- `SETMORE_REFRESH_TOKEN`
- `ANTHROPIC_API_KEY`
- `DEEPL_API_KEY`

**Új env vars:**
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_AUDIENCE_ID`
- `MAILCHIMP_SERVER`

### 3.5 Google OAuth Client frissítés

A meglévő Client ID-hez add hozzá az új redirect URI-t:
```
https://monastudio-v2.pages.dev/api/auth/google-callback
https://dev.monastudio.hu/api/auth/google-callback (ha lesz aldomain)
https://monastudio.hu/api/auth/google-callback (cutover után)
```

A Google Cloud Console → APIs & Services → Credentials → Edit Client → Authorized redirect URIs.

---

## 4. Sprint terv az új projekthez

### Sprint 1 ✅ (már kész)
- Astro setup, Cloudflare adapter
- Design system v1.0
- Header, Footer, BaseLayout
- i18n (HU/EN)

### Sprint 2A ✅ (már kész)
- Cookie consent (3 kategóriás GDPR)
- Toast üzenetek
- Newsletter (Mailchimp)
- Akciós időzítő
- Layout javítások (sticky footer, scroll lock, hover lock)

### Sprint 2B — Statikus oldalak
- Főoldal hero + brand szekciók
- Rólam (E-E-A-T Mónika)
- Szolgáltatások hub + 8 sub-page
- Blog lista + cikk template
- Galéria
- Vélemények
- Kapcsolat
- Bejelentkezés (Google + email/jelszó)
- Cookie tájékoztató, ÁSZF, Adatvédelem, Szállítás
- 404 / 500 oldalak

### Sprint 3 — Webshop
- Webshop hub szűrőkkel
- Kategória oldalak
- Egyedi termékoldal
- Kosár oldal
- Pénztár (FoxPost, GLS, guest/login)
- Kívánságlista (wishlist)

### Sprint 4 — Ügyfél törzs
- Profil oldal (rendelések, címkönyv, wishlist)
- Email+jelszó regisztráció (Google mellett)
- Rendelési előzmények tracking-gel

### Sprint 5 — Admin
- Dashboard (statisztikák)
- Termékkezelő (R2 képfeltöltővel)
- Ügyfélkezelő (Mónika jegyzetekkel)
- Rendelés kezelő
- Setmore unified activity
- Akció kezelő
- Hűségpont rendszer

### Sprint 6 — Integrációk + AI
- FoxPost (átemelés régiből)
- GLS (új)
- Setmore unified activity
- Anthropic chatbot
- AI termék import (PDF számla → strukturált adat)
- Google Merchant Center feed

### Sprint 7 — Cutover
- Adatok migrálás végleges
- DNS átállítás
- Monitoring
- Régi `monabeauty` projekt → `legacy.monastudio.hu`

---

## 5. Adatok átvétele — script

### 5.1 D1 export/import
```powershell
# Export régi DB-ből (csak az átviendő táblák)
npx wrangler d1 execute monabeauty-reviews --remote --command="
  SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN
  ('orders','customers','customer_addresses','reviews')
" > schema-old.sql

# Adat dump (egyenként, kontrolláltan)
npx wrangler d1 export monabeauty-reviews --output=full-backup.sql --remote

# Import a V2 DB-be
npx wrangler d1 execute monastudio-v2-db --file=full-backup.sql --remote
```

### 5.2 R2 sync script

`scripts/copy-r2-bucket.mjs` — Cloudflare API-n keresztül a régiből az újba. Külön elkészítendő ha kell.

---

## 6. Dev oldal — javasolt aldomain

Ha rendezett dev környezet kell, ajánlott:

**dev.monastudio.hu beállítás (ingyenes):**
1. Cloudflare DNS → Add record
2. Type: CNAME
3. Name: `dev`
4. Target: `monastudio-v2.pages.dev`
5. Proxy: ON (narancs felhő)

A Cloudflare Pages-ben:
1. monastudio-v2 → Custom domains → Add: `dev.monastudio.hu`

Eredmény: `https://dev.monastudio.hu` — gyors, SSL automatikus, és professzionálisabb mint a `.pages.dev`.

**Bot tiltás:** A dev oldalt a Google ne indexelje. A BaseLayout-ban:
```astro
{Astro.url.hostname.includes("dev.") && <meta name="robots" content="noindex, nofollow">}
```

---

## 7. Mit teszünk most konkrétan

### A) Új GitHub repo készítése
1. github.com → New repository → `monastudio-v2`
2. Visibility: Private (javasolt)
3. README, gitignore (Node), license: nem szükséges

### B) Új Cloudflare Pages projekt
1. Cloudflare dashboard → Workers & Pages → Create → Pages
2. Connect to Git → SPeter-studee/monastudio-v2
3. Build settings:
   - Framework preset: Astro
   - Build command: `npm run build`
   - Build output: `dist`
4. Save and Deploy (lesz egy üres első build, az OK)

### C) Cursorban új projekt
1. Új mappa lokálisan: `monastudio-v2/`
2. Sprint 1 + Sprint 2A fájlok bemásolva (már megvannak az output mappákban)
3. `git init` + push GitHub-ra
4. Auto deploy fut Cloudflare Pages-en

### D) Bindings beállítás
1. D1, KV, R2 létrehozás (CLI parancsokkal vagy dashboardon)
2. Pages → Settings → Bindings hozzáadás
3. Env vars átmásolás a régi projektből (Production scope-ba)

### E) Adat migráció (amikor a sémák megvannak)
1. SQL migrációk futtatása V2 DB-n
2. Régi adatok export → V2 import
3. R2 képek sync

---

## 8. Eldöntendő — domain név dev-hez

```
1. monastudio-v2.pages.dev    (ingyenes, Cloudflare alap)
2. dev.monastudio.hu          (saját aldomain, profibb)
3. v2.monastudio.hu           (alternatív aldomain)
4. staging.monastudio.hu      (staging konvenció)
```

Mindegyik használható, **dev.monastudio.hu** a legszokványosabb.

---

## 9. Becsült időkeret

| Sprint | Becsült idő (kódolásra Cursor-ral) |
|---|---|
| Sprint 1 | ✅ Kész |
| Sprint 2A | ✅ Kész |
| Sprint 2B (statikus oldalak) | 2-3 nap |
| Sprint 3 (webshop) | 3-5 nap |
| Sprint 4 (ügyfél törzs) | 2-3 nap |
| Sprint 5 (admin) | 3-4 nap |
| Sprint 6 (integrációk) | 2-3 nap |
| Sprint 7 (cutover) | 1 nap |

**Total: ~3 hét intenzív munkával**

Az idő becslések feltételezik:
- Mónika fotói és termékfotók készen vannak
- Mailchimp lista létrehozva
- Google Cloud Console-ban OAuth kliens frissítve
- Új Cloudflare projekt + D1 + KV + R2 létrehozva

---

## 10. Mi szükséges hogy elinduljunk

Cursor-os munkához ezek kellenek:

1. **GitHub repo létrehozva**: `SPeter-studee/monastudio-v2`
2. **Cloudflare Pages projekt létrehozva**: `monastudio-v2`
3. **D1 / KV / R2 bindings beállítva**
4. **Env vars átmásolva** a régi projektből + Mailchimp új vars
5. **Google OAuth redirect URI hozzáadva** az új domainhez

Ha ezeket megcsináltad, jelezz, és csomagolom egy `monastudio-v2-starter.zip`-be a Sprint 1 + Sprint 2A teljes anyagát, hogy rögtön be tudd húzni Cursor-ba és git push.

---

## Most mi a teendő?

A) **Készítsem el a starter ZIP-et** Cursor-ba húzáshoz — minden fájllal, package-lock-kal, README-vel?

B) **Várjuk meg amíg létrehozod a Cloudflare projektet** — utána a wrangler.toml-be a valódi ID-k kerülnek?

C) **Sprint 2B-t építsük már most** és a starter-be belekerül?
