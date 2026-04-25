# monabeauty_reorg → Cloudflare **monabeauty2**

Tiszta **Mona Studio** projekt; a **tartalom és DB** ugyanazokkal a Cloudflare erőforrásokkal köthető össze, mint a legacy `monabeuty` (lásd `wrangler.toml`).

## Cloudflare Pages (Git: `SPeter-studee/monabeauty_reorg`)

1. **Build settings** (projekt → Settings → Builds & deployments):
   - **Build command:** `npm run build` (vagy üresen hagyva is lehet statikusnál; ha hibázik, használd `npm run build`).
   - **Build output directory:** `/` (gyökér).
   - **Root directory:** `/` (ha a repo gyökere a site).
2. **Bindings** (Settings → **Functions** → **Bindings** — vagy Workers compat nézetben „Add binding”):
   - **KV namespace** → neve: **`CONTENT`** → válaszd a meglévő namespace-t (site tartalom / oauth state).
   - **KV namespace** → neve: **`CHAT_RATE_LIMIT`** → a meglévő rate-limit KV.
   - **D1** → neve: **`DB`** → vagy **`monabeauty-reviews`** (legacy), vagy **`monastudio-v2-db`**: ha az újat választod, a **database_id**-t másold a D1 konzolból a `wrangler.toml`-ba is.
3. **Environment variables / Secrets** (Settings → Variables): másold át a régi Pages projektről (`ADMIN_SECRET`, `GOOGLE_*`, stb.) — lásd `.env.example`.

A binding **neveknek** (`CONTENT`, `DB`, `CHAT_RATE_LIMIT`) egyezniük kell a Worker kóddal.

## „Latest build failed”

- Ellenőrizd a **Build logs**-ot: gyakori ok hiányzó `package.json` / rossz output könyvtár.
- Ez a repó tartalmaz `npm run build` no-opot és `engines.node >= 18`-at.

## Lokális deploy (wrangler)

```bash
npm install
npm run deploy
```

(`--project-name monabeauty2` a scriptben.)

## Titkok

- Lokális: `.dev.vars` (ne commitold).
- Éles: Pages → Variables / Secrets.

## Health

Éles/preview: `GET /api/health` — a válaszban `bindings` mutatja, hogy a runtime látja-e a `DB` / `CONTENT` / `CHAT_RATE_LIMIT` bindingeket.
