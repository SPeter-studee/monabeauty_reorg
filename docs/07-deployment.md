# 07 — Deployment & Cloudflare Setup

A Mona Studio V2 **Cloudflare Pages**-en fut. Ez a dokumentum lépésről lépésre vezet végig a teljes setup-on, a tényleges projektünk értékeivel.

---

## Aktuális erőforrások

| Komponens | Név | Azonosító | Státusz |
|---|---|---|---|
| GitHub repo | `SPeter-studee/monabeauty_reorg` | `main` branch | ✅ Aktív |
| Cloudflare Pages projekt | `monabeauty2` | — | ✅ Aktív |
| Cloudflare URL | `monabeauty2.pages.dev` | — | ✅ Élő |
| Custom domain (tervezett) | `dev.monastudio.hu` | — | ⏳ Sprint 2B után |
| D1 adatbázis | `monastudio-v2-db` | `7b7e5aa5-b54f-4c17-94ab-ed0dedbf33d6` | ✅ Létrehozva |
| KV namespace (CONTENT) | `monastudio-v2-content` | `b2da4e4639ec4141a4f0c91ab3c5e8b7` | ✅ Bind-elve |
| R2 bucket | `mona-products-v2` | — | ✅ Létrehozva (üres) |

---

## Bindings a Pages projekten

**Cloudflare → Workers & Pages → monabeauty2 → Settings → Bindings**

| Variable name | Type | Resource | Scope |
|---|---|---|---|
| `DB` | D1 Database | `monastudio-v2-db` | Production + Preview |
| `CONTENT` | KV Namespace | `monastudio-v2-content` | Production + Preview |
| `PRODUCT_IMAGES` | R2 Bucket | `mona-products-v2` | Production + Preview |

> ⚠️ **Fontos**: A bindings opciók csak **az első sikeres deploy után** elérhetők a dashboardon. Ha üres a projekt, először push-olj egy commit-ot, várd meg a build-et, és csak utána tudod beállítani.

---

## Environment Variables

**Cloudflare → Workers & Pages → monabeauty2 → Settings → Environment Variables**

### Sprint 2A-tól szükséges

| Variable | Type | Forrás | Funkció |
|---|---|---|---|
| `RESEND_API_KEY` | Secret | régi `monabeauty` projekt | Email küldés (kontakt form, rendelés visszaigazolás) |
| `MAILCHIMP_API_KEY` | Secret | Mailchimp dashboard | Hírlevél feliratkozás |
| `MAILCHIMP_AUDIENCE_ID` | Plaintext | Mailchimp Audience settings | Lista azonosító |
| `MAILCHIMP_SERVER` | Plaintext | API key utolsó része (pl. `us21`) | Datacenter prefix |

### Sprint 4-től szükséges (auth)

| Variable | Type | Forrás |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Secret | Google Cloud Console — OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | Secret | Google Cloud Console |
| `FACEBOOK_APP_ID` | Secret | Facebook for Developers (App Settings → Basic) |
| `FACEBOOK_APP_SECRET` | Secret | Facebook for Developers (App Settings → Basic) |

**Google OAuth Redirect URI**:
- `https://monastudio.hu/api/auth/google-callback`
- `https://monabeauty2.pages.dev/api/auth/google-callback` (preview)

**Facebook OAuth Valid Redirect URIs**:
- `https://monastudio.hu/api/auth/facebook-callback`
- `https://monabeauty2.pages.dev/api/auth/facebook-callback`

**Mailchimp** (newsletter — Sprint 2A-tól, akár előbb is beállítható):
| Variable | Type | Forrás |
|---|---|---|
| `MAILCHIMP_API_KEY` | Secret | Mailchimp Account → Extras → API keys |
| `MAILCHIMP_AUDIENCE_ID` | Secret | Mailchimp Audience → Settings → Audience name and defaults |
| `MAILCHIMP_SERVER` | Variable | Pl. "us12" — az API key utáni szám |

### Sprint 6-tól szükséges (integrációk)

