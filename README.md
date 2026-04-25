# monabeauty_reorg

Tiszta **Mona Studio** webprojekt-váz: cél a fokozatos átvitel a `monabeuty` repóból, majd **működő preview** után éles átállás.

## Előfeltétel

- [Cloudflare](https://dash.cloudflare.com/) fiók, **Pages** projekt név: `monabeauty_reorg` (vagy módosítsd a `package.json` deploy scriptet).
- `npx wrangler login`

## Titkok / API kulcsok

- Lokális Functions: `.dev.vars` (Wrangler), formátum: `KULCS=érték` soronként.
- Éles: Cloudflare Pages → **Settings → Environment variables** (és **Secrets** a titkos értékekhez).
- Lista sablon: `.env.example`.

## Deploy

```bash
npm install
npm run deploy
```

## Következő lépések

1. Cloudflare-en hozd létre a **Pages** projektet (vagy kösd ehhez a repóhoz).
2. Másold át a szükséges `functions/` és statikus fájlokat a régi repóból **szűkítve**.
3. `wrangler.toml`: D1 / KV ID-k, ha közvetlenül wranglerrel kezeled a bindingeket.
4. OAuth redirect URI-k a Google Console-ban: `https://monastudio.hu/api/auth/google-callback` (+ preview URL, ha kell).
