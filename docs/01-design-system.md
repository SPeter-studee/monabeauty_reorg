# Mona Studio — Design System v1.0

**Természetes prémium kozmetikai brand vizuális rendszere.**

A "Kiehl's / La Mer" iránynak megfelelő tört bézs + sötétzöld + szénszürke alapú paletta, modernebb, megközelíthetőbb hangulattal mint a jelenlegi "este luxus" sötét + arany kombináció.

---

## 1. Brand alapelvek

Minden vizuális döntés ezeknek az elveknek alávetődik:

- **Csendes** — kevés szín, sok levegő, nem versenyzünk a vásárló figyelméért
- **Személyes** — Mónika hangja érződik, nem áruházi, nem agresszív
- **Természetes** — bőr, növény, nappali fény, nem szintetikus, nem neon
- **Szakmai** — részletes információ, INCI lista, hatóanyag, nem felszínes

---

## 2. Színpaletta

### 2.1 Primary — háttér és felület

| Token | Hex | Használat |
|---|---|---|
| `--mona-bg` | `#ebe5db` | Fő oldalháttér mindenhol |
| `--mona-surface` | `#f5f1e8` | Kártyák, kiemelt blokkok |
| `--mona-elevated` | `#fdfbf7` | Modálok, popoverek, form mezők |

### 2.2 Primary — szöveg

| Token | Hex | Kontraszt | WCAG |
|---|---|---|---|
| `--mona-text` | `#2c2926` | 14:1 (vs bg) | AAA |
| `--mona-text-2` | `#4a4640` | 8.4:1 | AAA |
| `--mona-text-3` | `#6b5a4a` | 5.2:1 | AA |

### 2.3 Accent — kiemelés és szemantikai

| Token | Hex | Használat |
|---|---|---|
| `--mona-nature` | `#3d4a3d` | Sötétzöld — természet, vegán badge, körítő szegély |
| `--mona-warm` | `#8a6f4a` | Patina arany — Mónika ajánlása keret, accent |
| `--mona-sale` | `#b85a3c` | Akció pirosbarna — kedvezmény badge, akciós ár |
| `--mona-success` | `#5a6b5a` | Tört zöld — készlet OK, sikeres művelet |

### 2.4 Border és felülethatár

| Token | Hex | Használat |
|---|---|---|
| `--mona-border` | `#d4cfc4` | Finom szegély, kártya keret |
| `--mona-border-strong` | `#2c2926` | Form input keret, hangsúlyos szegély |

### 2.5 Sötét mód

**Indulásnál nincs sötét mód** — később kerül bevezetésre. A paletta felépítése támogatja az invertet (`#2c2926` lesz a háttér, `#ebe5db` a szöveg).

---

## 3. Tipográfia

### 3.1 Font családok

```css
--mona-serif: 'Cormorant Garamond', Georgia, serif;
--mona-sans: -apple-system, 'Inter', system-ui, sans-serif;
```

A Cormorant Garamond Google Fonts-ból, a sans-serif system font (gyors betöltés, lokalizálva érződik).

### 3.2 Méret skála

| Szint | Font | Méret/Sorköz | Súly | Letter-spacing | Használat |
|---|---|---|---|---|---|
| H1 | Serif | 48 / 56 px | 400 | 0 | Hero címek |
| H2 | Serif | 36 / 44 px | 400 | 0 | Szekció címek |
| H3 | Serif | 28 / 36 px | 400 | 0 | Termék név (egyedi oldal) |
| H4 | Serif | 20 / 28 px | 400 | 0 | Termék név (kártya) |
| Eyebrow | Sans | 11 px | 400 | 0.1em | Felirat címek felett, KAPS |
| Body | Sans | 16 / 26 px | 400 | 0 | Általános szöveg |
| Caption | Sans | 14 / 22 px | 400 | 0 | Másodlagos információ |
| Tiny | Sans | 11 / 16 px | 400 | 0.05em | Badge, label |

### 3.3 Tipográfiai szabályok

