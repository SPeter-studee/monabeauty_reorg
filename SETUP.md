# Mona Studio V2 — Setup útmutató

A starter csomag tartalmazza a **Sprint 1 + Sprint 2A** teljes anyagát Astro keretrendszerre építve.

---

## 1. Lokális indítás

### 1.1 Csomagolás kibontása
A ZIP tartalmát másold be a **lokális `monabeauty_reorg/` mappába** (vagy a GitHub repo-d lokális klónjába — a klón mappaneve lehet más is, az alábbi `cd` parancsot ahhoz igazítsd).

### 1.2 Függőségek telepítése
```powershell
cd monabeauty_reorg
npm install
```

### 1.3 Lokális env vars
Másold át `.dev.vars.example` → `.dev.vars` névre, és töltsd ki a kulcsokkal a régi projektből (Cloudflare → monabeauty → Settings → Environment Variables).

### 1.4 Lokális szerver
```powershell
npm run dev
```
Megnyílik: `http://localhost:4321`

---

## 2. GitHub push

```powershell
git init
git add .
git commit -m "Sprint 1 + 2A — Astro alap, design system, consent, toast, newsletter"
git branch -M main
git remote add origin https://github.com/SPeter-studee/monabeauty_reorg.git
git push -u origin main
```

---

## 3. Cloudflare Pages projekt létrehozása

> **Megjegyzés a nevekről:** az alábbi parancsokban szereplő `monastudio-v2-db`, `monastudio-v2-content` és `monastudio-v2` (Pages projekt név) a **referencia ajánlott** elnevezéseink. Ha eltérő nevet választottál Cloudflare-en (pl. `monabeauty2`), használd a saját neveidet — a `wrangler.toml`-ba is azokat írd. A binding változónevek (`DB`, `CONTENT`, `PRODUCT_IMAGES`) viszont **kötelezően ezek**, mert a kód ezekre hivatkozik.

### 3.1 Új Pages projekt
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages**
2. **Connect to Git** → válaszd ki: `SPeter-studee/monabeauty_reorg` (vagy a saját repó neved)
3. Build beállítások:
   ```
   Framework preset:       Astro
   Build command:          npm run build
   Build output directory: dist
   Root directory:         /
   ```
4. **Save and Deploy**

Az első build sikertelen lesz, mert még nincsenek bindings és env vars — **ez teljesen normális**. A bindings opciók csak az első deploy után jelennek meg (lásd 4. szekció).

---

## 4. Cloudflare bindings beállítása

> ⚠️ **Fontos a sorrend (Direct Upload mód):**
> A Cloudflare Pages-ben a **bindings** (D1, KV, R2) és **environment variables** csak akkor állíthatók be a dashboardon, **ha már volt legalább egy sikeres deploy** — üres projektnél nem jelennek meg ezek az opciók.
>
> Tehát:
> 1. Először `git push` a kódot
> 2. Cloudflare auto-build elindul → első deploy lefut (akár hibásan a hiányzó bindings miatt — ez OK)
> 3. Csak ezután találod meg a Settings → Bindings menüpontot
> 4. Bindings + env vars beállítás után új commit / re-deploy → működik
>
> Ha az "üres projektre" buildelsz előbb és csak utána jönnek a bindings, az teljesen normális.

### 4.1 D1 adatbázis
**Cloudflare dashboard → Workers & Pages → D1**:
1. **Create database**: név = `monastudio-v2-db`
2. Kapsz egy **database_id**-t — másold ki!

### 4.2 KV namespace
**Cloudflare dashboard → Workers & Pages → KV**:
1. **Create namespace**: név = `monastudio-v2-content`
2. Kapsz egy **namespace_id**-t — másold ki!

### 4.3 R2 bucket
**Cloudflare dashboard → R2**:
1. **Create bucket**: név = `mona-products-v2`
2. Location: Eastern Europe (Automatic)
3. **Create**

(Custom domain `images-v2.monastudio.hu` később, sprint 3-nál, amikor termékképek jönnek.)

### 4.4 Bindings hozzáadása a Pages projekthez
**Cloudflare dashboard → Workers & Pages → monastudio-v2 → Settings → Bindings**:

```
D1 database:
  Variable name: DB
  Database:      monastudio-v2-db

KV namespace:
  Variable name: CONTENT
  KV namespace:  monastudio-v2-content

R2 bucket:
  Variable name: PRODUCT_IMAGES
  Bucket:        mona-products-v2
```

Ezt **Production** scope-ban add hozzá, és külön **Preview** scope-ban is (a preview deployment-ekhez).

### 4.5 wrangler.toml frissítés
A `wrangler.toml` fájlban cseréld le a placeholder-eket:
```toml
[[d1_databases]]
binding = "DB"
database_name = "monastudio-v2-db"
database_id = "ITT_AZ_ID_AMIT_KAPTÁL"   # 4.1-ből

[[kv_namespaces]]
binding = "CONTENT"
id = "ITT_A_KV_ID"                       # 4.2-ből

[[r2_buckets]]
binding = "PRODUCT_IMAGES"
bucket_name = "mona-products-v2"
```

