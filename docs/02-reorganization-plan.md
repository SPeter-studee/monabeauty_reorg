# Mona Studio — Weblap reorganizációs terv

**Stratégia:** Országos prémium kozmetikai brand építése webshopra fókuszálva, a váci szalon mint hitelességet adó "anchor". SEO és UX prémium szegmensre optimalizálva.

---

## 1. Stratégiai pozícionálás

### Mit látjon meg a látogató 5 másodperc alatt?

> **"Szakmai ajánlással válogatott prémium kozmetikumok — egy magyar kozmetikus személyes tapasztalataiból."**

Ez a kulcs. Nem versenyzünk az áruházlánc webshopokkal (Notino, Douglas) árban — versenyzünk **kurátori szakértelemben és bizalomban**. Mónika személye = a brand.

### Brand-arc elvek

| Elv | Hogyan jelenik meg |
|---|---|
| **Kurátori, nem áruházi** | Kevés, válogatott termék — minden mellett "Mónika ajánlása" |
| **Szakmai hitelesség** | Évek tapasztalata, váci szalon, INCI-szintű leírások |
| **Személyes, nem személytelen** | Mónika fotója, hangja, ajánlásai — nem stock képek |
| **Prémium, nem olcsó** | Sötét, arany luxus paletta megmarad — prémiumot kommunikál |
| **Lassú, nem agresszív** | Nincs popup, "csak ma!", számlálók — hosszú távú kapcsolat |

---

## 2. SEO stratégia — Google szempontok

### 2.1 Kulcsszó-stratégia (országos webshop)

A magyar piacon a kozmetikum-keresés három klaszterre oszlik:

**A) Termék-orientált keresések (legértékesebb, magas konverzió)**
- "niacinamid szérum"
- "centella tonik"
- "cica krém érzékeny bőrre"
- "[márka] [termék típus]" (pl. "krx cica szérum")

**B) Probléma-orientált keresések (közép, oktató tartalom)**
- "milyen szérum száraz bőrre"
- "rosacea kezelés otthon"
- "pigmentfolt eltüntetése"

**C) Brand-orientált keresések (alacsony, márkahűség)**
- "krx aesthetics", "image skincare"

### 2.2 URL és oldalstruktúra (SEO-barát)

```
monastudio.hu/                              ← főoldal
monastudio.hu/webshop                       ← összes termék (kategória hub)
monastudio.hu/webshop/arcapolas             ← kategória oldal
monastudio.hu/webshop/arcapolas/szerum      ← kategória + típus
monastudio.hu/webshop/marka/krx-aesthetics  ← márka oldal
monastudio.hu/termek/cica-tonik             ← egyedi termékoldal
monastudio.hu/blog                          ← oktató tartalom (most még nincs!)
monastudio.hu/blog/niacinamid-mikor-hasznald
monastudio.hu/szalon                        ← váci szalon helyi SEO oldal
monastudio.hu/rolam                         ← Mónika személyes oldal (E-E-A-T)
```

### 2.3 Mit hiányol a Google jelenleg

A jelenlegi statikus oldalon **két kritikus hiányosság** van Google szempontjából:

**1. Nincs "Author entity" (E-E-A-T)**
2024 óta a Google nagyon erősen rangsorolja a **szakértői hitelességet** (Experience-Expertise-Authoritativeness-Trustworthiness). Egy "rólam" oldal Mónika **képesítéseivel, tapasztalataival, fotójával, közösségi linkjeivel** nélkülözhetetlen. Schema.org `Person` markup-pal.

**2. Nincs friss tartalom (blog / útmutatók)**
Google blog nélkül egy webshopot "halott boltnak" érzékeli. Kozmetikai szegmensben **havi 2-4 minőségi cikk** elég a kezdéshez. Témák:
- "Mit kell tudni a niacinamidról?"
- "Bőrtípus meghatározó kérdőív"
- "Hogyan rakd össze az esti bőrápolási rutinod?"

### 2.4 Schema.org strukturált adat (minden oldalra)

| Oldal típus | Schema |
|---|---|
| Termékoldal | `Product` (név, ár, készlet, kép, márka) |
| Termékoldal | `AggregateRating` (ha lesznek vélemények) |
| Blog cikk | `Article` + `Author` |
| Rólam oldal | `Person` (Mónika hitelesség) |
| Szalon oldal | `LocalBusiness` (helyi SEO Vác) |
| Webshop hub | `Store` |
| Foglalás CTA | `Service` (Setmore deeplink) |