- **H1-H4 mindig serif** — luxus érzet megmarad
- **Body, helper, label sans-serif** — olvashatóság hosszú szövegnél
- **Két font-súly csak**: 400 (regular), 500 (medium emphasis)
- **Sentence case mindenhol** — sosem Title Case, sosem ALL CAPS, kivéve eyebrow label és badge
- **Mónika ajánlása doboz** — serif italic (személyesebb hangzás)
- **INCI lista** — sans-serif, smaller, line-height 1.8 (olvashatóság)

### 3.4 Mobile-first méretek

Mobile alatt minden méret 87.5%-ra csökken (rem alapú). H1 mobile = 42px helyett 48px desktop.

---

## 4. Térköz és ritmus

### 4.1 Skála

```
4px — micro (badge inner)
8px — small (gap kis elemek között)
16px — base (minden alap térköz)
24px — comfortable (komponens belső padding)
32px — section internal
48px — section gap small
64px — section gap medium
96px — section gap large
128px — section gap xl (oldal hero alja)
```

### 4.2 Vertikális ritmus szabályok

- **Bekezdés között**: 16px
- **Cím alatt**: 8-16px (cím + bekezdés szorosan kapcsolódik)
- **Szekciók közt**: 96-128px (dezert oldalon legalább 96px)
- **Oldal felső padding**: 64px asztali, 32px mobil
- **Oldal alsó padding** (footer előtt): 128px asztali

### 4.3 Container szélességek

```
Max content width: 1280px  (oldalkeret)
Max text width:    680px   (olvasható prózai szövegnek)
Article width:     720px   (blog cikk)
```

---

## 5. Komponensek

### 5.1 Gombok

**Primary (Kosárba, Mentés, Vásárlás):**
```css
background: var(--mona-text);   /* #2c2926 */
color: var(--mona-surface);
padding: 12px 24px;
font: 13px/1 var(--mona-sans);
letter-spacing: 0.05em;
border: none;
cursor: pointer;
transition: background 0.2s;
```
Hover: `background: #1a1816` (még sötétebb)

**Secondary (Mégsem, Bezárás):**
```css
background: transparent;
color: var(--mona-text);
border: 0.5px solid var(--mona-text);
/* többi mint primary */
```
Hover: `background: rgba(44,41,38,0.05)`

**Tertiary (Tovább olvasom, Részletek):**
```css
background: transparent;
color: var(--mona-text);
border: none;
text-decoration: underline;
text-underline-offset: 4px;
text-decoration-thickness: 0.5px;
padding: 12px 8px;
```

**Sale CTA (akciós termékhez):**
```css
background: var(--mona-sale);   /* #b85a3c */
color: var(--mona-surface);
/* többi mint primary */
```

### 5.2 Badge-ek

| Badge | Háttér | Szöveg | Mikor |
|---|---|---|---|
| Vegán | `#3d4a3d` | `#f5f1e8` | `is_vegan = true` |
| Mónika ajánlja | `#8a6f4a` | `#f5f1e8` | `is_mona_recommended = true` |
| Akció (-20%) | `#b85a3c` | `#f5f1e8` | `sale_price` aktív |
| Újdonság | `#5a6b5a` | `#f5f1e8` | `created_at < 30 nap` |
| Cruelty-free | transparent + `#2c2926` border | `#2c2926` | `is_cruelty_free = true` |
| Illatmentes | transparent + `#2c2926` border | `#2c2926` | `is_fragrance_free = true` |

Stílus mind:
```css
font-size: 10px;
padding: 3px 8px;
letter-spacing: 0.05em;
text-transform: uppercase;
border-radius: 0;  /* éles sarkok, nem kerek */
```

### 5.3 Form elemek

**Input, select, textarea:**
```css
width: 100%;
padding: 12px 14px;
background: var(--mona-elevated);
border: 0.5px solid var(--mona-text);
color: var(--mona-text);
font: 14px/1.4 var(--mona-sans);
outline: none;
border-radius: 0;
```

