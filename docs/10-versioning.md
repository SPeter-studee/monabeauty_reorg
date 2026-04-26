# 10 — Verziózási konvenció

A Mona Studio V2 projekt **Semantic Versioning** (semver) szabványt követ. Ez a dokumentum részletezi hogyan és mikor kell verziót lépni, és hol látszik a verzió a felhasználói felületen.

---

## A verzió formátuma

```
MAJOR.MINOR.PATCH
```

Például: `0.5.1`

| Komponens | Mikor lép | Példa |
|---|---|---|
| **MAJOR** (`0.x.x` → `1.x.x`) | Breaking change, új arch, kompatibilitás vesztés, **éles indulás** | `0.x.x` → `1.0.0` (cutover Sprint 7) |
| **MINOR** (`0.5.x` → `0.6.x`) | Új funkció, sprint vége, jelentős hozzáadás | `0.5.0` (Sprint 2B 3. kör), `0.6.0` (Sprint 3 webshop) |
| **PATCH** (`0.5.0` → `0.5.1`) | Bugfix, kis javítás, tartalom finomítás | `0.5.1` (Sprint 2B 4. kör tartalom finomítás) |

---

## Aktuális verzió: `0.5.1`

A verzió a `package.json`-ban van rögzítve:

```json
{
  "name": "mona-studio",
  "version": "0.5.1",
  ...
}
```

---

## Hol látszik a verzió?

### 1. Footer-ben (felhasználóknak)
A weboldal **footer-jének alján** egy diszkrét sorban: `v0.5.1 · SP Design`. Halvány, kis betűs, hover-re kicsit erősebb. Tooltip-ben a build dátum is látszik.

### 2. HTML meta tag-ben (fejlesztőknek)
Minden oldal `<head>`-jében:
```html
<meta name="app-version" content="0.5.1">
<meta name="build-date" content="2026-04-26">
```
Hasznos: Cloudflare deploy verifikáció, böngésző DevTools `<head>` ellenőrzés.

### 3. `/api/version` endpoint (programozott)
JSON válasz monitoring és CI/CD célra:
```bash
curl https://monastudio.hu/api/version
{
  "name": "Mona Studio",
  "version": "0.5.1",
  "buildDate": "2026-04-26",
  "runtime": "cloudflare-pages",
  "framework": "astro"
}
```

---

## Hogyan kerül a verzió a UI-ba?

A verzió **build-időben** kerül beégetésre:

1. `package.json` `version` mező → `astro.config.mjs` olvassa be `readFileSync`-kel
2. Vite `define` plugin globális konstansként elérhetővé teszi: `import.meta.env.PUBLIC_APP_VERSION`
3. Bárhol használható az Astro komponensekben:

```astro
---
const version = import.meta.env.PUBLIC_APP_VERSION;
---
<p>Verzió: {version}</p>
```

A build dátum (`PUBLIC_BUILD_DATE`) hasonlóan elérhető — ez minden `npm run build` futáskor frissül.

---

## Verzió bump folyamat

Amikor új sprintet zárunk vagy nagyobb változtatás kerül a kódba:

```powershell
# 1. package.json verzió bump
# Manuálisan vagy npm version segítséggel:

# Patch (bugfix, tartalom finomítás): 0.5.0 → 0.5.1
npm version patch --no-git-tag-version

# Minor (új funkció, sprint vége): 0.5.1 → 0.6.0
npm version minor --no-git-tag-version

# Major (breaking change, éles indulás): 0.x.x → 1.0.0
npm version major --no-git-tag-version

# 2. docs/09-changelog.md frissítés
# - Az [Unreleased] szekció átkerül az új verzió szekcióba
# - Új [Unreleased] szekció nyílik a következő munkának

# 3. Commit + push
git add package.json package-lock.json docs/09-changelog.md
git commit -m "chore(release): v0.5.1"
git push

# 4. Cloudflare auto-deploy lefut, az új verzió élesben jelenik meg a footer-ben
```

A `--no-git-tag-version` flag fontos — magunk akarjuk a commit-ot kezelni, nem akarunk automatikus tag-elést.

Ha mégis taggelni szeretnénk:
```powershell
git tag v0.5.1
git push --tags
```

---

## Verziózási döntések sprintenként

| Sprint | Eredmény verzió | Bump típus |
|---|---|---|
| Sprint 1 | `0.1.0` | initial |
| Sprint 2A | `0.2.0` | minor |
| Sprint 2B (1. kör) | `0.3.0` | minor |
| Sprint 2B (2. kör) | `0.4.0` | minor |
| Sprint 2B (3. kör) | `0.5.0` | minor |
| Sprint 2B (4. kör) | `0.5.1` | patch (tartalom finomítás) |
| Sprint 2B (5. kör) | `0.5.2` | patch (akciónaptár) |
| Sprint 3 (webshop) | `0.6.0` | minor (tervezett) |
| Sprint 4 (auth) | `0.7.0` | minor (tervezett) |
| Sprint 5 (admin) | `0.8.0` | minor (tervezett) |
| Sprint 6 (integrációk) | `0.9.0` | minor (tervezett) |
| Sprint 7 (cutover) | `1.0.0` | **MAJOR** — éles indulás |

---

## Kapcsolódó dokumentumok

- [09-changelog.md](./09-changelog.md) — minden verzió részletes leírása
- [08-sprint-log.md](./08-sprint-log.md) — sprint napló
- [07-deployment.md](./07-deployment.md) — Cloudflare deploy folyamat