A **rich snippet** miatt — csillagok, ár, készlet a Google találatokban — kb. **20-30%-kal magasabb átkattintási arány**.

### 2.5 Technikai SEO check-list

- ✓ HTTPS (megvan)
- ✓ Cloudflare CDN (megvan)
- ⏳ **SSR a webshopra** (most jön a készletkezelővel) — kritikus!
- ⏳ **Core Web Vitals** mérése — LCP, CLS, INP célok zöld zónában
- ⏳ **WebP képformátum** (R2-be feltöltéskor automatikus)
- ⏳ **Lazy loading** képeknek
- ⏳ **Sitemap.xml** automatikus generálás (Worker)
- ⏳ **robots.txt** finomhangolás
- ⏳ **Hreflang** tagek HU/EN dual-language támogatáshoz
- ⏳ **Canonical URL-ek** szűrt nézeteknél (duplikáció elkerülése)
- ⏳ **404 oldal** custom design
- ⏳ **Breadcrumb** mindenhol + Schema

### 2.6 Page-experience prioritások

A Google 2024-es Core Web Vitals frissítés az **INP (Interaction to Next Paint)** mérőszámot vezette be. Ez azt méri, mennyire reagál az oldal a kattintásokra. Mai webshopok 70%-a bukik ezen — ha jól csináljuk, ez versenyelőny.

| Mérőszám | Cél | Hogyan |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | SSR, WebP képek, font preload |
| CLS (Cumulative Layout Shift) | < 0.1 | Képeknél width/height, font-display: swap |
| INP (Interaction to Next Paint) | < 200ms | Kevesebb JS, gomb-debounce |

---

## 3. Site struktúra — új információs architektúra

### 3.1 Jelenlegi struktúra (megfigyeléseimből)

```
Főoldal
├── Szolgáltatások
├── Blog (?)
├── Galéria
├── Kapcsolat
└── Webshop
```

### 3.2 Javasolt új struktúra

```
Főoldal
│
├── 🛍️ WEBSHOP                   ← legnagyobb hangsúly (brand fókusz)
│   ├── Kategóriák (arcápolás, testápolás...)
│   ├── Márkák
│   ├── Akciók
│   └── Mónika ajánlja (kurátori szelekció)
│
├── 📅 KEZELÉSEK                  ← Setmore-ra vivő CTA-k
│   ├── Egyedi kezelés oldalak (most már megvannak)
│   └── Kezelés-csomagok
│
├── 📖 BLOG / TUDÁSTÁR            ← ÚJ! SEO + bizalom
│   ├── Bőrápolási alapok
│   ├── Hatóanyag-ABC
│   ├── Probléma-megoldó cikkek
│   └── Termék-bemutatók
│
├── 👤 RÓLAM (Mónika)             ← ÚJ! E-E-A-T + brand
│   ├── Szakmai út, képesítések
│   ├── Filozófia
│   ├── Sajtó / közösségi
│   └── Kapcsolat
│
├── 🏠 SZALON                     ← Helyi SEO Vác
│   ├── Cím, nyitvatartás
│   ├── Galéria a szalonról
│   └── Útvonalterv + Google Maps
│
└── ❓ GYIK / SEGÍTSÉG
    ├── Szállítás
    ├── Visszáru
    ├── Adatvédelem
    └── ÁSZF
```

**Mi változik:**
- A **webshop a fő hangsúly** (jobb felső sarokba kiemelt CTA)
- A **kezelések** Setmore-ra vivő linkek lesznek (saját foglalási rendszer később)
- **Blog/Tudástár** új belépési pont — SEO motor
- **Rólam** dedikált oldal — Mónika személy = brand

---

## 4. UX/UI prioritások

### 4.1 Konverziós tölcsér optimalizálás

**Vásárlói út most:**
```
Főoldal → Webshop → Termékkártya → ??? → Kosár → Pénztár
```

**Vásárlói út hibái:**
1. Termékkártyára kattintva **nincs egyedi termékoldal** (most jön)
2. Nincs **kategória szűrés**
3. **Nincs keresés**
4. Pénztáron **nincs guest checkout** (regisztráció kényszer rossz UX)

### 4.2 Top 10 UX javaslat (impact sorrendben)

**1. Egyedi termékoldal** (most épül)
Eddig a kártyán kívül nem volt mit kattintani — minden vásárló elveszett a részletes információ hiányában.

**2. Sticky "Kosár" gomb mobilon**
A Notino, Sephora is így csinálja. Termékoldalon scrollozáskor a Kosárba gomb mindig elérhető.

**3. Keresés a header-ben**
Egy ⌕ ikon a logónál. Termék név, márka, hatóanyag alapján.