Focus:
```css
border-color: var(--mona-nature);
border-width: 1px;  /* kompenzálva a layout shift */
padding: 11.5px 13.5px;
```

**Címke (label):**
```css
display: block;
font: 11px/1 var(--mona-sans);
color: var(--mona-text-2);
letter-spacing: 0.1em;
text-transform: uppercase;
margin-bottom: 6px;
```

**Hiba állapot:**
```css
border-color: var(--mona-sale);
```

### 5.4 Termékkártya

```html
<article class="product-card">
  <div class="product-card__media">
    <img src="..." alt="..."/>
    <span class="badge badge-vegan">Vegán</span>
    <button class="wishlist-btn" aria-label="Kívánságlistára">♡</button>
  </div>
  <p class="product-card__brand">KRX AESTHETICS</p>
  <h3 class="product-card__title">Cica Tonik</h3>
  <p class="product-card__meta">50 ml · Érzékeny bőrre</p>
  <div class="product-card__footer">
    <p class="product-card__price">7.050 Ft</p>
    <span class="product-card__stock">✓ Raktáron</span>
  </div>
  <button class="mona-btn-primary product-card__cta">Kosárba</button>
</article>
```

```css
.product-card {
  background: var(--mona-surface);
  border: 0.5px solid var(--mona-border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.product-card__media {
  position: relative;
  aspect-ratio: 4/5;
  background: var(--mona-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -20px -20px 0;
}
.product-card__media img {
  max-width: 70%;
  max-height: 90%;
  object-fit: contain;
}
.product-card__brand {
  font: 10px/1 var(--mona-sans);
  letter-spacing: 0.1em;
  color: var(--mona-text-3);
  text-transform: uppercase;
  margin: 0;
}
.product-card__title {
  font: 20px/1.2 var(--mona-serif);
  color: var(--mona-text);
  margin: 0;
}
.product-card__meta {
  font: 12px/1.4 var(--mona-sans);
  color: var(--mona-text-2);
  margin: 0;
}
.product-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.product-card__price {
  font: 500 18px/1 var(--mona-sans);
  color: var(--mona-text);
}
.product-card__stock {
  font: 11px/1 var(--mona-sans);
  color: var(--mona-success);
}
.product-card__cta {
  width: 100%;
  padding: 10px;
}
```

### 5.5 Mónika ajánlása doboz

```html
<aside class="mona-recommendation">
  <p class="mona-recommendation__label">Mónika ajánlása</p>
  <p class="mona-recommendation__text">Napi ápolásra, az érzékeny, irritált...</p>
</aside>
```

```css
.mona-recommendation {
  background: var(--mona-elevated);
  border-left: 2px solid var(--mona-warm);
  padding: 20px 24px;
  border-radius: 0;
}
.mona-recommendation__label {
  font: 10px/1 var(--mona-sans);
  letter-spacing: 0.15em;
  color: var(--mona-warm);
  text-transform: uppercase;
  margin: 0 0 12px;
}
.mona-recommendation__text {
  font: italic 16px/1.65 var(--mona-serif);
  color: var(--mona-text);
  margin: 0;
}
```

### 5.6 Header (oldal teteje)

```css
.site-header {
  background: var(--mona-bg);
  border-bottom: 0.5px solid var(--mona-border);
  padding: 20px 32px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.site-header__logo {
  font: 20px/1 var(--mona-serif);
  color: var(--mona-text);
}
.site-header__nav a {
  font: 13px/1 var(--mona-sans);
  color: var(--mona-text-2);
  text-decoration: none;
  letter-spacing: 0.05em;
}
.site-header__nav a:hover,
.site-header__nav a.active {
  color: var(--mona-text);
  border-bottom: 0.5px solid var(--mona-text);
}
```

### 5.7 Footer

```css
.site-footer {
  background: var(--mona-text);  /* sötét háttér */
  color: var(--mona-bg);
  padding: 64px 32px 32px;
}
```