| Variable | Type | Forrás |
|---|---|---|
| `FOXPOST_USERNAME` | Secret | régi `monabeauty` projekt |
| `FOXPOST_PASSWORD` | Secret | régi `monabeauty` projekt |
| `FOXPOST_API_KEY` | Secret | régi `monabeauty` projekt |
| `SETMORE_REFRESH_TOKEN` | Secret | régi `monabeauty` projekt |
| `ANTHROPIC_API_KEY` | Secret | Anthropic console |
| `DEEPL_API_KEY` | Secret | DeepL account |
| `GLS_USERNAME` | Secret | GLS partner portál |
| `GLS_PASSWORD` | Secret | GLS partner portál |

Mindet **Production + Preview** scope-ba állítsuk be.

---

## Build configuration

**Cloudflare → Workers & Pages → monabeauty2 → Settings → Build configuration**

```
Framework preset:       Astro
Build command:          npm run build
Build output directory: dist
Root directory:         /  (vagy üres)
```

A `wrangler.toml` `pages_build_output_dir = "./dist"` automatikusan átveszi.

### Build environment variables (Cloudflare specifikus)

| Variable | Value | Indok |
|---|---|---|
| `NODE_VERSION` | `20` | Astro 4 + sharp Node 20-at preferál |
| `NPM_FLAGS` | `--legacy-peer-deps` | (csak ha peer dep konfliktus van) |

---

## Deploy folyamat

```
1. Lokális fejlesztés (Cursor)
   git add -A
   git commit -m "..."
   git push

2. GitHub webhook → Cloudflare Pages
   - Cloning repository
   - npm ci (clean install)
   - npm run build (Astro build)
   - dist/ feltöltés Cloudflare CDN-re
   - Worker compile + deploy

3. Production URL frissül: https://monabeauty2.pages.dev
```

A deploy időtartama átlagosan **45-60 másodperc** (npm install + Astro build).

---

## Custom domain (Sprint 2B után)

### dev.monastudio.hu beállítása

1. **Cloudflare → DNS → Records**:
   ```
   Type:   CNAME
   Name:   dev
   Target: monabeauty2.pages.dev
   Proxy:  ✓ (narancssárga felhő)
   TTL:    Auto
   ```

2. **Cloudflare → Workers & Pages → monabeauty2 → Custom domains**:
   - **Set up a custom domain**
   - Domain: `dev.monastudio.hu`
   - Activate

3. SSL automatikusan kiépül (Universal SSL)

### Robots noindex a dev oldalon

A `BaseLayout.astro`-ban:
```astro
{Astro.url.hostname.includes("dev.") && <meta name="robots" content="noindex, nofollow">}
```

Ez biztosítja hogy a Google ne indexelje a dev oldalt.

---

## Cutover (Sprint 7) — élesítés

Amikor a V2 kész és tesztelt:

```
1. Final adat szinkron:
   npx wrangler d1 export monabeauty-reviews --output=full-backup.sql --remote
   npx wrangler d1 execute monastudio-v2-db --file=full-backup.sql --remote

2. R2 képek átmásolása:
   node scripts/copy-r2-bucket.mjs --from=mona-products --to=mona-products-v2

3. DNS átállítás:
   - monastudio.hu CNAME → monabeauty2.pages.dev (V2)
   - legacy.monastudio.hu CNAME → monabeauty.pages.dev (régi backup, 6 hónap)

4. Custom domain átállítás Pages projekten:
   - monastudio.hu kerül a monabeauty2 projekthez
   - dev.monastudio.hu eltávolítva

5. Google OAuth Client redirect URI frissítés:
   Régi: https://monabeauty2.pages.dev/api/auth/google-callback
   Új:   https://monastudio.hu/api/auth/google-callback

6. Monitoring:
   - Cloudflare Analytics figyelése
   - Hibákra reagálás
   - 6 hónap után legacy törlése
```

---

## Google OAuth setup

A meglévő Google Cloud Console OAuth Client-hez add hozzá az új redirect URI-kat:

**Google Cloud Console → APIs & Services → Credentials → Edit Client**:

```
Authorized redirect URIs:
- https://monastudio.hu/api/auth/google-callback                  (régi, megmarad)
- https://monabeauty2.pages.dev/api/auth/google-callback          (V2 dev)
- https://dev.monastudio.hu/api/auth/google-callback              (custom domain után)
```

