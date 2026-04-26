# Mona Studio — Projektdokumentáció

Ez a mappa a projekt **teljes dokumentációját** tartalmazza: stratégiai tervek, architektúra leírások, API referencia, sprint napló és változásnapló.

A fájlok **számozottak** (00–09), így a README index egyezik a fizikai sorrenddel. Cursor-ban hivatkozhatsz rájuk a `@docs/00-architektura.md` szintaxissal.

---

## Fájlok

### Stratégia + tervek

| Fájl | Tartalom |
|---|---|
| [00-architektura.md](./00-architektura.md) | Tech stack, komponens diagram, adatfolyam, deployment topológia |
| [01-design-system.md](./01-design-system.md) | Színpaletta, tipográfia, térköz, komponensek, CSS változók |
| [02-reorganization-plan.md](./02-reorganization-plan.md) | Brand pozícionálás, SEO stratégia, oldalstruktúra, UX/UI |
| [03-known-issues.md](./03-known-issues.md) | Jelenlegi rendszer hibái + architektúra megoldásaik |
| [04-v2-migration-plan.md](./04-v2-migration-plan.md) | Két környezet (prod + dev), adatok átvétele, sprint roadmap |
| [05-product-schema.md](./05-product-schema.md) | Termék adatlap teljes séma, készletkezelés, AI import |

### Fejlesztés

| Fájl | Tartalom |
|---|---|
| [06-api-reference.md](./06-api-reference.md) | Minden API endpoint paraméterekkel, válaszokkal, példákkal |
| [07-deployment.md](./07-deployment.md) | Cloudflare setup, bindings, env vars, custom domain, troubleshooting |
| [08-sprint-log.md](./08-sprint-log.md) | Sprint napló — mit építettünk, miben döntöttünk |
| [09-changelog.md](./09-changelog.md) | Verziónapló (gépi olvashatóan, semver) |
| [10-versioning.md](./10-versioning.md) | Verziózási konvenció — semver, bump folyamat, hol látszik a verzió |

---

## Kontextus alapelvek

A V2 projekt **Astro keretrendszerre** épül, **Cloudflare Pages**-en fut, és a következő integrációkat használja:

- **D1** (SQL adatbázis): orders, customers, products, sessions, reviews
- **KV** (cache): cookie state, Setmore cache, OAuth state, rate limiting
- **R2** (object storage): termék képek
- **Resend** (email): rendelés visszaigazolás, üdvözlő, kapcsolat form
- **Mailchimp** (newsletter): hírlevél feliratkozás
- **Google OAuth**: admin (Mónika) bejelentkezés
- **FoxPost** + **GLS** (szállítás): csomagautomata, házhozszállítás
- **Setmore** (foglalás): kezelési időpontok
- **Anthropic** (AI): chatbot, termék számla import
- **DeepL** (fordítás): HU/EN automatikus fordítás

---

## Brand alapelvek

A Mona Studio **prémium kozmetikai brand** Magyarországon, Vácon, **Szabó Mónika** kozmetikussal.

- **Csendes** — kevés szín, sok levegő
- **Személyes** — Mónika hangja érződik
- **Természetes** — bőr, növény, nappali fény
- **Szakmai** — INCI, hatóanyag, részletes információ

---

## Hogyan használd Cursor-ban

```
Pl. egy promptban:

"@docs/01-design-system.md alapján generáld a button stílust"

"Az új termékoldal struktúrája @docs/02-reorganization-plan.md szerint legyen"

"Adj hozzá egy új API endpointot @docs/06-api-reference.md mintájára"

"Frissítsd @docs/08-sprint-log.md-t az új commit eredménnyel"
```

A dokumentumok a fejlesztés során bővülnek — minden új sprint után frissítjük a `08-sprint-log.md`-t és `09-changelog.md`-t.

---

## Karbantartás

A dokumentáció **élő**, nem statikus. Karbantartási szabályok:

1. **Új sprint kezdetén**: frissül a `08-sprint-log.md` az új feladatokkal
2. **Új komponens / oldal**: említés a megfelelő szekcióban (`00-architektura.md` vagy `01-design-system.md`)
3. **Új API endpoint**: rögzítés a `06-api-reference.md`-ben
4. **Breaking change**: a `09-changelog.md`-be (semver minor/major bump)
5. **Új env var / binding**: `07-deployment.md` táblázatába