**4. "Ezzel együtt használd" / sorozat-link**
A Cica rutin 4 lépésből áll — termékoldalon át lehet menni a következőre. Kosárérték +30%.

**5. Bizalom-elemek a kosár oldalon**
- "✓ Ingyenes szállítás 15.000 Ft felett"
- "🔄 30 nap visszaküldés"
- "💳 Biztonságos fizetés (logók)"
- "✉️ Kérdés? mona@monastudio.hu"

Ezek nélkül a kosárelhagyás 70%+. Velük 50% környékre csökken.

**6. Guest checkout**
A pénztáron lehessen rendelést leadni regisztráció nélkül, de mellette ott van egy halvány **"Mentsd el a fiókodba a gyorsabb visszatéréshez"** üzenet. Postcheckout regisztráció.

**7. Hűségpont jelzés terméknél**
"Vásárlással 70 hűségpontot szerzel" — még ha nem aktív is most, **a koncepció** látható.

**8. Mobile-first ellenőrzés**
A magyar e-kereskedelem 65%-a mobilon történik. **Minden** dizájn-döntés legyen mobile-first. (A jelenlegi oldal valószínűleg desktop-first volt.)

**9. Skeleton loaderek**
Még SSR-rel is van rövid betöltési idő — skeleton (üres helyőrzők) sokkal jobb mint az üres képernyő.

**10. Mikro-interakciók**
Kosárba tétel → halk "csilingelés" + a kosár ikon mellett a szám 0.3s alatt felugrik. Apró dolog, de a prémium érzetet adja.

### 4.3 Top 5 vizuális javaslat

**1. Hero szekció a főoldalon**
Most: ?
Javaslat: Mónika fotója + brand-üzenet + 2 fő CTA (Webshop / Foglalás)

**2. Termék-vizualizáció**
Most: 1 kép kártyánként
Javaslat: A főkép mellett **mood image** (használat közben, asztalon stb.)

**3. Tipográfia hierarchia**
A Cormorant Garamond (luxus szerif) megmarad nagy címeknek, de a body egy moderebb sans-serif (Inter, Plus Jakara Sans) — jobb olvashatóság.

**4. Kép-aspect ratio konzisztencia**
Termékkártyák **mind ugyanolyan arányúak** (3:4 javasolt). Ez profi rendezett benyomást ad.

**5. Mikrocopy figyelmesség**
- Üres kosár: "Még nem választottál semmit. **Nézd meg, mit ajánl Mónika ebben a hónapban →**"
- Sikeres rendelés: "Köszönjük! Hamarosan postázom személyesen."
- 404: "Eltévedtél. Vissza a webshophoz, vagy beszéljünk: mona@monastudio.hu"

---

## 5. Tartalom-stratégia (kritikus a brand-építéshez)

### 5.1 Blog indítás — első 3 hónap

**1. hónap (alapozó cikkek)**
- "Bőrtípus felmérő — melyik a tied?"
- "Mit takar valójában az INCI lista? — kezdőknek"
- "5 alapszabály az otthoni bőrápoláshoz"

**2. hónap (hatóanyag-ABC)**
- "Niacinamid: mire jó és mikor használd?"
- "Hyaluronsav vs. Glikolsav: nem ugyanaz"
- "Retinol: kezdőknek és haladóknak"

**3. hónap (probléma-megoldó)**
- "Pigmentfoltok eltüntetése: mi működik tényleg?"
- "Rosacea otthoni kezelés"
- "Téli bőrszárazság: 4 hatékony lépés"

**Minden cikk végén:** 2-3 termék-ajánlás Mónika hangján — természetes konverzió.

### 5.2 Visszatérő tartalmi formátum

- **"Mónika hónap termékei"** (havi)
- **"Új a polcon"** (új márkák bemutatása)
- **"Olvasói kérdés"** (vásárlók által beküldött kérdések)

### 5.3 Vizuális tartalom

- Mónika **rövid videók** (30s) — termékhasználat bemutatás
- **Behind-the-scenes** a szalonból (Instagram → beágyazva a weboldalra)
- **Vásárlók fotói** (User Generated Content) — később, ha van bázis

---

## 6. Mérés és követés

### 6.1 GA4 célok beállítása

A meglévő GA4-be kerüljenek be **konverziós eseményként:**

- `view_product` — termékoldal megnyitva
- `add_to_cart` — kosárba tétel
- `begin_checkout` — pénztár indul
- `purchase` — sikeres rendelés (értékkel)
- `booking_click` — Setmore link kattintás
- `newsletter_signup` (ha lesz)
- `wishlist_add`
- `search` — kereső használat

