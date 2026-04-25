# Mona Studio — Projektdokumentáció

Ez a mappa a projekt **stratégiai és tervezési dokumentumait** tartalmazza. Cursor-ban ezekre a fájlokra hivatkozhatsz a `@docs/01-design-system.md` szintaxissal — így a chat-asszisztens automatikusan használja kontextusként.

---

## Fájlok

| Fájl | Tartalom |
|---|---|
| `01-design-system.md` | Színpaletta (WCAG mérésekkel), tipográfia, térköz, komponensek, CSS változók, fotografálási stílus |
| `02-reorganization-plan.md` | Brand pozícionálás, SEO stratégia, oldalstruktúra, UX/UI prioritások, tartalom-stratégia |
| `03-known-issues.md` | A jelenlegi rendszer hibái + architektúra-szintű megoldásaik (layout, accessibility, performance, mobil) |
| `04-v2-migration-plan.md` | Két párhuzamos környezet (prod + dev), adatok átvétele, sprint roadmap, cutover terv |
| `05-product-schema.md` | Termék adatlap teljes séma (Google Merchant kompatibilis), készletkezelés, AI import, akciók, hűségpont |

---

## Kontextus alapelvek

A V2 projekt **Astro keretrendszerre** épül, **Cloudflare Pages**-en fut, és a következő integrációkat használja:

- **D1** (SQL adatbázis): orders, customers, products, sessions
- **KV** (cache): cookie state, Setmore cache, OAuth state
- **R2** (object storage): termék képek
- **Resend** (email): rendelés visszaigazolás, üdvözlő emailek
- **Mailchimp** (newsletter): hírlevél feliratkozás
- **Google OAuth**: admin (Mónika) bejelentkezés
- **FoxPost** + **GLS** (szállítás): csomagautomata, házhozszállítás
- **Setmore** (foglalás): kezelési időpontok
- **Anthropic** (AI): chatbot, termék számla import
- **DeepL** (fordítás): HU/EN automatikus fordítás

---

## Brand alapelvek

A Mona Studio **prémium kozmetikai brand** Magyarországon, Vácon, **Szabó Mónika** kozmetikussal. A cél: **kurátori szakértelem** értékesítése, nem áruházi modell.

- **Csendes** — kevés szín, sok levegő
- **Személyes** — Mónika hangja érződik
- **Természetes** — bőr, növény, nappali fény
- **Szakmai** — INCI, hatóanyag, részletes információ

---

## Hogyan használd Cursor-ban

```
Pl. egy promptban:

"@docs/01-design-system.md alapján generáld a button komponens stílusát"

"Az új termékoldal struktúrája @docs/02-reorganization-plan.md szerint legyen"

"Ellenőrizd hogy a kód illeszkedik @docs/03-known-issues.md-hez"
```

A dokumentumok a fejlesztés során is bővülhetnek — ha új specifikáció születik, érdemes hozzátenni egy új sorszámmal.