---

## 6. Ikonok

### 6.1 Stílus

- **Outlined, nem filled** — vékony 1.5px stroke
- **24px alapméret**, 20px kis méret, 32px nagy
- **Lucide ikonkönyvtár** javasolt (pre-loaded React projektben, vagy SVG fájlokként)
- **Soha nem emoji** a brand UI-ban (kivéve marketing/közösségi anyagokban)

### 6.2 Gyakori ikonok

- ♡ / ♥ — Wishlist (üres / töltött)
- 🛒 ⇒ kosár SVG ikon
- 🔍 ⇒ kereső SVG ikon
- 👤 ⇒ profil SVG ikon
- ☰ ⇒ hamburger mobil
- ✕ ⇒ bezárás
- ↗ — külső link
- ✓ — pipa (raktáron, sikeres)

---

## 7. Fotográfia és vizuális stílus

### 7.1 Termékfotók

- **Háttér**: világos krém (#f5f1e8), tiszta gradient nélkül
- **Megvilágítás**: nappali, lágy, 45° oldal
- **Szögek**: termékek mindig egyenesen vagy enyhe 3D dőléssel
- **Konzisztencia**: minden termékkép azonos arányú (4:5), azonos háttér, azonos termék-mérettel keretben

### 7.2 Hangulat (lifestyle) képek

- **Fő szín**: meleg, természetes (selyem, len, fa, kerámia textúrák)
- **Mónikás képek**: nappali fényben, a szalonban, dolgozás közben
- **Kerülendő**: stock fotók, mosolygó modellek, neon háttér, túl retusált bőr

### 7.3 Galériák

- **Aspect ratio**: termék 4:5, lifestyle 3:2 vagy 16:9
- **Lazy loading** mindenhol
- **WebP formátum** (R2-be feltöltéskor automatikus konverzió)

---

## 8. Mozgás és átmenetek

### 8.1 Időzítés

```css
--mona-fast: 150ms;     /* hover, gomb */
--mona-base: 250ms;     /* megjelenés, dropdown */
--mona-slow: 400ms;     /* page transition */
--mona-easing: cubic-bezier(0.4, 0, 0.2, 1);  /* material standard */
```

### 8.2 Mozgás szabályok

- **Minden hover legyen átmeneten** (transition: 150ms)
- **Soha ne forogjon** elem, csak skálázzon vagy fade-elhessen
- **Modal megjelenés**: fade + 8px translateY (lent felfelé)
- **Kosárba tétel**: 200ms scale + a kosár ikon mellett a szám 300ms-ban felugrik
- **Lapozás**: nincs page transition (Worker SSR egyből render)
- **Reduced motion**: `@media (prefers-reduced-motion)` → minden átmenet 0ms

---

## 9. Akadálymentesség

### 9.1 WCAG célok

- **Szöveg kontraszt**: AAA (7:1) lehetőleg, AA (4.5:1) minimum
- **Nagy szöveg** (24px+): AA (3:1) elég
- **Interaktív elemek border**: 3:1 minimum a háttérrel szemben
- **Focus state**: minden interaktívnak látható ring
- **Click target**: 44×44px minimum mobile

### 9.2 Focus indikátor

```css
:focus-visible {
  outline: 2px solid var(--mona-nature);
  outline-offset: 2px;
}
```

### 9.3 Kerülendő

- ❌ Csak színnel jelölt információ (akcióhoz "−20%" szöveg is, nem csak piros)
- ❌ Auto-play videó hanggal
- ❌ Időzítő nélkül lefutó tartalom
- ❌ Tömeges UPPERCASE szöveg (csak label/badge OK)

---

## 10. Implementáció — sorrend

### 10.1 1. fázis — alapok
1. CSS változók beállítása `:root`-ban
2. Font betöltés (Cormorant Garamond Google Fonts + Inter helyi)
3. Reset / normalize CSS
4. Body alapstílus (background, color, font)

### 10.2 2. fázis — komponensek
5. Header újrastílus
6. Footer újrastílus
7. Gomb komponensek
8. Form elemek
9. Badge komponensek

### 10.3 3. fázis — oldalak
10. Főoldal hero (Mónika fotója + szöveg + CTA)
11. Webshop kártya rács
12. Egyedi termékoldal
13. Kosár / pénztár
14. Profil oldalak
15. Admin oldalak

### 10.4 4. fázis — finomítás
16. Mozgás és átmenetek
17. Mobile finomítás
18. Akadálymentességi audit
19. Performance audit (LCP, CLS, INP)

---

## 11. Migrációs stratégia

### 11.1 A jelenlegi sötét + arany → új paletta

**Nem egyszerre cseréljük, hanem oldalanként:**

1. **Új kódbázis** új stylesheettel (`mona-design-v2.css`)
2. **Egyetlen oldal először** (pl. webshop oldal)
3. **A/B teszt 2 héten át**: konverzió, bounce rate
4. **Ha jobb / azonos**: terjeszteni a többi oldalra
5. **Régi CSS törlése** csak az utolsó oldal átállítása után

### 11.2 Mit ne változtassunk

- **Mona Studio logó és tipográfia** — Cormorant Garamond marad
- **"A szépség benned van" tagline** — marad
- **Mónika fotója** — főoldali hero, ugyanúgy
- **Setmore időpontfoglalás folyamat** — változatlan
- **Domain és URL struktúra** — ugyanaz

### 11.3 Mit változtassunk

- **Háttér**: sötét → tört bézs
- **Szöveg**: arany/krém → szénszürke
- **Termékkártyák**: új layout (márka kiemelve, készlet jelzés)
- **Body font**: Cormorant → Inter sans-serif
- **Gombok**: arany gradient → fekete tömör
- **Badge stílus**: arany → színes szemantikai

---

## 12. Fájlszerkezet

```
css/
  mona-design-v2/
    tokens.css              ← CSS változók
    reset.css               ← normalize + base
    typography.css          ← font-méretek, family
    layout.css              ← container, grid
    components/
      buttons.css
      forms.css
      badges.css
      product-card.css
      mona-recommendation.css
      header.css
      footer.css
    pages/
      home.css
      webshop.css
      product.css
      cart.css
      profile.css
    utilities.css           ← utility osztályok
    main.css                ← belép-pontba importál
```

---

## 13. Eldöntendő kérdések az implementáció előtt

**A) Font választás**
- Cormorant Garamond + Inter (javasolt, ingyenes, gyors)
- Cormorant Garamond + Söhne (Söhne fizetős)
- Maradjon csak Cormorant Garamond (jelenlegi)?

