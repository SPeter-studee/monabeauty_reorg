# public/ — Statikus fájlok

Ez a mappa olyan fájlokat tartalmaz, amiket az Astro **NEM dolgoz fel**, csak a build-elt `dist/` mappa gyökerébe másol át.

---

## Munkafolyamat (képek)

Új vagy frissített raszter képnél (JPG/PNG) ezt a 4 lépést kell követni:

1. **Bemásolás** — másold be a `.jpg`, `.jpeg` vagy `.png` fájlt a `public/`-ba (vagy egy almappába, pl. `public/images/`)
2. **WebP generálás** — `npm run images:webp` (lásd alább a script viselkedését)
3. **Build** — `npm run build` (a `dist/` gyökerébe kerülnek mindkét formátum)
4. **Hivatkozás a `BaseLayout`-ban** — alap `og:image` automatikusan a `og-default.webp`-re mutat. Egyedi képet az `image` prop-pal lehet adni:

   ```astro
   ---
   const ogImage = new URL("/blog/cikk-cover.webp", Astro.site).href;
   ---
   <BaseLayout image={ogImage} title="Cikk címe" ...>
   ```

   Vagy teljes URL-lel:
   ```astro
   <BaseLayout image="https://monastudio.hu/blog/cikk-cover.webp" ...>
   ```

A WebP fájlok átlagosan **30-40%-kal kisebbek** mint a JPEG/PNG eredeti.

---

## WebP script viselkedése

A `scripts/generate-webp.mjs`:
- Bejárja a `public/` mappát rekurzívan
- Minden `.jpg` / `.jpeg` / `.png` mellé azonos nevű `.webp`-et készít
- **Kihagyja** a fájlt, ha a `.webp` már létezik **és nem régebbi** mint a forrás (`mtime` alapján). Tehát ha nem újabb a forrás a meglévő `.webp`-nél, nem írja felül.
- Failsafe: ha valami nem konvertálható, kihagyja és továbbmegy

Tehát biztonságosan futtathatod többször, csak az újat dolgozza fel.

---

## Mit tegyél ide

| Fájl | Mire való |
|---|---|
| `favicon.svg` | Modern browser favicon |
| `favicon-32.png` | Fallback PNG favicon (32×32) |
| `favicon-32.webp` | WebP variant (script generálja) |
| `apple-touch-icon.png` | iOS bookmark ikon (180×180px) |
| `apple-touch-icon.webp` | WebP backup (csak `<picture>`/manifest-hez) |
| `robots.txt` | Keresőmotor irányítás |
| `_redirects` | Cloudflare Pages redirect szabályok |
| `_headers` | HTTP fejlécek (cache, security) |
| `og-default.jpg` | Open Graph default kép (1200×630px) — JPEG fallback |
| `og-default.webp` | OG kép WebP (script generálja, ~33% kisebb) |
| `images/` | Statikus képek amik nem termékek (logó, hero, stb.) |
| `fonts/` | Önálló fontok (jelenleg Google Fonts-ról) |

---

## Mit NE tegyél ide

- ❌ Termék képek (azok R2-be mennek)
- ❌ Astro komponensek (`src/components/`-be)
- ❌ Stylesheet-ek (`src/styles/`-ba)
- ❌ TS/JS fájlok (`src/lib/`-be)
- ❌ Bizalmas fájlok (`.env`, `.dev.vars` — soha ne legyen public)

---

## Hivatkozás Astro komponensekben

A `public/` fájlokra **kezdő perjellel** hivatkozz:

```astro
<img src="/favicon.svg" alt="" />
<link rel="icon" href="/favicon.svg" />
```

WebP fallback `<picture>` tag-gel:
```astro
<picture>
  <source srcset="/og-default.webp" type="image/webp" />
  <img src="/og-default.jpg" alt="Mona Studio" width="1200" height="630" />
</picture>
```

---

## Asset státusz

### Már a starter-ben van

- ✅ `favicon.svg` — placeholder (egyszerű "M" betű, cseréld ki saját logóra)
- ✅ `robots.txt` — keresőmotor irányítás (admin oldalak kizárva, sitemap hivatkozás)
- ✅ `_redirects` — Cloudflare URL átirányítás (üres, példák kommentelve)
- ✅ `_headers` — security és cache fejlécek (X-Frame-Options, immutable cache az `_astro/`-ra)

### Még pótolandó (Mónika fotói / grafikus munka)

- [ ] `favicon-32.png` (32×32 px) — fallback PNG a régibb böngészőkhöz
- [ ] `apple-touch-icon.png` (180×180 px, semmi átlátszóság) — iOS bookmark
- [ ] `og-default.jpg` (1200×630 px) — főoldali brand kép Mónikával az OG/Twitter card-hoz
- [ ] `monastudio-logo.svg` — végleges skálázható logó vektorban (a placeholder favicon helyett)
- [ ] `monika-portrait.jpg` (1200×1500 px) — a Rólam oldalra
- [ ] `images/szalon-vac/*.jpg` — szalon belső fotók a "Szalon" oldalra

Mónika fotói és a logó az ideális tartalom, amit professzionális fotográfussal érdemes csináltatni. A bemásolás után a 4 lépéses [Munkafolyamat](#munkafolyamat-képek) szerint járj el.

**Deploy előtt:** lásd a fenti **Munkafolyamat (képek)** 4 lépését — `images:webp` → `build` → deploy.