Commit + push → Cloudflare automatikusan újradeployolja.

---

## 5. Environment Variables Cloudflare-ben

A `.dev.vars` tartalmát **be kell vinni** a Cloudflare dashboardra is, hogy éles deployment-en is működjön.

**Cloudflare Pages → monastudio-v2 → Settings → Environment Variables**:

| Variable | Type | Scope |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Secret | Production + Preview |
| `GOOGLE_CLIENT_SECRET` | Secret | Production + Preview |
| `RESEND_API_KEY` | Secret | Production + Preview |
| `MAILCHIMP_API_KEY` | Secret | Production + Preview |
| `MAILCHIMP_AUDIENCE_ID` | Plaintext | Production + Preview |
| `MAILCHIMP_SERVER` | Plaintext | Production + Preview |
| `FOXPOST_USERNAME` | Secret | Production + Preview |
| `FOXPOST_PASSWORD` | Secret | Production + Preview |
| `FOXPOST_API_KEY` | Secret | Production + Preview |
| `SETMORE_REFRESH_TOKEN` | Secret | Production + Preview |
| `ANTHROPIC_API_KEY` | Secret | Production + Preview |
| `DEEPL_API_KEY` | Secret | Production + Preview |

A Secret típus titkosítva tárolódik, csak runtime-ban látszik.

---

## 6. Google OAuth Client frissítés

A meglévő Google Cloud Console OAuth Client-hez **add hozzá** az új redirect URI-t:

**Google Cloud Console → APIs & Services → Credentials → Edit Client**:

Authorized redirect URIs:
```
https://monastudio.hu/api/auth/google-callback           (régi, marad)
https://monastudio-v2.pages.dev/api/auth/google-callback (ÚJ — Cloudflare alapdomain)
https://dev.monastudio.hu/api/auth/google-callback       (ha lesz aldomain)
```

---

## 7. Dev domain (opcionális, javasolt)

Ha szeretnél `dev.monastudio.hu`-t (jobb mint `pages.dev`):

### 7.1 DNS rekord
**Cloudflare dashboard → DNS → Records**:
```
Type:   CNAME
Name:   dev
Target: monastudio-v2.pages.dev
Proxy:  ✓ (narancssárga felhő)
TTL:    Auto
```

### 7.2 Custom domain a Pages projekten
**Cloudflare → Workers & Pages → monastudio-v2 → Custom domains**:
1. **Set up a custom domain**
2. Domain: `dev.monastudio.hu`
3. Activate

Pár perc alatt kiépül az SSL és működik.

---

## 8. Mit nézz meg deploy után

Nyisd meg: `https://monastudio-v2.pages.dev` (vagy `dev.monastudio.hu`)

✅ Hero szekció megjelenik tört bézs háttérrel  
✅ Header sticky, lefelé scroll-on eltűnik  
✅ Mobile menü hamburger működik (mobil méreten)  
✅ 1.5 mp után megjelenik a cookie banner  
✅ Cookie modal — 3 kategóriás  
✅ Kosár ikon számláló (üres a kosár, semmi nem látszik)  
✅ Footer linkek, social ikonok  
✅ Footer "Cookie beállítások" gomb újra megnyitja a modalt  

---

## 9. Mi NINCS még bent (későbbi sprintekben jön)

❌ Tényleges oldalak (csak a főoldal van — Sprint 2B)  
❌ Webshop (Sprint 3)  
❌ Auth + profil (Sprint 4)  
❌ Admin (Sprint 5)  
❌ Integrációk (Sprint 6)  
❌ Adat migráció a régi D1-ből (Sprint 7)  

Akkor jelezz, ha:
1. A starter működik a dev environmenten
2. Mehet a Sprint 2B (statikus oldalak)

---

## 10. Hibakeresés

### "Module not found: @astrojs/cloudflare"
```powershell
npm install @astrojs/cloudflare astro
```

### Build sikertelen — "Missing binding DB"
A bindings beállítás (4.4 lépés) hiányos, vagy a wrangler.toml ID-k nem a Cloudflare dashboard-on lévőkre mutatnak.

### "401 Unauthorized" Google login-nél
A Google OAuth Client-hez nem adtad hozzá az új redirect URI-t (6. lépés).

### Newsletter form "Service unavailable"
A Mailchimp env vars nincsenek beállítva Cloudflare-en (5. lépés).

### Cookie banner nem jelenik meg
- Új ablakban (incognito) nyisd meg
- localStorage-ban töröld: `mona_consent`
- Pár oldalfrissítés után jelenik meg (1.5s delay)

---

## Hasznos linkek

- Astro docs: https://docs.astro.build
- Cloudflare Pages: https://developers.cloudflare.com/pages
- Cloudflare D1: https://developers.cloudflare.com/d1
- Mailchimp API: https://mailchimp.com/developer/marketing/api