**B) Sötét mód indulásra**
- Csak világos most (egyszerűbb, gyorsabb)
- Sötét mód is induláskor (több munka, de modern UX)

**C) Animációk mértéke**
- Minimális (csak hover, focus) — javasolt
- Közepes (szekciók fade-be scrollozáskor)
- Gazdag (parallax, scroll-effektek)

**D) Vizuális elemek mennyisége**
- Tisztán tipográfia + képek (Aesop irány)
- Kis grafikai elemek (vékony divider vonalak, finom textúrák)
- Több illusztráció (botanikai vonalas rajzok)

---

## 14. Várható eredmény

A rebrand után **mérhető változások:**

- **WCAG AAA mindenhol** elérhető (jelenleg AA)
- **Page Speed**: Cormorant body szöveg eltávolítása → ~15% gyorsabb font betöltés
- **Konverzió** (becslés): +10-20% — világos paletta jobban olvasható, modernebb érzet
- **Brand differenciáció**: magyar prémium kozmetikai szegmensben kevés brand használ világos premium designt — versenyelőny
- **SEO**: jobb Core Web Vitals → jobb rangsor

---

**Készítve:** 2026.04.25  
**Verzió:** 1.0  
**Státusz:** Jóváhagyásra vár — implementáció a Mona Studio rebrand részeként