### 6.2 Search Console — havi check-list

- Kulcsszavak miken jövünk be (és nem jövünk be)
- Page experience score
- 404-es URL-ek
- Mobile usability hibák
- Index lefedettség

### 6.3 Heatmap és session recording

Microsoft Clarity (ingyenes) — látsz felvételeket vásárlókról hogyan használják az oldalt. **Nélkülözhetetlen az UX optimalizáláshoz.**

---

## 7. Ütemezés — 3 hónapos roadmap

### 1. hónap — Technikai alap
- ✓ Auth (kész)
- ⏳ Készletkezelő + R2 + új webshop SSR
- ⏳ Egyedi termékoldal SSR
- ⏳ Sitemap, robots, schema.org
- ⏳ Microsoft Clarity beépítés
- ⏳ "Rólam" oldal Mónika fotójával

### 2. hónap — SEO és tartalom
- 4-6 alapozó blog cikk
- Termék leírások bővítése (long-form)
- Helyi SEO Vác — Google Business Profile optimalizálás
- "Szalon" oldal helyi schema-val
- Backlink építés (kozmetikai blog együttműködések)

### 3. hónap — UX és konverzió
- Heatmap adatok elemzése
- A/B teszt a kosár-elhagyási üzenetekkel
- Hűségprogram aktiválása
- Email marketing flow (welcome series, abandoned cart)

---

## 8. Mit NEM ajánlok (anti-recommendations)

- **❌ Felugró popup hírlevélre / kuponra** — luxus brand szegmensben olcsóvá teszi
- **❌ Live chat widget** — agresszív, és nincs mögötte 24/7 ember
- **❌ Túl sok felhívás** ("Hurry! 3 left!") — luxus brand nem siet
- **❌ User-generated stock fotók** — minden kép legyen Mónikához tartozó / brand-konform
- **❌ Influencer árcikkek aggregálása** — saját szakértelem a brand
- **❌ Marketplace-be belépés** (Amazon, eMag) — kannibalizálná a brand-pozíciót

---

## 9. Anti-pattern korrigálás (jelenlegi oldal hibái)

Ezek **konkrét hibák** amiket be kell javítani:

1. **Statikus kártyák HTML-ben** → Dinamikus D1-ből (most jön)
2. **Termékkártyára kattintva nem történik semmi** → Egyedi termékoldal
3. **Nincs kategória szűrés** → Bal panel szűrő
4. **Nincs keresés** → Header-ben kereső
5. **Nincs Mónika fotó** → Hero + Rólam oldal
6. **Nincs blog** → SEO motorként blog indítás
7. **Csak ADMIN_SECRET volt** → Google OAuth (kész)
8. **Nincs Schema.org** → Minden oldalra
9. **Sitemap nem dinamikus** → Worker generálja
10. **Open Graph hiányos** → Facebook/Twitter card minden oldalra

---

## 10. Eldöntendő stratégiai kérdések

Mielőtt mélyen belevágunk, válaszolj ezekre:

**A) Mónika személyes részvétele a brandben — milyen mértékig?**
- Csak hivatalos / professzionális anyag
- Közvetlenebb (Instagram-stílus, behind-the-scenes)
- Nagyon személyes (vlog-szerű videók, blog első személyben)

**B) Szalon és webshop arány a brand-üzenetben?**
- 70% webshop, 30% szalon
- 50-50%
- 30% webshop, 70% szalon-elsődlegesen

**C) Blog szerkesztői kapacitás — ki ír?**
- Mónika maga (időigényes, de hiteles)
- AI-asszisztált (én segítek megírni Mónika hangján)
- Bérelt copywriter (drágább, de gyors)

**D) Domain stratégia**
- Marad `monastudio.hu` minden tartalomhoz
- Külön `webshop.monastudio.hu` aldomain a webshopnak
- Külön `blog.monastudio.hu`

**E) Hírlevél — most kezdjük?**
- Igen, Mailchimp/MailerLite + welcome flow
- Később, először a webshopot fejezzük be

---

## 11. Összegzés — egyetlen mondatban

**A jelenlegi oldal egy szép kirakat — most kell motort tenni alá: dinamikus webshopot, SEO-tartalmat és Mónika személyes brand-jét, ami alapján a Google országosan rangsorolni tudja.**

A tervezett készletkezelő + webshop modul **az alap** ehhez. Utána jön a tartalom (blog, rólam) és a finomítás (UX, konverzió).