Cutover után csak a `monastudio.hu`-t kell megtartani.

---

## Lokális fejlesztés

### `.dev.vars` fájl

A lokális env vars-okat a `.dev.vars` fájlba kell írni (mint `.env`, de Cloudflare-specifikus):

```bash
# Sprint 4 — Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

# Sprint 2A — Email + newsletter
RESEND_API_KEY=...
MAILCHIMP_API_KEY=...
MAILCHIMP_AUDIENCE_ID=...
MAILCHIMP_SERVER=us21

# Sprint 6 — Integrációk
FOXPOST_USERNAME=...
FOXPOST_PASSWORD=...
SETMORE_REFRESH_TOKEN=...
ANTHROPIC_API_KEY=...
DEEPL_API_KEY=...
```

⚠️ **A `.dev.vars` SOSEM kerül commit-ba** (`.gitignore` kizárja).

A `.dev.vars.example` egy sablon — másold át és töltsd ki.

### Indítás

```powershell
npm run dev
```

Ez `http://localhost:4321`-en elérhető. A `platformProxy: { enabled: true }` az `astro.config.mjs`-ben gondoskodik arról, hogy a D1 / KV / R2 bindings lokálisan is elérhetők legyenek (Wrangler-en keresztül).

---

## Build lokálisan

```powershell
npm run build
```

A `dist/` mappába készül a build output:
- `dist/_worker.js/` — SSR Worker bundle
- `dist/_astro/` — JS / CSS chunk-ok (long-term cached)
- `dist/_routes.json` — Cloudflare routing config
- `dist/index.html`, `dist/blog/index.html`, stb. — prerender-elt HTML-ek

### Preview lokálisan

```powershell
npm run preview
```

Ez `wrangler pages dev ./dist`-et indít, ami **a Cloudflare környezethez nagyon hasonló módon** szolgálja az oldalt (D1 / KV / R2 emulálva).

---

## Troubleshooting

### "Module not found: @astrojs/cloudflare"
```powershell
npm install @astrojs/cloudflare astro
```

### Build sikertelen — "Output directory 'dist' not found"
- Az astro.config.mjs config error-t adott build közben
- Nézd meg a build logot, javítsd a hibát
- Tipikus: i18n config error → lásd `09-changelog.md` Sprint 2A kérdés

### Build sikertelen — "Invalid KV namespace ID (REPLACE_WITH_...)"
- A `wrangler.toml`-ban placeholder maradt
- Cseréld a valódi KV ID-re (lásd a táblázat fent)

### Build sikertelen — "R2 bucket not found"
- Hozd létre a bucket-et a Cloudflare R2 dashboardon
- Nem kell ID, csak a bucket név

### "401 Unauthorized" Google login-nél
- Google OAuth Client-hez nincs hozzáadva az új redirect URI
- Lásd a Google OAuth setup szekciót

### Newsletter form "Service unavailable"
- A Mailchimp env vars nincsenek beállítva Cloudflare-en
- Production + Preview scope-ba is be kell állítani

### Cookie banner nem jelenik meg
- Új ablakban (incognito) nyisd meg
- `localStorage`-ból töröld: `mona_consent`
- 1.5 mp delay után jelenik meg

### "There is nothing here yet" Cloudflare oldalon
- A projekt létezik de még nincs sikeres production deploy
- Vagy: a deploy preview-ként ment, nem production-ként
- Megoldás: production branch ellenőrzés (Settings → Builds & deployments)

### Régi commit-tal fut a build
- A Cloudflare GitHub webhook lassan jelez
- Trigger: üres commit (`git commit --allow-empty -m "Trigger" && git push`)
- Vagy Cloudflare-en: Deployments → 3 pont → Retry deployment

---

## Hasznos linkek

- [Cloudflare Pages docs](https://developers.cloudflare.com/pages)
- [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [Cloudflare R2](https://developers.cloudflare.com/r2)
- [Mailchimp API](https://mailchimp.com/developer/marketing/api)
- [Resend API](https://resend.com/docs/api-reference)
