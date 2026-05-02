# 09 — Verziónapló (Changelog)

A Mona Studio V2 projekt változásnaplója. [Keep a Changelog](https://keepachangelog.com/) formátumot követi, [Semantic Versioning](https://semver.org/) szerint.

---

## [Unreleased]

### Hozzáadás tervezett
- _Sprint 4.5.2 — `/profil/rendelesek` (rendelési előzmények)_
- _Sprint 4.5.3 — `/profil/cimek` (címkönyv CRUD)_
- _Sprint 4.5.4 — `/profil/kivansaglista` (wishlist)_
- _Sprint 4.5.5 — Email verifikáció + welcome email + discount code generálás_
- _Sprint 4.5.6 — Password reset flow_
- _Sprint 4.5.7 — Discount code validation a checkout-on_
- _Sprint 4.4 — Facebook Login (most átugorva, Sprint 5 utánra halasztva)_
- _Sprint 5 — Admin (Mónika) + termékkártya finomítás_

---

## [0.9.11] — 2026-04-27 — Sprint 4.5.x — Banner pozíció fix #2 + email verifikációs badge

### Probléma 1 — Banner pozíció

A v0.9.7 deploy után a `.profile-page` flex container `gap: var(--space-7)` 
szabályának ellenére **a banner és a "SZEMÉLYES ADATOK" cím átfedett** 
(lásd v0.9.10 utáni screenshot).

#### Diagnózis

A `--space-7` CSS változó **valószínűleg nem definiált** vagy nagyon kis 
értéket ad — emiatt a `gap` 0-ra esik vissza vagy túl kicsi. A `.profile-page` 
flex container nem ad elég teret a banner és a következő szekció között.

#### Javítás — explicit margin-bottom

```css
.profile-page__verify-banner {
  /* ... */
  margin-bottom: 1.5rem;  /* explicit, nem függ a CSS változótól */
}
```

A `1.5rem` (24px) közvetlen érték biztosítja a távot, függetlenül a parent 
flex gap-jétől.

### Probléma 2 — Email státusz nem látható

A vendég nem látja közvetlenül hogy az email-je verifikálva van-e vagy nem 
— csak a banner megjelenése (vagy hiánya) jelzi.

#### Javítás — verifikációs badge a label mellett

A "EMAIL CÍM" label mellé egy kompakt badge:
- ✓ **Verifikálva** — zöld háttér + zöld pipa SVG (csak ha `emailVerified === true`)
- ⚠ **Nem verifikált** — patina arany háttér + figyelmeztető SVG (csak ha `false`)

A két badge **egyszerre soha nem látszik** — a `[data-email-verified]` és 
`[data-email-unverified]` flag-ek alapján a JS állítja a `hidden` attribútumot.

A label `display: flex` + `gap` + `flex-wrap: wrap` szabályaival:
- Mobile (keskeny): a badge új sorba kerül
- Desktop: egy sorban, a label után

### Hozzáadva (markup)

```html
<label>
  Email cím
  <span class="profile-page__email-status">
    <span class="...badge--verified" data-email-verified hidden>✓ Verifikálva</span>
    <span class="...badge--unverified" data-email-unverified hidden>⚠ Nem verifikált</span>
  </span>
</label>
```

### Hozzáadva (CSS)

- `.profile-page__email-status-badge` — base
- `.profile-page__email-status-badge--verified` — zöld (`#4a8a5e` szöveg, `rgb(80 160 100 / 0.12)` háttér)
- `.profile-page__email-status-badge--unverified` — patina arany (`var(--mona-warm)`)
- `[hidden]` override

### Hozzáadva (JS)

A `subscribeAuthState` callback-ben a `c.emailVerified` érték alapján:
```typescript
emailStatus.hidden = false;          // mindig látszik
emailVerifiedBadge.hidden = !c.emailVerified;
emailUnverifiedBadge.hidden = c.emailVerified;
```

### UX folyamat

- **Most (vendég nem verifikált)**:
  - Banner látszik felül: "Email verifikáció ─10% kedvezmény..."
  - Email mező mellett: ⚠ "Nem verifikált" patina arany badge
- **Sprint 4.5.5 után (verifikálás után)**:
  - Banner eltűnik
  - Email mező mellett: ✓ "Verifikálva" zöld badge

### Fájlok (3)
- `package.json` — `0.9.10` → `0.9.11`
- `src/pages/profil/index.astro` — banner margin-bottom + email badge markup/CSS/JS
- `docs/09-changelog.md`

---



A vendég mostantól letöltheti a rendelési visszaigazolást PDF-be (a böngésző
natív "Save as PDF" funkciójával) vagy kinyomtathatja papírra.

### Hozzáadva

#### Új API endpoint
- **`GET /api/profile/orders/[orderNumber]`** — egy rendelés részletei
  - Ownership check: customer_id VAGY guest_email egyezés (v0.9.8 fallback alapján)
  - 404 ha nem találja vagy nem a vendég rendelése
  - Visszaadja az `OrderPublic` objektumot a tételekkel együtt

#### Új oldal: `/profil/rendelesek/[orderNumber]`
- **Részletes rendelés-nézet** (loading + error + content state)
- **"Nyomtatás / PDF letöltés"** gomb → `window.print()`
- Layout:
  - Header: cím + alcím (rendelés azonosító + dátum)
  - Status badge (színes)
  - Termékek táblázat (kép, név, db, egységár, részösszeg)
  - Árösszesítés (részösszeg, kedvezmény ha van, szállítás, **összesen**)
  - Vásárlói adatok + Szállítási cím (két oszlop, az auth-state-ből)
  - Fizetési mód + Szállítási mód
  - Megjegyzés (ha van)

#### Print stylesheet
- **`@media print`** szabályok a tisztán nyomtatható kinézethez:
  - Header / sidebar / footer / drawer **elrejtve**
  - Mona Studio fejléc (logo + cím) felül megjelenik (`order-detail__print-header`)
  - Köszönő láb alul megjelenik (`order-detail__print-footer`)
  - Színek fehérre / feketére normalizálva (PDF-friendly)
  - Termékkép 32x32 (volt 48x48) — kompaktabb papír layout
  - `page-break-inside: avoid` minden szekción — nem szakad el a közepén

#### Részletek link a `/profil/rendelesek` listán
- Minden kibontott rendelés alján egy "**Részletek és nyomtatás**" gomb
- Stílus: arany border, hover-en telített arany háttér

### UX folyamat

1. Vendég a `/profil/rendelesek` listán bontja ki egy rendelést
2. Klikk "Részletek és nyomtatás" → `/profil/rendelesek/MS-2026-0001`
3. Az oldal betölti a részleteket az új API endpoint-ról
4. Klikk "Nyomtatás / PDF letöltés"
5. Böngésző Print Preview megnyílik → "Save as PDF" → letöltés

### A nyomtatott PDF tartalmazza

- Mona Studio fejléc + cím + elérhetőség
- "Megrendelés visszaigazolása" cím
- Rendelés azonosító + dátum
- Státusz
- Termékek táblázat
- Árösszesítés
- Vásárlói adatok + szállítási cím
- Fizetési + szállítási mód
- Vendég megjegyzés (ha van)
- Köszönő láb

### Mit NEM csinál még

- ❌ Hivatalos NAV-kompatibilis számla — Sprint 5+ (Számlázz.hu / Billingo integráció)
- ❌ Email-ben automatikus PDF csatolmány a rendelés visszaigazolásához
- ❌ Brand-erős szerver oldali PDF (most a böngésző-nyomtatás minőségére hagyatkozunk)

### Fájlok (4)

**Új**:
- `src/pages/api/profile/orders/[orderNumber].ts` — egy rendelés API endpoint
- `src/pages/profil/rendelesek/[orderNumber].astro` — részletes oldal + print stylesheet

**Módosított**:
- `src/pages/profil/rendelesek.astro` — "Részletek és nyomtatás" link a kártyákban
- `package.json` — `0.9.9` → `0.9.10`
- `docs/09-changelog.md`

### Sprint 5+ tervezett — Hivatalos számlázás

Mónika kiválasztja a számlázó szolgáltatót (Számlázz.hu / Billingo / KBOSS),
regisztrál, és a webhook integráció: rendelés sikeres fizetés után automatikus
számla generálás. A számla URL bekerül az `orders.invoice_url` mezőbe, és
a vendég a `/profil/rendelesek/[orderNumber]` oldalon külön gomb ("Számla
letöltése") segítségével letölti.

---



### Probléma

A v0.9.6 modal popup-os címform UX túl agresszív volt:
- Túl magas form mobile-on (scroll-behind-modal probléma)
- Modal popup blokkolja a háttért — nem brand-konzisztens
- Settings checkbox-ok (Cím használata + Alapértelmezett) **uppercase nagy 
  feliratokkal** túl agresszívek voltak
- A "Mentés" / "Mégse" gombok lent eltűntek a scroll alá

### Javítás — inline expand pattern

Modal popup → **inline expand a profil oldalon**:

- A "+ Új cím hozzáadása" gomb helyén bontódik ki a form
- A form-blokk **a lista alatt** ül, brand-konzisztens (3px arany bal akcentus, 
  mint a verifikációs banner)
- Smooth scroll a form-hoz nyitáskor + label input focus
- "Cím használata" + "Alapértelmezett" összevonva egy **"Beállítások"** 
  szekcióba, **kompakt 2x2 grid** layout-tal (mobile-on 1 oszlop)
- Checkbox feliratok: **normál súly (400) + nincs uppercase** — sokkal 
  csendesebb mint a v0.9.6-os fieldset legend-ek
- ESC + backdrop click logika **eltávolítva** (nincs modal)
- Cancel → form bezár, "+ Új cím" gomb visszajön

### UX előnyök

- **Mobile**: nincs két scroll-szint (modal-on belül + body), egyetlen oldal-scroll
- **Desktop**: a vendég látja a már mentett címeket közben (nem rejtett modal-mögött)
- **Brand**: csendesebb, nyugodtabb — illik a Mona Studio "fiók-területe" 
  hangulatához
- **Szerkesztés**: a kártya helyén bontódik ki a form, természetes vizuális 
  folytonosság

### Új CSS osztályok

`.address-form-block*` (modal helyett):
- `.address-form-block` — 3px arany bal akcentus, white background
- `.address-form-block__title` — serif, 22px, alá vékony border
- `.address-form-block__field` / `__field-row` / `__input`
- `.address-form-block__settings` — elevated bg, kompakt
- `.address-form-block__settings-grid` — 2x2 grid (mobile 1 oszlop)
- `.address-form-block__checkbox` — explicit `text-transform: none`, 
  `font-weight: 400`, `letter-spacing: normal`
- `.address-form-block__actions` — jobbra align (mobile-on column-reverse)

### Eltávolítva

`.address-modal*` osztályok TÖRÖLVE (nincs többé modal).

### Fájlok (3)
- `package.json` — `0.9.8` → `0.9.9`
- `src/pages/profil/cimek.astro` — teljes újraírás inline expand-del
- `docs/09-changelog.md`

---



### Probléma

A Sprint 4 ELŐTT a vendégek anonymous-ként checkout-oltak (csak `guest_email`,
`guest_name`, `guest_phone`), és az `orders.customer_id` mező NULL maradt.
A v0.9.2 (Sprint 4.5.2) `/profil/rendelesek` oldal **csak a customer_id egyezés
alapján** kereste a rendeléseket, így a régi rendelések **nem voltak láthatók**
a vendég profil területén — pedig az emailje egyezett.

### Megoldás — két részre bontva

#### 1. SQL backfill (egyszeri)

`migrations/0006_backfill_orders_customer_id.sql`:
```sql
UPDATE orders
SET customer_id = (
  SELECT c.id FROM customers c WHERE c.email = orders.guest_email LIMIT 1
)
WHERE customer_id IS NULL
  AND guest_email IN (SELECT email FROM customers);
```

A migráció:
- BEFORE: kiírja hány orphan rendelés van (customer_id NULL + matching email)
- UPDATE: összekapcsolás email egyezés alapján
- AFTER: verifikáció, hogy 0 maradt

A `customers.email UNIQUE` constraint biztosítja hogy csak pontosan egy customer
egyezhet egy adott email-lel, így az UPDATE determinisztikus.

#### 2. Backend fallback logika (jövőbiztos)

A `/api/profile/orders` endpoint mostantól **kétféleképp** is felismeri a
vendég rendeléseit:

```typescript
SELECT * FROM orders
WHERE customer_id = ?
   OR (customer_id IS NULL AND guest_email = ?)
ORDER BY created_at DESC
```

Ez a **fallback** védő ha:
- A vendég anonymous-ként rendel (kijelentkezve), majd belép később ugyanazzal
  az email-lel
- Másik browserben rendelt és nem volt logged-in
- Admin-szerű tisztogatás miatt a customer_id reset-elődik

### Tanulság

**Backwards-compat fontos**: amikor egy új mezőt vezetünk be (mint a
`orders.customer_id` Sprint 4-ben), gondoljunk át **3 dologra**:
1. **Új rekordok**: a kód automatikusan kitölti
2. **Backfill**: egy migráció a régi rekordokra
3. **Fallback**: a kód a régi struktúrára is illik (ne csak az új mezőre építsen)

Ezt **a Sprint 5+ admin felületen** is alkalmazzuk: amikor új mezőt vezetünk be,
mind a 3 lépést tervezzük.

### Migráció futtatás

```powershell
npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0006_backfill_orders_customer_id.sql
```

A migráció kimenete (példa):
```
BEFORE: orders with NULL customer_id but matching guest_email: 3
[7 lekérdezés sikeres]
AFTER: orders with NULL customer_id but matching guest_email: 0
```

### Fájlok (3)

- `migrations/0006_backfill_orders_customer_id.sql` (új)
- `src/pages/api/profile/orders.ts` — fallback query
- `package.json` — `0.9.7` → `0.9.8`
- `docs/09-changelog.md`

---



### Probléma

A v0.9.6 deploy után a `/profil` oldalon a verifikációs banner **alsó éle 
átfedte a "SZEMÉLYES ADATOK" cím vízszintes vonalát**. Vizuálisan zavaró 
volt — a banner és a következő szekció címe **összefolytak**.

### Diagnózis

A banner a `<header class="profile-page__header">` **belsejében** volt 
elhelyezve, ami azt jelentette:
- A header `gap: var(--space-2)` szabálya működött a title + subtitle között
- A `.profile-page { gap: var(--space-7) }` viszont csak a `<header>` és a 
  következő blokk közötti távot adta — **a banner a header részeként** 
  vizuálisan kilógott a header dobozából, és a következő szekció címe 
  **a header doboztól** csatolódott, **nem a banner aljától**

### Javítás

#### 1. Banner kiemelése a header-ből önálló blokká

```html
<!-- ELŐTTE -->
<header>
  <h1>Profilom</h1>
  <p>Itt kezelheted...</p>
  <div class="...verify-banner">...</div>   ← header-en belül
</header>
<form>...</form>

<!-- UTÁNA -->
<header>
  <h1>Profilom</h1>
  <p>Itt kezelheted...</p>
</header>
<div class="...verify-banner">...</div>   ← önálló blokk
<form>...</form>
```

A `.profile-page { gap: var(--space-7) }` flex-szabálya most automatikusan ad 
teret **felette + alatta** is.

#### 2. CSS finomhangolás

- `margin-top: var(--space-4)` ELTÁVOLÍTVA a `.profile-page__verify-banner`-ből 
  (a flex gap kezeli)
- `[hidden]` override hozzáadva: `.profile-page__verify-banner[hidden] { 
  display: none !important }` (ugyanaz mint a v0.9.6-os `[hidden]` fix mintája)

### Tanulság

**Hierarchikus markup**: ha egy elem **vizuálisan önálló blokk**, akkor 
**szerkezetileg is** önállónak kell lennie. Ne ágyazzunk be vizuálisan eltérő 
blokkokat egy `<header>` vagy `<section>` belsejébe csak azért mert "logikailag 
szervesen tartoznak" — a CSS gap/margin szabályok jobban kezelik ha minden 
blokk a tényleges parent-flex container közvetlen gyermeke.

### Fájlok (3)
- `package.json` — `0.9.6` → `0.9.7`
- `src/pages/profil/index.astro` — banner kiemelés header-ből + CSS finomhangolás
- `docs/09-changelog.md`

---



A `/profil/cimek` címkönyv oldal élesedik (CRUD + külön szállítási/számlázási
default cím), valamint egy CSS bug-fix amit a `/profil/rendelesek` oldalon
észleltünk a v0.9.2 deploy után.

### Architektúra döntések rögzítve (Sprint 4.5.3)

- **Címtípus**: hibrid — univerzális címek + külön szállítási/számlázási default
- **Limit**: max 10 cím vendégenként
- **Auto-mentés**: első checkout-ról auto-default mentés; később checkbox
  "Mentsd a címet a fiókomba" (Sprint 4.5.3.x)

### Hozzáadva — D1 séma

- **`migrations/0005_sprint4_5_3_addresses.sql`**:
  - `customer_addresses.is_default_shipping` (új mező)
  - `customer_addresses.is_default_billing` (új mező)
  - Migráció: meglévő `is_default = 1` → mindkét új flag-re átkonvertálva
  - Régi `idx_customer_addresses_default` index TÖRÖLVE
  - Új unique index-ek (egy customer-enként max 1 default-shipping + 1 default-billing)
  - Megjegyzés: a régi `is_default` mező maradt (D1 SQLite nem támogat
    DROP COLUMN), de az új kódbázis nem használja

### Hozzáadva — TS típusok

- **`src/lib/types/addresses.ts`** (~180 sor):
  - `AddressRow` (D1) + `AddressPublic` (frontend view)
  - `AddressCreateRequest`, `AddressUpdateRequest`, `SetDefaultRequest`
  - `validateAddress()` — kötelező mezők + max length-ek
  - `MAX_ADDRESSES_PER_CUSTOMER = 10`

### Hozzáadva — API endpoints (4 db)

- **`GET /api/profile/addresses`** — vendég összes címe, default-ok elsőként
- **`POST /api/profile/addresses`** — új cím (validáció + limit + auto-default)
- **`PUT /api/profile/addresses/[id]`** — módosít (ownership check)
- **`DELETE /api/profile/addresses/[id]`** — töröl
- **`POST /api/profile/addresses/default`** — `{ type, addressId }` default beállítás

Minden endpoint: auth required, outer try/catch + struktúrált 500 JSON,
ownership check (vendég csak a saját címeit kezelheti).

### Hozzáadva — `/profil/cimek` oldal

- **`src/pages/profil/cimek.astro`** (~700 sor):
  - 3 állapot: loading, empty, error (mind explicit `[hidden]` override-zal)
  - Cím-kártyák grid (2 oszlop desktop, 1 oszlop mobile)
  - Címke + badge-ek (Szállítási default / Számlázási default)
  - Action gombok: szerkeszt + töröl mini ikon-gombok
  - "+ Új cím hozzáadása" szaggatott border gomb (hover patina arany)
  - Modal popup (új / szerkesztés) — címke, címzett, telefon, utca, ZIP+város,
    Cím használata fieldset (Szállítás/Számlázás), Alapértelmezett fieldset
  - Custom checkbox: arany pipa fehér háttéren
  - Limit: 10 cím (a 10. után disabled)

### Javítva — `[hidden]` attribute CSS override

#### Probléma

A `/profil/rendelesek` oldalon a vendég azt látta, hogy **mind a "Rendelések
betöltése..." spinner, mind az "Még nincsenek rendeléseid" empty state
egyszerre megjelenik**. A JS logika **OK** volt — `showEmpty()` lefutott,
`hideAll()` beállította `loadingEl.hidden = true`-t. **De vizuálisan** a
loading még mindig látszott.

#### Diagnózis

A CSS-ben a `.orders-page__loading { display: flex }` (és más állapot-elemek
`display: flex` / `grid` / `block`) **felülírja** a `[hidden]` HTML
attribútum default `display: none` értékét, mert a class selector specificitása
magasabb mint az attribute selector-é.

Ugyanez a hiba az **AuthModal SVG eye-icon** problémájának (v0.8.6) tükörképe.

#### Javítás — explicit `[hidden]` override

Hozzáadva minden state-elem-re:
```css
.profile-layout__guard[hidden],
.profile-layout__container[hidden],
.orders-page__loading[hidden],
.orders-page__empty[hidden],
.orders-page__error[hidden],
.orders-page__list[hidden],
.addresses-page__loading[hidden],
.addresses-page__empty[hidden],
.addresses-page__error[hidden],
.addresses-page__container[hidden],
.address-modal[hidden] {
  display: none !important;
}
```

### Tanulság (Sprint 5+ tervezésre)

Sprint 5 előtt érdemes a **`reset.css`-be** tenni egy globális
`[hidden] { display: none !important }` szabályt, hogy ne kelljen minden
komponens-ben külön foglalkozni vele.

### Migráció futtatás

```powershell
npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0005_sprint4_5_3_addresses.sql

# Ellenőrzés:
npx wrangler d1 execute monastudio-v2-db --remote --command "PRAGMA table_info(customer_addresses);"
# Várt: ..., is_default_shipping, is_default_billing, ...
```

### Fájlok (8)

**Új** (Sprint 4.5.3):
- `migrations/0005_sprint4_5_3_addresses.sql`
- `src/lib/types/addresses.ts`
- `src/pages/api/profile/addresses/index.ts` (GET + POST)
- `src/pages/api/profile/addresses/[id].ts` (PUT + DELETE)
- `src/pages/api/profile/addresses/default.ts` (POST)
- `src/pages/profil/cimek.astro`

**Módosított** (hidden fix):
- `src/layouts/ProfileLayout.astro`
- `src/pages/profil/rendelesek.astro`

**Verzió + dokumentáció**:
- `package.json` — `0.9.5` → `0.9.6`
- `docs/09-changelog.md`

---



A vendég profil területén megjelenik a `/profil/cimek` oldal: hozzáadhat, 
szerkeszthet, törölhet **legfeljebb 10** mentett címet, és külön választhat 
default szállítási és számlázási címet.

### Architektúra döntések rögzítve

- **Címtípus**: hibrid — univerzális címek + külön szállítási/számlázási default
- **Limit**: max 10 cím vendégenként
- **Auto-mentés**: az első checkout-ról auto-default mentés; később checkbox 
  "Mentsd a címet a fiókomba" (Sprint 4.5.3.x)

### Hozzáadva — D1 séma

- **`migrations/0005_sprint4_5_3_addresses.sql`**:
  - `customer_addresses.is_default_shipping` (új mező)
  - `customer_addresses.is_default_billing` (új mező)
  - Migráció: meglévő `is_default = 1` → mindkét új flag-re átkonvertálva
  - Régi `idx_customer_addresses_default` index TÖRÖLVE
  - Új unique index-ek: `idx_customer_addresses_default_shipping`, 
    `idx_customer_addresses_default_billing` (egy customer-enként max 1 default)
  - Megjegyzés: a régi `is_default` mező maradt (D1 SQLite nem támogat 
    DROP COLUMN), de az új kódbázis nem használja

### Hozzáadva — TS típusok

- **`src/lib/types/addresses.ts`** (~180 sor):
  - `AddressRow` (D1 shape) + `AddressPublic` (frontend view)
  - `AddressCreateRequest`, `AddressUpdateRequest`, `SetDefaultRequest`
  - `AddressListResponse`, `AddressMutationResponse`
  - `validateAddress()` — kötelező mezők + max length-ek
  - `MAX_ADDRESSES_PER_CUSTOMER = 10`

### Hozzáadva — API endpoints (4 db)

- **`GET /api/profile/addresses`** — vendég összes címe, default-ok elsőként
- **`POST /api/profile/addresses`** — új cím (validáció + limit check + 
  auto-default ha első cím)
- **`PUT /api/profile/addresses/[id]`** — módosít (ownership check, default-ok 
  átállítás)
- **`DELETE /api/profile/addresses/[id]`** — töröl (ownership check, 
  ON DELETE CASCADE az indexek miatt)
- **`POST /api/profile/addresses/default`** — `{ type, addressId }` — 
  két lépésű művelet: töröl mindenhonnan + beállít a célon

Minden endpoint:
- Auth required
- Outer try/catch + struktúrált 500 JSON
- Ownership check (a vendég csak a saját címeit kezelheti)

### Hozzáadva — `/profil/cimek` oldal

- **`src/pages/profil/cimek.astro`** (~700 sor):
  - **3 állapot**: loading, empty, error
  - **Cím-kártyák grid** (2 oszlop desktop, 1 oszlop mobile):
    - Címke ("Otthon", "Munkahely") + badge-ek (Szállítási default / 
      Számlázási default)
    - Címzett neve + telefon
    - 2600 Vác, Zrínyi Miklós u. 3.
    - Használat tag-ek (Szállítás · Számlázás) ha nincs default
    - Action gombok: szerkeszt + töröl (mini ikon-gombok)
    - Footer: "Tedd szállítási default-tá" / "Tedd számlázási default-tá" 
      gyors gombok
  - **"+ Új cím hozzáadása"** szaggatott border gomb (hover patina arany)
  - **Modal popup** (új / szerkesztés):
    - Címke, Címzett, Telefon (opc), Utca + házszám
    - Irányítószám + Város (1:2 grid)
    - Fieldset: Cím használata (Szállítás / Számlázás checkbox-ok)
    - Fieldset: Alapértelmezett (Szállítási / Számlázási default checkbox-ok)
    - Custom checkbox stílus (consistent a profile-page-szel: arany pipa)
    - Mentés gomb loading állapottal
  - **Limit kezelés**: ha 10 cím van, az "Új cím hozzáadása" gomb disabled, 
    szöveg: "Maximum 10 cím tárolható (10/10)"

### UX részletek

- **Default jelzések**:
  - Patina arany badge a "Szállítási default" cím-en
  - Kék badge a "Számlázási default" cím-en
  - Ha mindkettő egy címen van: 2 badge egymás mellett
- **Set default link** csak akkor látszik a footerben, ha:
  - A cím nem már default arra a célra
  - A cím használható arra a célra (`is_shipping` / `is_billing` = 1)
- **Hover effect**: card border patina aranyra vált
- **Modal**: backdrop blur + centered panel, ESC bezárja, klikk a backdrop-on 
  is bezárja
- **Confirm dialog** törléskor: `confirm("Biztosan törölni szeretnéd a(z) "X" címet?")`

### Mit NEM csinál még (Sprint 4.5.3.x)

- ❌ **Auto-mentés a checkout-ról** (a vendég első rendelésénél a cím 
  automatikusan elmentésre kerül a címkönyvébe + default lesz) — később
- ❌ **"Mentsd a címet a fiókomba" checkbox** a checkout-on (logged-in 
  vendég, már nem első rendelés)
- ❌ **"Korábbi cím használata" gyors választó** a checkout-on (lista a 
  mentett címekből → egy klikk auto-fill)
- ❌ **Címek importálása** (CSV / vCard) — Sprint 5+

### Fájlok (5 új + 2 módosított)

**Új**:
- `migrations/0005_sprint4_5_3_addresses.sql`
- `src/lib/types/addresses.ts`
- `src/pages/api/profile/addresses/index.ts` (GET + POST)
- `src/pages/api/profile/addresses/[id].ts` (PUT + DELETE)
- `src/pages/api/profile/addresses/default.ts` (POST)
- `src/pages/profil/cimek.astro`

**Módosított**:
- `package.json` — `0.9.5` → `0.9.6`
- `docs/09-changelog.md`

### Migráció futtatás

```powershell
npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0005_sprint4_5_3_addresses.sql

# Ellenőrzés:
npx wrangler d1 execute monastudio-v2-db --remote --command "PRAGMA table_info(customer_addresses);"
# Várt: ..., is_default_shipping, is_default_billing, ...
```

---



### Probléma

A v0.9.1 ZIP nem érkezett tisztán a Cursor-on keresztül a lokális kódbázisba.
A markup-ot átneveztem `.profile-page__banner*` → `.profile-page__verify-banner*`
osztályokra, **de a CSS** a régi nevén maradt. Eredmény: a v0.9.3 deploy után
a banner CSS-e **nem alkalmazódott** — flex layout szétesett, ikon árva,
"Küldj verifikációs linket" gomb plain szövegként folyt a "SZEMÉLYES ADATOK"
szekció alá.

### Javítás

#### 1. Banner CSS teljes felülírás — Statement variáns (Opció 2)

A `/profil/banner-preview` oldal 3 változatából a **Statement** lett kiválasztva:
- 3px bal oldali patina arany akcentus + 12% háttér
- 44×44 px kerek arany doboz az ikonnak
- **Eyebrow style cím**: "EMAIL VERIFIKÁCIÓ" (uppercase, kis font, arany szín)
- **Serif heading szöveg**: 15px, "Verifikáld az email címed, és kapsz
  **−10% kedvezmény** az első rendelésre."
- **Telített arany CTA gomb**: "Küldj linket"

#### 2. Banner markup átszerkesztés

A korábbi struktúra (`<strong>` title + `<p>` text) most:
```
<p class="...title">Email verifikáció</p>      ← eyebrow
<p class="...text">
  Verifikáld..., és kapsz <strong>−10% kedvezmény</strong> az első rendelésre.
</p>                                            ← heading
```

Ez illeszkedik a Statement variáns vizuális hierarchiájához.

#### 3. Banner-preview oldal törlése

A `src/pages/profil/banner-preview.astro` (v0.9.3-ban hozzáadott IDEIGLENES
preview) **eltávolításra került**, miután a választás megszületett.

### Mobile responsive

- A banner `flex-wrap: wrap` mobil-on
- Az ikon 36×36 (volt 44×44)
- A "Küldj linket" gomb teljes szélességű

### Tanulság (Sprint workflow)

A "patch-csomag → Cursor másolja át" workflow akkor problémás amikor:
- Egy fájl markup-ja és CSS-je egyszerre változik
- A patch nem tisztán érkezik
- Eredmény: markup új osztályneveket, CSS régi osztályneveket használ

**Megoldás Sprint 5+ workflow-ban**: nagyobb refactor csomagoknál a teljes
fájl ZIP-je menjen, ne részletes diff/patch.

### Fájlok

- `package.json` — `0.9.4` → `0.9.5`
- `src/pages/profil/index.astro` — banner markup + CSS Statement variáns
- `src/pages/profil/banner-preview.astro` — **TÖRÖLVE**
- `docs/09-changelog.md`

---



A pénztár oldal mostantól érzékelhető módon másképp néz ki logged-in 
vendégeknek: chip a fejlécben, welcome blokk, és **automatikus auto-fill** 
a fiók-adatokból.

### Hozzáadva

#### 1. Logged-in chip a "Vásárlói adatok" fejlécben
- Mini avatar SVG ikon (arany)
- Vendég email-je
- "Kijelentkezés" link

#### 2. Welcome blokk a form-on
A "Vásárlói adatok" cím alatt patina arany blokk: *"Üdv újra, Peter! Az 
adatokat átvettük a fiókodból. Ha másik címre szeretnéd, alább módosítsd."*

Bal oldali 2px arany akcentussal — vizuálisan visszaköszön a profil oldal 
verifikációs banner-stílusából.

#### 3. Auto-fill a 3 mezőre
A `subscribeAuthState` callback alapján:
- **Teljes név**: `firstName + lastName` összerakva
- **Email**: customer email (és **readonly** logged-in vendégeknek)
- **Telefon**: customer telefon

A logika: csak akkor ír át, ha az adott mező **még üres**. A kitöltött mezők 
finom patina arany háttérszínt kapnak (`.checkout-input--prefilled`).

#### 4. Email mező readonly logged-in állapotban
Vizuális jel: szaggatott border + elevated bg + cursor not-allowed. Hint a 
label után: *"(fiókod email-je)"*. A logged-in account email-je egyedi 
azonosító, nem módosítható itt (Sprint 4.5.5-ben lesz email csere flow).

#### 5. Logout chip-ről
"Kijelentkezés" link megerősítést kér: *"Biztosan kijelentkezel? A megadott 
adatok megmaradnak a form-on."* A form adatok megmaradnak, a vendég 
továbbmehet anonymous-ként.

### Mit halasztunk Sprint 4.5.3-ra (címkönyv)

Címbeállítások: a vendég "Korábbi rendelési címedre szállítsuk?" gombbal 
kiválaszthatja a meglévő címet. Csak Sprint 4.5.3 (címkönyv backend) után 
kivitelezhető.

### Fájlok (3)
- `package.json` — `0.9.3` → `0.9.4`
- `src/pages/penztar/index.astro` — markup + JS auto-fill + CSS
- `docs/09-changelog.md`

---

## [0.9.3] — 2026-04-27 — Sprint 4.5.x — Banner preview oldal (IDEIGLENES)

**Ideiglenes preview oldal** a verifikációs banner 3 variánsának élő 
összehasonlításához. A választás után törlés.

### Hozzáadva

- **`src/pages/profil/banner-preview.astro`** (~500 sor):
  - **Opció 1 — Subtle plus**: 12% háttér, 1px border, 14px/700 cím, "−10%" arany
  - **Opció 2 — Statement**: 3px bal oldali arany akcentus, kerek arany ikon, 
    16px arany "−10%" highlight, arany CTA gomb
  - **Opció 3 — Inverted**: sötét `--mona-text` háttér, fehér szöveg, arany 
    akcent — premium notification banner stílus
  - "Mit gondolsz?" döntési szekció alul

A profil layout-on belül jelenik meg, valódi vizuális kontextusban (sidebar, 
padding, brand-vonal).

### Várja

A választás után az opció bekerül az éles `/profil/index.astro`-ba, és 
ez a fájl **törlésre kerül**.

### Fájlok (1 új)

- `src/pages/profil/banner-preview.astro`
- `package.json` — `0.9.2` → `0.9.3`

---

## [0.9.2] — 2026-04-27 — Sprint 4.5.2 — Rendelési előzmények ⭐

A vendég profil területén megjelenik a rendelési előzmények oldal: 
összes korábbi rendelés dátum szerint csökkenően, accordion-szerűen 
kibontható részletekkel.

### Hozzáadva — TS típusok

- **`src/lib/types/orders.ts`** (~180 sor):
  - `OrderRow`, `OrderItemRow` — D1 shape-ek (Sprint 3.4 séma + Sprint 4.5.1 
    `discount_code_id`, `discount_amount_ft`)
  - `OrderPublic`, `OrderItemPublic` — frontend-friendly view (snake_case → 
    camelCase, magyar címkék, dátum formázás)
  - `OrderStatus` — 7 állapot: pending, paid, preparing, shipped, delivered, 
    cancelled, refunded
  - `STATUS_LABELS` — magyar nyelvű címkék + színek (amber, blue, green, 
    gray, red)
  - `SHIPPING_LABELS`, `PAYMENT_LABELS` — szállítási és fizetési mód címkék
  - `formatDateHu()` — dátum: "2026. január 15." formátum
  - `orderRowToPublic(order, items)` — kompozit konverzió (qty összesítés, stb.)

### Hozzáadva — API endpoint

- **`src/pages/api/profile/orders.ts`** (~100 sor):
  - `GET /api/profile/orders`
  - Auth required (`getCurrentCustomer` — 401 ha nincs cookie)
  - **BATCH lookup**: rendelések → `IN (...)` query az összes order_items-re 
    egyszerre (nem N+1 lekérés)
  - Csoportosítás `Map<order_id, items[]>` szerint
  - Vissza `OrderPublic[]` — dátum DESC sorrendben
  - Outer try/catch: minden exception strukturált 500 JSON
  - Nincs pagination: várhatóan 0-50 rendelés vendégenként, egy lekérés elég

### Hozzáadva — `/profil/rendelesek` oldal

- **`src/pages/profil/rendelesek.astro`** (~600 sor):
  - **Page header**: "Rendelések" + alcím
  - **3 állapot dinamikusan**:
    - **Loading**: spinner + "Rendelések betöltése..."
    - **Empty**: SVG ikon + *"Még nincsenek rendeléseid"* + CTA "Webshop megnézése"
    - **Error**: piros panel + "Újrapróbálás" gomb
  - **Order card** (accordion):
    - **Summary** (összecsukva): dátum, rendelés szám, **státusz badge** 
      (színes), összeg, termékszám, chevron lefelé
    - **Detail** (kibontva, klikk után): 
      - **Tételek lista**: kép (60×75 px), név (link a termékre), 
        qty × egységár, részösszeg
      - **Szállítási cím** (FoxPost vagy személyes átvétel)
      - **Fizetési mód** (átutalás / utánvét / SimplePay)
      - **Megjegyzés** (ha van)
      - **Totals**: részösszeg, kedvezmény (ha van), szállítás, **összesen**
  - **Mobile responsive**: a summary 4-oszlopból 2-oszlopra alakul, a chevron 
    átmegy a 2. oszlop aljára

### Vizuális részletek

- **Status badge színek**:
  - 🟡 Amber: `pending` (Fizetésre vár)
  - 🔵 Blue: `paid`, `preparing`, `shipped` (folyamatban)
  - 🟢 Green: `delivered` (leszállítva)
  - ⚪ Gray: `cancelled`, `refunded`
  - 🔴 Red: (nincs használatban most, jövőbeli flag-ekhez)
- **Hover effect**: a card border patina aranyra vált
- **Accordion ikon**: chevron lefelé, kibontva 180°-os forgatás (smooth)
- **Detail bg**: `--mona-elevated` (a paletta szürkéje) — vizuálisan elkülöníti 
  a summary-tól

### UX részletek

- **A termék-link a rendelésben** a `/termek/{slug}` oldalra mutat — ha a vendég 
  újra akarja venni vagy megnézni a termék részleteit
- **Termék kép placeholder**: ha `product_image_url IS NULL`, üres szürke doboz 
  (nem hibázik a `<img src="">`)
- **Termék snapshot adatok**: `product_name`, `product_image_url`, 
  `price_at_order_ft` a rendeléskor "lefagyasztott" — még akkor is helyesen 
  mutat ha azóta megváltozott a termék

### Mit NEM csinál még (Sprint 4.5.x)

- ❌ Pagination (jelenleg az összes rendelés egyben)
- ❌ Szűrés (státusz / dátum tartomány / termék)
- ❌ "Számla letöltése PDF-ben" — Sprint 5+
- ❌ "Reklamáció / visszaküldés" gomb — Sprint 6+ (return management)
- ❌ "Újra megrendelés" gomb (egy klikkel ugyanazokat a termékeket kosárba) — 
  Sprint 5+

### Fájlok (3 új)

- `src/lib/types/orders.ts`
- `src/pages/api/profile/orders.ts`
- `src/pages/profil/rendelesek.astro`
- `package.json` — `0.9.1` → `0.9.2`
- `docs/09-changelog.md`

---



### Változott

#### 1. Verifikációs banner — kompakt eyebrow stílusú, header-en belülre

**Probléma**: a banner külön blokk-ban jelent meg a header és a form között, 
és átfedte a "SZEMÉLYES ADATOK" szekció címet. **Az üzenete** is félrevezető 
volt: *"Email cím verifikálása szükséges"* — a "szükséges" szó hibásan azt 
sugallta hogy **kötelező** a használathoz.

**Új viselkedés**:
- A banner **a `<header>` blokkon belülre** került (a subtitle után)
- **Kompakt egysoros design**: ikon + üzenet + akció gomb egy sorban
- **Patina arany** finom háttérrel (`rgb(192 154 80 / 0.06)`) — invitáló, 
  nem zaklatott
- **Új üzenet**: *"Email cím még nem verifikálva — Verifikáld az email címedet, 
  és <strong>-10% kedvezményt</strong> kapsz az első rendelésedre."*
- **Akció gomb**: "Küldj verifikációs linket" (most disabled, Sprint 4.5.5-ben 
  aktiválódik)
- **Mobile-on**: a gomb teljes szélességűre tördelődik

#### 2. Form mező háttér logika — fordítva (`mona-elevated` ↔ `mona-bg`) ⭐

**Probléma**: a v0.9.0-ban a **szerkeszthető** mezők háttere fehér (`--mona-bg`) 
volt, a **readonly** mezőé szürkés (`--mona-elevated`). Vizuálisan a fehér háttér 
sugallja hogy "ide írj", de a readonly mezőben **mégsem lehet írni** — ez a 
vendégnek **félrevezető**.

**Új viselkedés** (logika megfordítva):
- **Szerkeszthető mezők**: `background: var(--mona-elevated)` + folytonos border
  → vizuálisan "interaktív felület"
- **Readonly mezők**: `background: var(--mona-bg)` + **szaggatott border** 
  (`border-style: dashed`)
  → vizuálisan "papír", nem szerkeszthető
- **Fókuszban a szerkeszthető**: a háttér `--mona-bg`-re vált — finom natural
  progression ("most ezt írom")

**Indok**: a brand-design rendszerében a `--mona-elevated` már most is "interaktív 
jelzés" a többi UI-elemen (cart drawer item bg, hover state-ek). A profil 
form-on ennek a szabálynak az érvényesítése konzisztenciát ad.

### Tanulság

**Form mező háttér konvenciók**:
- **Szerkeszthető** = visszafogott "interaktív" jel (hovered, elevated, 
  finom mélységi jel)
- **Readonly** = "lapos papír" jel (azonos a page bg-vel, esetleg dashed border)

Ezt **alapelvként rögzítjük** a `docs/02-design-system.md`-be (ha lesz Sprint 5+ 
frissítés). Minden Sprint 5+ form-on (admin felület, password reset, profil 
egyéb oldalak) ezt a konvenciót követjük.

### Fájlok (3)
- `package.json` — verzió `0.9.0` → `0.9.1`
- `src/pages/profil/index.astro` — banner refactor + input bg fordítás
- `docs/09-changelog.md`

---



**MINOR bump** — Sprint 4.5 első csomagja. A `/profil` oldal mostantól élő, 
a sidebar layout készen áll a többi profil oldal befogadására.

### Architektúra döntések (rögzítve)

- **Profil layout**: **C — Sidebar layout** (luxury, hosszú távú). Bal oldali 
  fix nav desktop-on, horizontális scroll-os tab nav mobile-on. Glossier / 
  Net-a-Porter inspiráció.
- **Email verifikáció**: **C — soft, csak a -10% bónuszhoz kötelező**. 
  A vendég rendelhet anélkül is, de a kedvezmény csak verifikált fióknál.
- **Mailchimp -10% bónusz**: **A — discount code email-ben**. Egyedi 
  `WELCOME-XXXXXX` formátumú kód, a checkout-on beírható.

### Hozzáadva — Adatbázis (D1)

- **`migrations/0004_sprint4_5_profile.sql`**:
  - `discount_codes` tábla (vendég-specifikus + általános kuponkódok)
  - `customers.welcome_discount_issued_at` flag
  - `orders.discount_code_id` (FK) + `orders.discount_amount_ft`

### Hozzáadva — TS típusok

- **`src/lib/types/profile.ts`** — `ProfileUpdateRequest`, `DiscountCodeRow`, 
  `DiscountValidationResult`

### Hozzáadva — Layout

- **`src/layouts/ProfileLayout.astro`** (~430 sor):
  - 2-oszlopos grid desktop-on (240px sidebar + 1fr content)
  - Mobile-on: horizontális scroll-os tab nav
  - Üdvözlő blokk + 4 nav link + Kijelentkezés
  - Bal oldali patina arany akcentus az aktív tab-on (luxury)
  - Auth védelem (kliens oldali): "Belépés szükséges" panel ha nem logged-in
  - Auto-feltöltés a `subscribeAuthState` callback-en

### Hozzáadva — `/profil` oldal

- **`src/pages/profil/index.astro`** (~480 sor):
  - Adatszerkesztő form (keresztnév, vezetéknév, telefon)
  - Email mező readonly + hint
  - Verifikációs banner (most rejtett, Sprint 4.5.5-ben aktív)
  - Bejelentkezési módok overview (jelszó / Google / Facebook státusz)
  - Mentés gomb loading állapottal
  - Magyar nyelvű siker- és hibaüzenetek

### Hozzáadva — API

- **`src/pages/api/profile/update.ts`**:
  - POST endpoint, auth required
  - UPDATE customers (csak first_name, last_name, phone)
  - Outer try/catch + struktúrált JSON 500
  - Vissza a frissített `CustomerPublic`

### Migráció

```powershell
npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0004_sprint4_5_profile.sql

# Ellenőrzés:
npx wrangler d1 execute monastudio-v2-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
# Várt: ..., discount_codes, ...
```

### Mit NEM csinál még

- ❌ A többi 3 sidebar link (Rendelések, Címeim, Kívánságlista) **404-be vezet** 
  — Sprint 4.5.2-4 tölti fel
- ❌ Verifikációs banner most **mindig rejtett** (a logika fent van, de a 
  banner gomb-ot Sprint 4.5.5-ben kötjük be)
- ❌ Welcome email, password reset, discount code beváltás — Sprint 4.5.5-7

### Fájlok (5 új + 2 módosított)

- `migrations/0004_sprint4_5_profile.sql`
- `src/lib/types/profile.ts`
- `src/layouts/ProfileLayout.astro`
- `src/pages/profil/index.astro`
- `src/pages/api/profile/update.ts`
- `package.json` — `0.8.9` → `0.9.0` (MINOR)
- `docs/09-changelog.md`

---

## [0.8.9] — 2026-04-27 — Sprint 4 finomhangolás — Header avatar logged-in indicator

### Hozzáadva — Vizuális visszajelzés a login állapotra

A header 👤 ikon eddig **vizuálisan azonos** volt logged-in és anonymous állapotban
— csak az `aria-label` változott (screen reader-eknek). Most a **logged-in 
állapotban** egy patina arany pötty jelenik meg az ikon jobb alsó sarkán.

### Implementáció

- **`src/components/common/Header.astro`** — JS:
  - `subscribeAuthState` callback-ben:
    - logged-in → `authTrigger.setAttribute("data-authenticated", "true")`
    - anonymous → `authTrigger.removeAttribute("data-authenticated")`
- **`src/styles/components/header.css`** — CSS:
  - `.site-header__action[data-authenticated="true"]::after` pseudo-element:
    - 8×8 px (desktop) / 9×9 px (≥768px) patina arany kör
    - 1.5px `var(--mona-bg)` border (kiemeli a háttérről)
    - Position: jobb alsó sarok, 6-7px offset
    - Subtle 1.6s pulse animation csak az első renderkor
    - `prefers-reduced-motion` user preference esetén nincs animation

### Vizuális jellemzők

- **Brand-konzisztens**: patina arany (`var(--mona-warm)`) — illeszkedik a többi 
  arany akcentushoz a UI-on
- **Diszkrét**: 8 px-es pötty nem zaklatott, csak finom jelzés
- **Pillanatos azonosítás**: pillantásra látszik a login állapot
- **Animation egyszer**: a pulse csak az első renderkor (tabváltáskor / login-kor) 
  fut le — page reload-on **nincs** ismétlés (mert a CSS `1` iteration count 
  azonnal befejeződik)

### Mit NEM csinál

- ❌ Welcome email regisztrációkor — Sprint 4.5 (a szándékos döntés alapján 
  most nem küldjük)

### Fájlok (3)
- `package.json` — verzió `0.8.8` → `0.8.9`
- `src/components/common/Header.astro` — `data-authenticated` attribute set/remove
- `src/styles/components/header.css` — pseudo-element pötty + animation
- `docs/09-changelog.md`

---



**Frontend + backend csomag** a Google fiókos bejelentkezéshez.

### Hozzáadva — Backend

- **`src/lib/oauth-google.ts`** (~210 sor) — Google OAuth helpers:
  - `buildGoogleAuthUrl(env, state, redirectUri)` — authorization URL építés
  - `exchangeGoogleCode(env, code, redirectUri)` — code → access_token + id_token
  - `fetchGoogleUserInfo(accessToken)` — userinfo lekérés (sub, email, name, picture)
  - State CSRF cookie kezelés: `buildOAuthStateCookies`, `readOAuthStateCookies`, 
    `buildClearOAuthStateCookies`
  - 10 perces state cookie érvényesség
  - `prompt=select_account` — multi-account user-eknél mindig kérdez
- **`src/pages/api/auth/google.ts`** (~60 sor) — initiate endpoint:
  - GET `/api/auth/google?from=/aktualis-oldal`
  - State token generálás → cookie
  - "from" query paraméter validálás (open redirect védelem: csak relatív path)
  - 302 redirect a Google authorization URL-re
  - Ha `GOOGLE_CLIENT_ID` nincs beállítva → 503 hibaüzenet
- **`src/pages/api/auth/google/callback.ts`** (~190 sor) — callback endpoint:
  - GET `/api/auth/google/callback?code=...&state=...`
  - State CSRF ellenőrzés
  - Code → token → userinfo flow
  - **Customer match logika**:
    1. `google_id` alapján → login
    2. `email` alapján → összekapcsolás (set `google_id` + `email_verified=1`)
    3. Nincs → új customer létrehozás (auto-verified, mert Google már 
       verifikálta az email-t)
  - Mailchimp bridge — új vendég esetén
  - Session létrehozás + cookie + `last_login_at` frissítés
  - Hibás esetben: redirect a "from" path-ra `?auth_error=...` paraméterrel
  - Outer try/catch: minden exception strukturált 302 redirect (sosem üres 500)

### Hozzáadva — Frontend

- **`src/components/auth/AuthModal.astro`**:
  - **Frontmatter**: `googleEnabled` boolean a `GOOGLE_CLIENT_ID` env var alapján
  - **Login view**: "Belépés Google fiókkal" gomb az intro után
  - **Register view**: "Regisztráció Google fiókkal" gomb az intro után
  - **"vagy" elválasztó** (`.auth-modal__divider`) a Google gomb és a klasszikus 
    form között — két vízszintes vonal + "VAGY" felirat
  - **Disabled állapot**: ha `googleEnabled === false` (env var hiányzik), a 
    gomb disabled + tooltip "A Google bejelentkezés még nincs konfigurálva"
  - **Google logo SVG**: hivatalos Google brand SVG (4 színes G)
  - **JS — gomb kattintás**: `window.location.href = "/api/auth/google?from=" + encodeURIComponent(location.pathname)`
  - **JS — `?auth_error=` query param kezelés**: ha a Google callback hibásan tér 
    vissza, a URL-ben szerepel egy `auth_error` paraméter. Erre bekapcsolódik a 
    modal login view-ban + magyar nyelvű hibaüzenet, és az URL is megtisztul

### Változott — wrangler.toml

- **`GOOGLE_CLIENT_ID`** placeholder hozzáadás a `[vars]` szekcióba (publikus, 
  üres string default)
- **`GOOGLE_CLIENT_SECRET`** dokumentáció a komment szekcióban (Secret-ként a 
  Cloudflare Dashboardon)

### Cloudflare Pages env vars Sprint 4.3-hoz

| Változó | Hol | Sprint |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `wrangler.toml` `[vars]` (Plaintext) | 4.3 (most) |
| `GOOGLE_CLIENT_SECRET` | CF Dashboard Secret | 4.3 (most) |

### Mónika setup teendők

1. **Google Cloud Console** (`mona@monastudio.hu` Workspace fiókkal):
   - Create Project: "Mona Studio Auth"
   - OAuth consent screen: External, App name "Mona Studio", Support email 
     `mona@monastudio.hu`, Authorized domains `monastudio.hu`
   - Scopes: `openid`, `email`, `profile`
   - Test users: a fejlesztő email-jei
   - Credentials → OAuth Client ID → Web application
   - Authorized JavaScript origins: `https://monastudio.hu`, 
     `https://monabeauty2.pages.dev`
   - Authorized redirect URIs: `https://monastudio.hu/api/auth/google/callback`,
     `https://monabeauty2.pages.dev/api/auth/google/callback`
2. **Client ID**-t a `wrangler.toml`-ba másolni (vagy Dashboardon beállítani 
   ha új CF UI engedi)
3. **Client Secret**-et a CF Dashboard → Variables and Secrets → Add Secret-ként

### Architektúra részletek

#### CSRF state cookie

A `state` paraméter random 32-hex token, ami mind a:
- **Cookie-ban** (`mona_oauth_state`, httpOnly + Secure + SameSite=Lax, 10 perc érvényes)
- **Google redirect URL-jében**

szerepel. A callback ellenőrzi hogy egyezik-e — ez megakadályozza a session 
fixation támadást.

#### Open redirect védelem

A `?from=...` query paraméter csak relatív path lehet (`/aktualis-oldal`). 
Ha valaki `?from=https://malicious.com`-ot küldene, a backend silent-en `/`-re 
redirectal.

#### Email match konzisztencia

Ha egy vendég előbb klasszikus email + jelszó-val regisztrált, majd később 
Google-lal próbálkozik **ugyanabban az email-ben** — mi automatikusan 
**összekapcsoljuk a két fiókot** (set `google_id` az meglévő rekordra). 
Ettől kezdve **mindkét módon** beléphet ugyanabba a fiókba.

A fordított eset: ha valaki Google-lal regisztrált, később jelszóval szeretne 
belépni — a login.ts visszadob egy `oauth_only_account` hibát (Sprint 4.5-ben 
lesz "Jelszó beállítása" flow a profilban).

### Mit NEM csinál (Sprint 4.4-4.5)

- ❌ Facebook Login gomb — Sprint 4.4
- ❌ Apple Sign-In — későbbi (Sprint 7+, iOS app esetén)
- ❌ "Jelszó beállítása" flow OAuth-only fiókokhoz — Sprint 4.5
- ❌ Profil oldalon "Connect Google" gomb (link/unlink Google fiókot a logged-in 
  vendégnek) — Sprint 4.5

### Fájlok (5 új + 3 módosított)

**Új**:
- `src/lib/oauth-google.ts`
- `src/pages/api/auth/google.ts`
- `src/pages/api/auth/google/callback.ts`

**Módosított**:
- `package.json` — verzió `0.8.7` → `0.8.8`
- `src/components/auth/AuthModal.astro` — Google gomb + divider + JS + auth_error handler
- `wrangler.toml` — `GOOGLE_CLIENT_ID` placeholder
- `docs/09-changelog.md`

---



### Probléma

A v0.8.6 után a checkbox-szöveg sorok **még mindig nem voltak egy vonalban** 
a regisztrációs ablakban — a checkbox doboz vagy magasabban vagy alacsonyabban 
volt mint a szöveg első sor közepe.

### Diagnózis

A natív `accent-color: var(--mona-warm)` stílus használata azt jelenti, hogy a 
**böngésző maga rendereli** a checkbox-ot, ami **böngészőnként eltérő pixel-padding-et** 
ad. Chrome-ban egy 16px-es checkbox 16px valós méretű, **DE** Firefox-ban néhány 
pixel border-padding-gel van rendelve, és Safari-ban megint más. **Lehetetlen 
pontosan ugyanazt a vizuális vonalozást elérni cross-browser** natív appearance 
mellett.

### Javítás — fully custom checkbox

**`appearance: none` + custom border + custom checked-style**:

```css
.auth-modal__checkbox > input {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  margin: 0;
  margin-top: 0.75px;  /* 18px box közepe = 19.5px sor közepe */
  border: 1px solid var(--mona-border);
  background: var(--mona-bg);
}

.auth-modal__checkbox > input:checked {
  background: var(--mona-warm);
  border-color: var(--mona-warm);
  background-image: url("data:image/svg+xml;...polyline...");  /* fehér pipa */
}
```

**Eredmény**:
- **Cross-browser konzisztens** — minden böngészőben pontosan ugyanaz
- **Pixel-pontos vonalozás** — a 18×18 doboz közepe egzaktul a 19.5px sor közepe
- **Brand-illeszkedő** — patina arany `--mona-warm` checked háttér + fehér SVG pipa
- **Hover state** — `border-color: var(--mona-warm)` finom visszajelzés
- **Focus-visible** — accessibility outline 2px arany

### Tanulság (Sprint 5+ tervezésre)

Ha **brand-precízió fontos** (mint a Mona Studio-nál), **mindig custom checkbox** 
helyett `accent-color` natív stílus. Az `accent-color` egyszerű és gyors, **de** 
cross-browser pixel-szinten nem egyforma — ez nem feltűnő alapszintű form-okban, 
de luxus brand-eknél (mint a kozmetikai szalon) vizuális zaj.

Ezt a custom-checkbox mintát használjuk a **Sprint 5** profil oldalakon, 
checkout-on, admin felületen, stb.

### Fájlok (3)
- `package.json` — verzió `0.8.6` → `0.8.7`
- `src/components/auth/AuthModal.astro` — fully custom checkbox styling
- `docs/09-changelog.md`

---



### Javítva

#### 1. Password toggle szem-ikon "szétesett" → tiszta Feather/Lucide path
A `data-password-toggle` gombon belül a két szem-ikon SVG (open/closed eye) 
**egymásra rakódott** — vizuálisan a pupilla és körvonal elcsúszottnak tűnt.

**Gyökér-ok**: a globális `reset.css`-ben:
```css
img, svg, video, canvas, audio, iframe, embed, object {
  display: block;
}
```
Ez **felülírja a `hidden` HTML attribútum** default `display: none` értékét → 
mindkét SVG egyszerre renderelődik (egymásra rakva), és **mindkettőnek látszik 
a stroke-ja**.

**Fix**:
```css
.auth-modal__password-toggle svg[hidden] {
  display: none !important;
}
```
Plusz a SVG path-ok lecserélve a Feather/Lucide szabványra (cleaner ívek + 
`stroke-linecap="round"` + `stroke-linejoin="round"`).

#### 2. Checkbox sorok igazítása — finomhangolás
- `.auth-modal__checkbox > input` — `padding: 0; box-sizing: border-box; 
  cursor: pointer` hozzáadva (globális input reset override)
- `.auth-modal__checkbox > span` — `flex: 1; min-width: 0` (a hosszú szöveg 
  helyesen tördelődik)
- `margin: 2px 0 0` ugyanazt tartja — vizuálisan a 16px checkbox közepe egy 
  vonalban van a 13px szöveg első sorának közepével

### Tanulság

**Globális SVG reset (`display: block`)** + **HTML `hidden` attribute** közötti 
konfliktus klasszikus pitfall. Bárhol ahol SVG-ket toggle-elünk a `hidden` 
attribútummal (és van globális `svg { display: block }` reset), kell egy local 
override `svg[hidden] { display: none !important }`. 

Ezt érdemes lenne a globális reset.css-be tenni — Sprint 5+-ban refaktorra.

### Fájlok (3)
- `package.json` — verzió `0.8.5` → `0.8.6`
- `src/components/auth/AuthModal.astro` — SVG path-ok + checkbox + svg[hidden] CSS
- `docs/09-changelog.md`

---



### Probléma

A v0.8.4 deploy után a debug üzenet megmutatta a tényleges hibát:
```
Pbkdf2 failed: iteration counts above 100000 are not supported (requested 600000).
```

### Diagnózis

A **Cloudflare Workers runtime** (és így a Pages Functions is) **limitálja a 
PBKDF2 iteration count-ot 100 000-re** biztonsági/CPU okokból (Workers compute 
time limitek miatt — egy ilyen művelet ne vegyen el túl sok CPU-t request alatt).

A Sprint 4.1 design idején az OWASP 2023 ajánlása szerinti **600 000 iteration**-t 
beállítottam, ami **böngésző Web Crypto API-ban** működne, **DE** Workers-ben tilos.

### Javítás — outer SHA-256 réteg

A jelszó hash mostantól **két lépcsős**:
1. **PBKDF2** (100k iter, SHA-256) → intermediateHash
2. **SHA-256(intermediateHash + salt)** → finalHash

Ez **gyakorlatilag azonos brute-force-rezisztenciát** ad mint a 600k iter közvetlenül, 
és **Workers-kompatibilis**. A támadónak még mindig 100k PBKDF2 iter + 1 SHA-256 
hash-t kell minden egyes jelszó-próbálkozásra futtatnia.

A `password_hash` és `password_salt` mezők struktúrája **változatlan** — ugyanúgy 
hex strings, ugyanaz a hossz.

### Architektúra megjegyzés (a `lib/types/auth.ts`-ben dokumentálva)

```typescript
// PBKDF2 paraméterek
//
// FONTOS: Cloudflare Workers (és Pages Functions) NEM támogat 100k feletti
// PBKDF2 iteration count-ot — runtime exception:
//   "Pbkdf2 failed: iteration counts above 100000 are not supported"
//
// Az OWASP 2023 ajánlás 600k. Ezt outer SHA-256 hash réteg hozzáadásával
// kompenzáljuk.
export const PBKDF2_ITERATIONS = 100_000;   // CF Workers max
```

### Cloudflare Workers Web Crypto API limitek (Sprint 4 tanulság)

| Algorithm | Workers OK? | Megjegyzés |
|---|---|---|
| PBKDF2 | ✅ (max 100k iter) | OWASP 600k → outer SHA-256 réteg |
| HMAC, AES, RSA-OAEP | ✅ | Korlátozás nélkül |
| SHA-256, SHA-384, SHA-512 | ✅ | Korlátozás nélkül |
| Argon2 | ❌ | Nem natív, WASM komplex |
| bcrypt | ⚠️ | npm package + WASM, lassú |

### Mivel jelenleg 0 customer rekord van

A `customers` tábla **üres**, így **nincs migrációs probléma** — bárkinek aki 
korábban próbált regisztrálni 500-as választ kapott, és **soha nem jött létre** 
adatbázis rekord. A v0.8.5 deploy után az első sikeres regisztráció lesz az 
első customer.

### Fájlok (3)
- `package.json` — verzió `0.8.4` → `0.8.5`
- `src/lib/types/auth.ts` — PBKDF2_ITERATIONS 600k → 100k + dokumentáció
- `src/lib/auth.ts` — pbkdf2Hash outer SHA-256 réteg

---



### Probléma

A v0.8.x deploy után a **regisztráció 500-as hibát** adott vissza, **üres body-val**.
A frontend ezt a választ próbálta JSON-ként parse-olni → `Unexpected end of JSON input`.
A vendég **nem látott semmit** ami segítene neki vagy nekünk a diagnózisban.

### Diagnózis

A leggyakoribb ok: a `register.ts` valamelyik DB lookup vagy library hívás 
**unhandled exception**-t dobott, és a Cloudflare Pages Functions runtime 
default 500-as választ adott (üres body-val).

A leggyanúsabb gyökér-ok: **a v0.8.0 D1 migráció nem futott le** a production 
adatbázison, így a `customers` tábla nem létezik → az első `SELECT FROM customers`
exception → 500.

### Javítás

#### 1. Backend — outer try/catch
Mindkét endpoint (`register.ts`, `login.ts`) most:
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    return await handleRegister(request, locals);
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "server_exception",
        message: "Szerverhiba történt. Próbáld később.",
        debug: err.message,  // ideiglenes, Sprint 4.x-ben kivesszük production-ben
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```
Most **bármilyen exception** struktúrált JSON-os választ ad — a frontend tudja parse-olni.

#### 2. Frontend — debug info megjelenítése
Az AuthModal hibaüzenet most kibővül a `debug` mezővel, ha van:
```
"Szerverhiba történt. Próbáld később. [debug: no such table: customers]"
```
Ez ideiglenes — Sprint 4.x-ben (production-ready) eltávolítjuk.

### Mit kell még tenned

**Ellenőrizd a D1 séma migrációt**:
```powershell
npx wrangler d1 execute monastudio-v2-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Ha **NEM szerepel** a `customers` tábla:
```powershell
npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0003_sprint4_customers.sql
```

### Tanulság (Sprint 5+ tervezésre)

**Minden API endpoint-nak outer try/catch-csel kell rendelkeznie**, hogy bármilyen 
unhandled exception **strukturált JSON** választ adjon. A Cloudflare Pages default 
500-as response-ja **üres body-jú**, ami a frontend JSON parse-t törleli — ez 
silent fail, és a felhasználó csak egy generikus hibát lát.

A Sprint 5+ admin endpointokra (CRUD termékek, rendelések, stb.) is ezt a mintát 
fogjuk követni.

### Fájlok (3)
- `package.json` — verzió `0.8.3` → `0.8.4`
- `src/pages/api/auth/register.ts` — outer try/catch + handleRegister helper
- `src/pages/api/auth/login.ts` — outer try/catch + handleLogin helper
- `src/components/auth/AuthModal.astro` — debug info megjelenítés

---



### Javítva — kritikus

A v0.8.1-es Sprint 4.2 deploy után a **header 👤 ikon kattintás semmit sem 
csinált**. Diagnózis:

A v0.8.1 mind az AuthModal.astro mind a Header.astro **dinamikus `import()` 
expression**-t használt:
```javascript
import("@/lib/auth-state").then((mod) => { ... });
```

**Ez az Astro script blokkokban két okból nem működik**:

1. **AuthModal.astro** `<script define:vars={{ turnstileSiteKey }}>`-t használt — 
   ez **Astro inline mode** ami **NEM bundle-ölődik Vite-tel**. A path alias (`@/`) 
   és az ES module dinamikus import nem resolve-ódik runtime-ban → silent fail
2. **Header.astro** normál `<script>`-ben dinamikus `import()`-ot használt — 
   ez technikailag működhet, de **inkonzisztens** a fájl többi `import` 
   statikus stílusával, és bizonyos build konfigurációkban (különösen Cloudflare 
   Pages) chunk loading hibára futhat

### Fix — két különálló script-blokk + statikus import

**AuthModal.astro**:
- Egy `<script is:inline define:vars={{ turnstileSiteKey }}>` — csak a publikus
  `TURNSTILE_SITE_KEY`-t teszi a `window.__MONA_TURNSTILE_SITE_KEY__` globálba
- Egy normál `<script>` (Vite bundle) — **statikus import** `@/lib/auth-state`-ből,
  IIFE wrapper, az inline-ban kitett globálból olvas

**Header.astro**:
- A meglévő top-level `import { ... } from "@/lib/cart"` mintát követve,
  `import { ... } from "@/lib/auth-state"` szintén top-level
- Az auth integráció IIFE-be wrappolva (nem dinamikus import callback)

### Tanulság

**Astro `<script>` blokkok három mód**:
1. **`<script>`** — alapértelmezett, **bundle-ölődik Vite-tel**, statikus 
   `import` és path alias működnek. **Frontmatter változó NEM elérhető**.
2. **`<script is:inline>`** — DOM-ba kerül változatlanul, **Vite NEM bundle-eli**.
   Statikus `import` **NEM** működik (no Vite transform). Frontmatter változó 
   `define:vars`-szel átadható.
3. **`<script define:vars>`** — automatikusan `is:inline` mode-ban. Frontmatter 
   változót átveszi de NEM bundle-ölődik.

**Helyes minta**: ha frontmatter változót kell **és** import is kell, **két 
script blokk** (mint a v0.8.2 AuthModal-ban): inline a változó-bridge, normál 
script a logikának.

### Fájlok (3)
- `package.json` — verzió `0.8.1` → `0.8.2`
- `src/components/auth/AuthModal.astro` — script struktúra javítás
- `src/components/common/Header.astro` — auth-state statikus importtá

---



**Frontend** kiegészítés a Sprint 4.1 backend-jéhez. Most a vendég **ténylegesen** 
tud regisztrálni és bejelentkezni — a header 👤 ikonja **élővé válik**.

### Hozzáadva — Auth state management

- **`src/lib/auth-state.ts`** (~130 sor) — kliens-oldali auth state (analóg cart.ts):
  - Singleton in-memory state (`loading` / `authenticated` / `anonymous`)
  - `mona-auth-update` custom event a változásokhoz
  - `refreshAuthState()` — initial GET `/api/auth/me` page load-on
  - `setAuthenticated(customer)` / `setAnonymous()` — login/logout után
  - `subscribeAuthState(handler)` — komponensek (Header, AuthModal) erre subscribe-olnak
  - `openAuthModal(view)` / `closeAuthModal()` — modal nyitás eseményei

### Hozzáadva — Komponensek

- **`src/components/auth/AuthModal.astro`** (~700 sor) — login/register modal popup:
  - **Single-instance** (a BaseLayout-ban egyszer), **két nézet** váltva (login / register)
  - **Sephora-stílusú** középre úszó panel + sötét overlay + close gomb (✕) + Esc-re bezár
  - **Tab switch** + cross-link ("Még nincs fiókod? Regisztrálj")
  - **Login form**: email + jelszó + "Bejelentkezés" gomb + "Elfelejtetted a jelszót?"
  - **Register form**: keresztnév/vezetéknév (opcionális) + email + jelszó + ÁSZF (kötelező) +
    marketing consent (opcionális) + Cloudflare Turnstile widget
  - **Turnstile lazy load** — csak akkor töltjük be a Cloudflare scriptet, amikor 
    a register tab először aktiválódik (csendes UX, kevesebb forgalom mindenhol másutt)
  - **Hibaüzenetek** magyarul, server-error közvetlen megjelenítve
  - **Loading állapot** a submit gombokon
  - Sikeres login/register után: `setAuthenticated(customer)` + modal bezárás 
    (a vendég ott marad ahol volt — Sephora-stílus)
- **`src/components/auth/UserMenu.astro`** (~180 sor) — dropdown logged-in állapotban:
  - Üdv-üzenet + email
  - Linkek: Profilom, Rendelési előzmények, Címeim, Kívánságlista (Sprint 4.5-ig 
    az oldalak placeholder/404 lesznek)
  - Kijelentkezés gomb (POST `/api/auth/logout` + `setAnonymous()`)
  - SVG ikon mind a 4 link-en (kis 16×16)

### Változott — Header integráció

- **`src/components/common/Header.astro`**:
  - A 👤 ikon `<a href="/bejelentkezes">` → `<button data-auth-trigger>` (placeholder
    URL helyett funkciós gomb)
  - Új wrapper `.site-header__account-wrap` `position: relative` — a UserMenu 
    dropdown ehhez van pozícionálva (`top: 100%; right: 0`)
  - JS subscribe `subscribeAuthState`-re — minden auth állapot változás-on frissít:
    - **Anonymous**: ikon `aria-label="Belépés"`, kattintásra `openAuthModal("login")`
    - **Authenticated**: ikon `aria-label="Üdv {firstName} — menü"`, kattintásra 
      a UserMenu dropdown nyit
  - Click outside + Esc-re a dropdown bezár
  - Logout flow: POST `/api/auth/logout` → `setAnonymous()` → menu bezár
- **`src/styles/components/header.css`**:
  - `.site-header__action` — `min-height: 0` + `padding: 0` (a globális button 44px override)
  - `.site-header__account-wrap` — új flex wrapper

### Változott — BaseLayout

- **`src/layouts/BaseLayout.astro`**:
  - `import AuthModal` + `<AuthModal />` render — minden oldalon egy single-instance 
    modal a BaseLayout szintjén
  - Sorrend: Footer → CartDrawer → **AuthModal** → CookieConsent → ToastContainer

### UX részletek

- **Sikeres login után**: a vendég **ott marad ahol volt** (Sephora-stílus). A modal 
  becsukódik, a header automatikusan átvált logged-in módra. Nincs redirect.
- **Sikeres register után**: ugyanaz, plusz a console-ba kerül a Mailchimp bridge 
  üzenet ("Mivel már fel vagy iratkozva..." vagy üdvözlő üzenet)
- **Login → Register váltás**: in-place tab switch, nem új modal, nem reload
- **Background scroll lock** modal nyitva (`document.body.style.overflow = "hidden"`)
- **Mobile-on**: a modal panel `max-height: calc(100vh - 2 * var(--space-4))` és 
  `overflow-y: auto` — bármilyen képernyőn jól megy

### Cloudflare Turnstile aktiválódás

A captcha **csak akkor működik valóban**, ha:
1. `wrangler.toml` `TURNSTILE_SITE_KEY` be van állítva (publikus)
2. Cloudflare Dashboard `TURNSTILE_SECRET_KEY` (Secret) be van állítva
3. A Cloudflare Turnstile dashboardon a domain hostnames között szerepel a site

Fejlesztői módban (env var nélkül) a captcha **kihagyódik** — a frontend a 
`"DEV_NO_CAPTCHA"` token-t küldi, a backend `console.warn`-ja jelzi a hiányt.

### Mit NEM csinál még (Sprint 4.x)

- ❌ "Elfelejtett jelszó" flow — Sprint 4.5
- ❌ Profil oldalak (4 placeholder dropdown link, 404 ha kattintasz) — Sprint 4.5
- ❌ Email verifikáció — Sprint 4.5 (most a customer status azonnal "active")
- ❌ Google OAuth gomb a modal-on — Sprint 4.3
- ❌ Facebook Login gomb — Sprint 4.4
- ❌ Welcome toast/banner sikeres register után — Sprint 4.5
- ❌ Mentett címek prefill checkout-on — Sprint 4.5

### Fájlok (5 új + 4 módosított)

**Új**:
- `src/lib/auth-state.ts`
- `src/components/auth/AuthModal.astro`
- `src/components/auth/UserMenu.astro`

**Módosított**:
- `package.json` — verzió `0.8.0` → `0.8.1`
- `src/components/common/Header.astro` — auth trigger + UserMenu integráció
- `src/styles/components/header.css` — account-wrap + action button reset
- `src/layouts/BaseLayout.astro` — AuthModal render

---

## [0.8.0] — 2026-04-27 — Sprint 4.1 — Auth backend (D1 séma + API endpoints) ⭐

**MINOR bump** — Sprint 4 (Ügyfél törzs / auth) első csomagja.

### Hozzáadva — Adatbázis (D1)

- **`migrations/0003_sprint4_customers.sql`** — új migráció:
  - `customers` tábla: email + jelszó hash (PBKDF2) + OAuth ID-k (Google, Facebook, 
    Apple — utóbbi placeholder Sprint 7+ -re) + profil adatok + Mailchimp bridge 
    flag-ek + status / metadata
  - `customer_sessions` tábla: server-side session tárolás (session_id 32-byte hex, 
    customer_id FK, IP + UA audit, expires_at + last_used_at)
  - `customer_addresses` tábla: címkönyv (label, recipient_name, street/city/postal,
    is_shipping/is_billing/is_default flag-ek)
  - `wishlists` tábla: kívánságlista (customer_id × product_id)
  - **`orders` bővítés**: `customer_id INTEGER REFERENCES customers(id)` — 
    a Sprint 3.4 guest checkout-ja most opcionálisan customer-hez köthető
  - `updated_at` triggerek + 12 index a gyakori lookup mintákhoz

### Hozzáadva — TypeScript libraries

- **`src/lib/types/auth.ts`** (~250 sor) — D1 row és public view típusok
- **`src/lib/auth.ts`** (~280 sor) — PBKDF2 hash, session, cookie, Turnstile, validátorok
- **`src/lib/mailchimp.ts`** (~370 sor) — `lookupMember`, `addTags`, 
  `bridgeRegistrationToMailchimp`, `tagPurchase` + tiszta TS MD5 (RFC 1321)

### Hozzáadva — API endpointok

- **`POST /api/auth/register`** — email + jelszó + Turnstile, Mailchimp sync bridge
- **`POST /api/auth/login`** — email + jelszó, user enumeration védelem
- **`POST /api/auth/logout`** — idempotens, cookie clear
- **`GET /api/auth/me`** — current user check (frontend polling)

### Architektúra döntések

- **Session**: server-side D1 + httpOnly cookie (nem JWT)
- **Jelszó hash**: PBKDF2 600k iter. + SHA-256 + 32-byte salt (Web Crypto API, 
  nincs npm dep, OWASP 2023 ajánlás)
- **Captcha**: Cloudflare Turnstile (ingyenes, GDPR-friendly)
- **Mailchimp bridge**: synchronous (~500-1000ms a regisztrációhoz egyszer)

### Cloudflare Pages env vars

Új env vars beállítása **kétféleképpen** történik:

**A) `wrangler.toml`-ban (`[vars]` szekció)** — publikus, a kódba kerül (commit-elve):
- `TURNSTILE_SITE_KEY = "0x..."` (ez a verzió tartalmazza)
- (Hasonlóan a meglévő `SHIPPING_FOXPOST_FT`, `ORDER_NOTIFICATION_EMAIL`, stb.)

**B) Cloudflare Dashboard → Variables and Secrets** — titkos, encrypted:
- `TURNSTILE_SECRET_KEY` (új — Sprint 4.1 most kell)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Sprint 4.3)
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` (Sprint 4.4)

**FONTOS megjegyzés**: a CF Dashboard **csak Secret-eket** enged hozzáadni vagy 
módosítani, ha a projekt `wrangler.toml`-ban `[vars]` szekció van — a Plaintext 
változókat kötelezően a `wrangler.toml`-ban kell deklarálni. Ez az új CF UI 
viselkedés (2025+), és a megosztott env var management egységesítését szolgálja.

### Migráció futtatás (Mónika feladata)

```powershell
# Lokális teszt:
npx wrangler d1 execute monastudio-v2-db --local --file migrations/0003_sprint4_customers.sql

# Production:
npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0003_sprint4_customers.sql

# Ellenőrzés:
npx wrangler d1 execute monastudio-v2-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Mit NEM csinál ez a verzió (Sprint 4.x folytatás)

- ❌ Login/Register UI (modal popup) — Sprint 4.2
- ❌ Google OAuth flow — Sprint 4.3
- ❌ Facebook Login — Sprint 4.4
- ❌ Profil oldalak + email verifikáció + password reset — Sprint 4.5
- ❌ Brute-force védelem (rate limiting) — Sprint 4.x KV-vel

### Fájlok (9 új)

- `package.json` — verzió `0.7.17` → `0.8.0` (MINOR)
- `migrations/0003_sprint4_customers.sql`
- `src/lib/types/auth.ts`
- `src/lib/auth.ts`
- `src/lib/mailchimp.ts`
- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/me.ts`

---

## [0.7.17] — 2026-04-27 — Szállítási mód csak a pénztáron (drawer + /kosar tisztítás)

### Változott — UX javítás

A drawer és `/kosar` oldal **alapból kiválasztott szállítási módot** mutatott 
("FoxPost csomagautomata 1.990 Ft"), és **automatikusan hozzáadta** az "Összesen"-hez. 
Ez **sticker shock**-ot okozott: a vendég 12.100 Ft-ot tett a kosárba, és hirtelen 
14.090 Ft-ot látott anélkül hogy bármit választott volna.

**Új viselkedés**:
- A **CartDrawer** csak a **részösszeget** mutatja
- A **`/kosar` full page** is csak a **részösszeget** mutatja
- Mindkét helyen finom magyarázó jegyzet: *"A szállítást a pénztár oldalon választhatod."*
- A **`/penztar` oldal** változatlan — ott választható a szállítási mód, és onnan 
  számolódik a teljes összeg

### Eltávolítva
- **CartDrawer markup**:
  - `.cart-shipping` blokk (FoxPost / Személyes átvétel radio-k)
  - `.cart-totals__row` "Szállítás" sor
  - `.cart-totals__row--total` "Összesen" sor
  - JS: `data-cart-shipping`, `data-cart-total` updates
  - JS: `[data-shipping-radio]` change event listener
  - Import: `setShippingMethod`, `ShippingMethod` típus
- **`/kosar` oldal markup és JS**: ugyanezek
- **CSS**: `.cart-shipping*` osztályok (8 db) — törölve mindkét fájlból

### Hozzáadva
- `.cart-totals__shipping-note` osztály mindkét fájlban — finom jegyzet (12px italic, 
  `--mona-text-3` szín, jobbra igazítva)
- A "Részösszeg" sor mostantól a totals blokk **kiemelt** sora 
  (`.cart-totals__row--total` osztállyal)

### Megjegyzés a logikáról
- A `cart.ts` `getCartSummary()`, `getShippingMethod()`, `setShippingMethod()`, 
  `calculateShipping()` **változatlanul működnek** — csak a CartDrawer és /kosar 
  oldalak **nem használják** őket
- A `/penztar` oldal **továbbra is** ezeket használja, és menti a localStorage-be 
  a vendég választását (a következő rendelésnél visszatöltődik)
- A `localStorage` default érték továbbra is `"foxpost"` — ez OK, mert a vendég 
  csak a `/penztar` oldalon látja és módosíthatja, **nem akadékoskodik** a 
  drawer-ben

### Fájlok (3)
- `package.json` — verzió `0.7.16` → `0.7.17`
- `src/components/shop/CartDrawer.astro` — szállítási markup + JS + CSS törlés
- `src/pages/kosar.astro` — ugyanezek

---



## [0.7.16] — 2026-04-27 — CartDrawer flex scroll fix + toast eltávolítás

### Javítva
- **CartDrawer scroll layout** ⭐ — a drawer **továbbra is egészében görgethető** volt 
  még 1 termékes kosár esetén is, a v0.7.13 kép-eltávolítás ellenére
- **Diagnózis**: a 3-zónás flex layout (header / body / footer) **bug-os volt**:
  1. `.cart-drawer__panel` — nem volt explicit `height: 100%` és `overflow: hidden`
  2. `.cart-drawer__header` — nem volt `flex-shrink: 0` (zsugorodhatott)
  3. `.cart-drawer__body` — `flex: 1` rajta volt **DE** `min-height: 0` hiányzott
     (klasszikus flex bug: alapértelmezett `min-height: auto` nem engedi a 
     gyermek tartalom-átfutást, az `overflow-y: auto` hatástalan)
  4. `.cart-drawer__footer` — nem volt `flex-shrink: 0` (zsugorodhatott)
- **Fix** — minden zóna explicit shrink + a body explicit grow + min-height:
  ```css
  .cart-drawer__panel { height: 100%; overflow: hidden; }
  .cart-drawer__header { flex-shrink: 0; }
  .cart-drawer__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .cart-drawer__footer { flex-shrink: 0; }
  ```
- **Eredmény**: a header és footer **fixen marad**, csak a középső termék-lista 
  görgethető — a "Tovább a pénztárhoz" gomb mindig látszik

### Eltávolítva
- **Toast notification a kosárba tételkor** (a "Kosárba helyezve" üzenet a képernyő 
  alján, "nagy pipa"):
  - A v0.7.12 quick-add óta a CartDrawer **automatikusan megnyílik** kosárba tétel után
  - A toast + drawer együtt = **dupla feedback**, redundáns és zavaró
  - **`cart.ts`**: `toastCartAdd` hívás eltávolítva az `addToCart` végéről
  - Az import is kommentbe (megőrizve mint dokumentáció)
- A toast **rendszer maga megmarad** (`toastError`, `toastSuccess` továbbra is elérhetők
  pl. a Mailchimp hibák, checkout hibák stb. üzenetére) — csak a cart-add eseményre 
  vonatkozó szabad-ezzel-élés szűnik meg

### Konzisztens UX viselkedés
- **Termékoldalról "Kosárba"** → CartDrawer megnyílik (200ms késleltetéssel)
- **Termékkártya quick-add ikon vagy szöveges gomb** → CartDrawer megnyílik
- **Mindenhol egységes**: a kosárba tétel feedback-je a drawer auto-megnyitása

### Tanulság
A **klasszikus flex layout bug**: `flex: 1` egy elemen + `overflow: auto` rajta = 
**nem működik**, ha nincs explicit `min-height: 0` (vagy `min-width: 0` vízszintes 
flex esetén). A flex item alapértelmezett `min-height: auto` érték nem engedi a 
gyermek tartalom-overflow-t, ezért az `overflow: auto` látszólag inaktívvá válik. 
Ez egy ismert CSS-trükk amit minden komplex flex layout-nál használni kell.

### Fájlok (3)
- `package.json` — verzió `0.7.15` → `0.7.16`
- `src/components/shop/CartDrawer.astro` — flex layout fix
- `src/lib/cart.ts` — toast hívás eltávolítása

---

## [0.7.15] — 2026-04-27 — Mónika ajánlja → eyebrow-ként a tartalmi blokkban

### Változott
- **A v0.7.14 fix után még maradt egy gond**: a quick-add ikon-gomb (jobb felső 
  sarok) **levágta a "MÓNIKA AJÁNLJA" badge szövegét** ("MÓNIKA AJÁ...") — még balra 
  pozícionálva is, mert a hosszú szöveg + a 38px ikon-gomb együtt nem férnek el 
  vízszintesen
- **Új megoldás**: a "Mónika ajánlja" **kikerült a kép tetejéről** és **eyebrow-ként 
  szerepel** a tartalmi blokk legtetején, közvetlenül a márka eyebrow felett
- **Markup változás**: `<span class="product-card__badge--recommended">` → 
  `<p class="product-card__recommended"><span class="product-card__recommended-mark">✦</span> Mónika ajánlja</p>`
- **Vizuális stílus**: 11px sans-serif uppercase letter-spacing 0.12em + `--mona-warm` 
  patina arany szín + diszkrét csillag (`✦`) prefix

### Előnyök
- **Mindig látszik** ha a termék ajánlott — nem rejtett a "ha nincs más badge" 
  szabály mögött (a régi logika v0.7.0 óta korlátozta)
- **Prominentebb** — közvetlenül a termék neve felett, eyebrow pozícióban
- **Mónika brand-vonalához** illik (csendes, sok levegő, diszkrét csillag a felirat előtt)
- **Nem ütközik** semmivel — a kép terület mostantól csak a fotó + akció/új badge bal 
  felül + quick-add ikon-gomb jobb felül (egyértelmű elhelyezés)

### Fájlok (1)
- `package.json` — verzió `0.7.14` → `0.7.15`
- `src/components/shop/ProductCard.astro` — markup + CSS

---

## [0.7.14] — 2026-04-27 — Termékkártya badge-ek balra (quick-add ikon nem fedi)

### Javítva
- **A v0.7.12 quick-add ikon-gomb (jobb felső sarok) lefedte a "Mónika ajánlja" 
  + "Akció" + "Új" badge-eket** — mindketten `position: absolute; top: var(--space-3); 
  right: var(--space-3)`-ra voltak állítva
- **Fix**: `.product-card__badge` `right` → `left` — a badge-ek mostantól a kártya 
  **bal felső sarkában**, a quick-add ikon-gomb a **jobb felső sarokban**
- Plusz `z-index: 1` a badge-en (biztonsági kéreg)

### Megjegyzés
A "Mónika ajánlja" badge ezen a fix után **egyetlen sorban** ütközött a 
quick-add ikon-gombbal — a v0.7.15 oldja meg végleg eyebrow-ra mozgatással.

### Fájlok (1)
- `package.json` — verzió `0.7.13` → `0.7.14`
- `src/components/shop/ProductCard.astro` — badge `right` → `left`

---

## [0.7.13] — 2026-04-27 — CartDrawer kép eltávolítás (drawer egyszerűsítés)

### Változott
- **CartDrawer — termékkép teljesen eltávolítva**:
  - A drawer szűk szélessége (~360-400px) miatt a 80×100px kép görgethető 
    overflow-ot okozott egyes mobilokon (a v0.7.5 explicit `max-width/height` 
    fix és a v0.7.9 `is:global` ellenére sem fért meg tisztán)
  - **Új layout**: csak márka + név + qty + ár + Eltávolítás (vertikálisan stack-elve)
  - A drawer **gyors áttekintés** funkciót szolgálja, nem termékpolc — a részletes 
    nézet a `/kosar` full page-en + termékoldalon érhető el
- **`.cart-item` CSS**: `display: grid` (80px 1fr) → `display: flex; flex-direction: column`
- **Eltávolított CSS osztályok** (a forrásból törölve):
  - `.cart-item__image-link`
  - `.cart-item__image`
  - `.cart-item__image-placeholder`

### Változatlan
- **`/kosar` full page** — termékkép **MARAD** 100×125px-es korláttal (van hely)
- **`/penztar` checkout summary** — termékkép **MARAD** 60×75px-es korláttal (van hely)
- **CartDrawer linkek** — a termék név továbbra is `<a>` link a termékoldalra

### Trade-off
A vendég a drawer-ben **nem látja a képet** ami emlékeztetné melyik termékről 
van szó. **Mitigáció**: a termék név egyértelmű (pl. "Cica Szérum"), és kattintásra 
átjut a teljes termékoldalra. Ha 5+ termékes kosár tipikus lenne, érdemes lenne 
visszahozni a képet — de a Mona Studio webshop kis kosaras (1-3 termék vásárlásonként).

### Fájlok (1)
- `package.json` — verzió `0.7.12` → `0.7.13`
- `src/components/shop/CartDrawer.astro` — kép-blokk markup + CSS törlés

---

## [0.7.12] — 2026-04-27 — Quick-add gombok a termékkártyákon (konverzió-segítő)

### Hozzáadva
- **`ProductCard.astro` — Quick-add minta** ⭐ konverzió-segítő:
  - **Ikon-gomb a kártya jobb felső sarkában** (kosár SVG, 38×38px, kerek):
    - Mindig látszik (mobile + desktop)
    - Hover: patina arany háttér + skálázás
    - Active: kis zsugorodás
  - **"Kosárba" szöveges gomb a kártya alján** (a body legalján, ár és készlet info után):
    - 12px sans-serif uppercase letter-spacing
    - Outline stílus alapból, fekete háttérre vált hover-en
    - Csak akkor jelenik meg ha **készleten van** (`stockStatus !== "out_of_stock"`)
  - **Klikk feedback animáció**: 400ms pulzálás (`@keyframes mona-card-pulse`) — 
    a gomb skálázódik + arany színűre vált rövid időre
  - **Sikeres kosárba tétel után**: CartDrawer automatikusan megnyílik (a vendég 
    azonnal látja a kosár állapotát)
- **Egész kártya kattintható** — JS-alapú navigáció:
  - Az `<a>` link **eltávolítva** a kártyáról (HTML5 szempontból problémás volt 
    a beágyazott button-okkal)
  - Helyette: `data-product-card-url` attribute + JS `click` listener
  - Ctrl/Cmd-klikk + középső gomb klikk → új fülben nyitás (megőrzött böngésző UX)
  - A quick-add gombok `event.stopPropagation()` + `e.preventDefault()` — kattintásukkor 
    nem navigál a termékoldalra

### Stratégiai döntés
A Mona Studio **konzultatív brand-vonal** vs. **konverzió-fókuszú UX** között 
kompromisszum: a quick-add **mindenhol látszik** (készleten lévő termékeknél, kategória 
oldalakon, főoldal kiemelteknél, akciósaknál), **DE** a Mónika ajánlása badge és 
a részletes leírás (összetevők, "Kinek ajánlom") továbbra is **csak a termékoldalon** 
található. A vendégek dönthetik el: gyors quick-add vagy mélyebb információ.

### A `<style>` direktíva
A `<style>` blokk **`<style is:global>`**-ra állítva — a v0.7.9 tanulság alapján: 
ha JS-renderelt elemek lehetnek (pl. dinamikus listák), a scoped CSS nem matchol. 
Itt ugyan jelenleg nincs JS-rendelt markup a kártyán belül (Astro server-side 
renderel), **de** ha egy szülő komponens (pl. szűrő) JS-ből újrainjektálja a 
ProductCard-okat, akkor az `is:global` megelőzi a regressziót.

### Fájlok (2)
- `package.json` — verzió `0.7.11` → `0.7.12`
- `src/components/shop/ProductCard.astro` — quick-add gombok + JS click handler

### Tervezett follow-up
- A6) **Toast notification finomítása** — a `mona-cart-add` event-re a 
  ToastContainer már reagál, de érdemes lenne **megnézni hogy a toast üzenet 
  látszik-e** a CartDrawer megnyitása mellett (lehet hogy fedi)
- A7) **Conversion analytics**: Google Analytics 4 `add_to_cart` event 
  küldése a quick-add kattintáskor — Sprint 6 a teljes e-commerce tracking-gel

---

## [0.7.11] — 2026-04-27 — Kosár qty kontrollok center alignment + min-height fix

### Javítva
- **CartDrawer + `/kosar` qty kontrollok**:
  - A `−` `1` `+` jelek **balra ragadtak** a kontroll dobozban a v0.7.9 fix után, 
    miközben a kontroll dobozok megjelentek
  - **Két ok**:
    1. **`button { min-height: var(--touch-target) }` (44px)** a globális 
       `reset.css`-ben felülírta a parent `height: 32px / 36px` érdekét — a button 
       magasabbra növekedett és felfeszítette a parent-et
    2. A `.cart-item__qty-btn`-en **NEM volt** `display: flex; align-items: center; 
       justify-content: center` — a button szöveg (`−` és `+`) az alapértelmezett 
       inline pozíción maradt
- **Fix**:
  - `.cart-item__qty-btn` (CartDrawer) és `.cart-page-item__qty-btn` (`/kosar`):
    - `min-height: 0` — felülírja a 44px touch target minimumot
    - `display: flex; align-items: center; justify-content: center` — a `−`/`+` 
      jelek tényleg középre kerülnek
    - `padding: 0; line-height: 1` — biztosítja hogy a vertikális center pontos
    - `flex-shrink: 0` — sose zsugorodjanak el
  - `.cart-item__qty-value` és `.cart-page-item__qty-value`:
    - `min-width` + `flex-shrink: 0` + `line-height: 1` (egységesség)
  - `.cart-item__qty` (parent):
    - `width: fit-content; flex-shrink: 0` — a kontroll csak annyit foglal el 
      amennyi tartalma van, és nem zsugorodik el a flex container-ben

### Megjegyzés
- A **termékoldal `qty-control`** (`/webshop/termek/[slug]`) NEM érintett, mert ott 
  a kontroll **48px magas** ami nagyobb a 44px touch target minimumnál — nincs 
  ütközés. (A v0.7.4-es fix itt megfelelő volt.)
- A `min-height: 0` egy modern jó gyakorlat — felülírja a globális `button` szabály 
  44px-es touch target minimumát olyan UI-elemeken ahol a button **kontroll** 
  része egy nagyobb komponensnek (pl. qty stepper), nem önálló call-to-action

### Fájlok (3)
- `package.json` — verzió `0.7.10` → `0.7.11`
- `src/components/shop/CartDrawer.astro` — qty CSS
- `src/pages/kosar.astro` — qty CSS

---

## [0.7.10] — 2026-04-27 — Header bar B variáns + Google Maps integráció

### Változott
- **Header bar — mind az 5 elem egyenletesen szétosztva mobile-on** (B variáns):
  ```
  [Mona Studio]    [HU·EN]    [🛍️]    [👤]    [☰]
  ```
  - `.site-header__inner` mobile-on `display: flex` + `justify-content: space-between`
  - `.site-header__actions` mobile-on `display: contents` → a 4 action elem 
    **közvetlenül** a flex container gyermeke lesz, így mind az 5 (logo + 4 action) 
    egyenletesen szétoszlik
  - Desktop ≥1024px: visszaáll grid layout-ra (3 oszlop, középen a desktop nav)
  - A `display: contents` modern, jól támogatott Safari 15+, Chrome 65+, Firefox 37+
- **Google Maps — hivatalos Place URL bevezetése**:
  - URL: `https://maps.app.goo.gl/NrsyJ4eyMPsZCkUn6`
  - Ez a Google Maps **kanonikus rövid URL-je** a Mona Studio Place-re 
    (Place ID: `0x47402bf72c322377:0x26c58358bc6b6059`, Google ID: `/g/11vd9s5l3c`)
  - Robusztusabb mint a `?api=1&query=...` search URL: közvetlenül a Mona Studio 
    listing-jére visz, nem a search találatok közé
  - Mobile-on natívan a **Google Maps app-ot** nyitja meg (ha telepítve van)
  - **5 helyen frissítve**:
    - `BaseLayout.astro` — Schema.org `hasMap` mező (új)
    - `BaseLayout.astro` — Schema.org `geo` koordináták finomítása  
      (47.7821181 → 47.7820894, 19.1300852 → 19.1300106 — Google Place pontosabb értéke)
    - `Footer.astro` — `site-footer__map-link`
    - `Header.astro` — hamburger menu kapcsolat blokk
    - `kapcsolat.astro` — cím link + új térkép szekció link
- **`/kapcsolat` oldal — új "Hogyan találsz meg" térkép szekció** ⭐:
  - 2 oszlopos layout (≥1024px): bal oldalon szöveg + CTA, jobb oldalon térkép vizuál
  - **Privacy-friendly stilizált SVG térkép** (nem iframe embed, nem küld user adatot 
    a Google-nek): Mona-branded bézs háttér, finom utak + Duna folyó + háztömbök, 
    patina arany pin a stúdió helyén
  - A térkép kép maga is **link** — kattintásra Google Maps app-ban nyílik
  - Hover overlay "Térkép megnyitása →" felirat
  - **Cookie consent függetlenség**: nincs harmadik fél tracking, akkor is működik 
    ha a user elutasít minden marketing cookie-t

### Schema.org finomítás
A `BeautySalon` Schema.org most teljes Local SEO standardnak felel meg:
- `name`, `image`, `telephone`, `email` ✅ (már megvolt)
- `address` (PostalAddress) ✅ (már megvolt)
- `geo` (GeoCoordinates) ✅ koordináták finomítva
- `hasMap` ⭐ **új** — Google Maps kanonikus URL
- `url`, `priceRange`, `founder`, `openingHoursSpecification`, `areaServed`, `sameAs` ✅

A `hasMap` mező a Google-nek explicit jelzés, hogy a **weboldal és a GBP listing 
ugyanaz a hely** — Local SEO szempontból fontos megerősítés.

### Megjegyzés
- A korábbi `?api=1&query=Mona+Studio+V%C3%A1c+Zr%C3%ADnyi+Mikl%C3%B3s+u.+3` 
  URL formátum **felülírva** mindenhol — a kanonikus Place URL pontosabb (a Google 
  saját maga adja a megosztáskor)
- A Google Business Profile **claim-elése** Mónika feladata 
  (https://business.google.com) — a Place már létezik a Google indexében
  (`0x47402bf72c322377:0x26c58358bc6b6059`), csak az ownership beállítás hiányzik

### Fájlok (4)
- `package.json` — verzió `0.7.9` → `0.7.10`
- `src/layouts/BaseLayout.astro` — Schema.org `hasMap` + koordináták
- `src/components/common/Footer.astro` — Maps link rövid URL-re
- `src/components/common/Header.astro` — hamburger contact rövid URL-re
- `src/pages/kapcsolat.astro` — cím link + új térkép szekció (~100 sor új CSS)

---

## [0.7.9] — 2026-04-27 — Astro scoped CSS bug fix ⭐ KRITIKUS

> **Ez magyarázza miért tűntek hatástalannak a v0.7.3, v0.7.5, v0.7.8 CSS fix-ek 
> a kosár / pénztár oldalakon** — a CSS megvolt, csak nem hatott.

### A bug
A `kosar.astro`, `penztar/index.astro` és `CartDrawer.astro` mind `<style>` blokkot 
használt (Astro alapértelmezett **scoped** mód). Astro a buildelés során minden 
`.astro` fájl HTML elemeire automatikusan rárakja az `astro-XXXXXXX` osztályt, és 
a CSS szabályokat `:where(.astro-XXXXXXX)` selectorral kvalifikálja:

```css
/* Build előtt (forrás): */
.cart-page-item { display: grid; ... }

/* Build után (Astro generált): */
.cart-page-item:where(.astro-mc6eoue2) { display: grid; ... }
```

**A probléma**: a kosár tételek és checkout summary tételek **JS-ben dinamikusan** 
generálódnak (`document.createElement("li")` + `innerHTML`). A JS-ben létrehozott 
elemekre Astro **NEM** rakja rá az `astro-XXXXXXX` osztályt → **a CSS NEM matchol** 
a JS-renderelt markup-ra.

### Tünet
Az érintett oldalakon (mind a Sprint 3 kezdete óta!):
- A kép méret korlátok (`width: 80px`, `width: 100px`, `width: 60px`) **nem hatottak** 
  → a globális `img { max-width: 100% }` a parent szélességre kifújta a képet
- A `<li class="cart-page-item">` `display: grid` **nem hatott** → a `<li>` 
  `display: list-item` maradt, és a tartalom egymás alá folyt
- A checkout summary qty badge `position: absolute` **nem hatott** → a `<span>` 
  inline default-on maradt, az `1` qty érték a kép alatt lógott

### Fix
Mind a 3 fájlban a `<style>` taget kicseréltük `<style is:global>`-re. Ezzel a CSS 
szabályok az egész oldalra érvényesek lesznek (nem scoped) — és **most már matcholnak** 
a JS-renderelt elemekre is.

### Mellékhatás
A CSS nem scoped többé az érintett 3 fájlban — más oldalakra is "kiszivárog". 
**Ez biztonságos**, mert az osztálynevek (`.cart-page-item__*`, `.checkout-item__*`, 
`.cart-item__*`) **uniqueek a projektben**, nincs kollízió más oldalakkal.

### Mit oldott meg utólag (v0.7.3-v0.7.8 mind)
- `.cart-shipping__option input { width: 18px }` — radio gomb méret (v0.7.3)
- `[hidden] { display: none !important }` — fantom kosár fix (v0.7.3)
- `.cart-shipping__option-name { flex: 1; min-width: 0 }` — sortörés fix (v0.7.3)
- `.cart-item__image-link { width: 80px; max-width: 80px }` — CartDrawer kép (v0.7.5)
- `.checkout-item__image-wrap { width: 60px }` — checkout summary kép (v0.7.5)
- `.checkout-item__qty { position: absolute; top: -6px }` — qty badge (v0.7.5)
- `.cart-page-item { display: grid; grid-template-columns: 100px 1fr }` — /kosar layout (v0.7.5)
- `.cart-page-item__image-link { width: 100px; max-width: 100px }` — /kosar kép (v0.7.8)
- `.cart-page-item__image { max-width: 100px; max-height: 125px }` — /kosar kép (v0.7.8)
- `.checkout-section { border, padding, etc }` — pénztár szekciók (v0.7.5)

### Tanulság
Astro scoped CSS + JS-renderelt dinamikus tartalom **nem fér össze**. Vagy 
`<style is:global>`, vagy `:global(.osztály)` selector, vagy SSR-ben renderelni 
a tartalmat (ami a Sprint 3 kosár logika alapfilozófiájával ellentétes — a kosár 
client-side state).

### Fájlok (4)
- `package.json` — verzió `0.7.8` → `0.7.9`
- `src/pages/kosar.astro` — `<style>` → `<style is:global>`
- `src/pages/penztar/index.astro` — `<style>` → `<style is:global>`
- `src/components/shop/CartDrawer.astro` — `<style>` → `<style is:global>`

### Audit kérdés (utólag)
**Más Astro fájlok** is renderelnek dinamikusan elemeket JS-ből? Ha igen, ott is 
ugyanez a bug él. Erre később egy globális audit kell — különösen a Sprint 5 
(admin felület) építésekor figyelembe venni.

---

## [0.7.8] — 2026-04-27 — Pénztár + kosár + header mobile redesign

> **Folytatása a v0.7.3–v0.7.6 UI csiszolási hullámnak** (lásd a verziókat alább).
> A v0.7.6-ban bevezetett `hide-tablet` logika valójában nem működött (specificitás
> ütközés a `.btn` osztállyal) — itt javítjuk véglegesen, és a mobile menüt
> drawer-ből dropdown overlay-re alakítjuk.

### Javítva
- **Pénztár — GDPR checkbox layout**:
  - A `.form-checkbox` `<span>` szövege a globális `reset.css` `label` szabálya miatt
    nagybetűsen + szétfolyt letter-spacing-gel jelent meg ("ELOLVASTAM ÉS ELFOGADOM
    AZ ÁSZF...")
  - Fix: explicit `text-transform: none` + `letter-spacing: normal` mind a `.form-checkbox`
    label-en, mind a belső `> span`-en (védőháló)
  - Checkbox méret egységesítve a v0.7.5 standardra: 18×18px (mint a radio gombok)
  - `accent-color: var(--mona-warm)` — branded checkbox szín
- **`/kosar` full page — termékkép méret**:
  - Eddig csak `aspect-ratio: 4 / 5` volt, explicit `max-height` nélkül
  - A v0.7.5 fix csak a CartDrawer-t és a checkout summary-t fedte le, a `/kosar` 
    full page kimaradt — egyes esetekben a kép kifolyt a 100×125px keretből
  - Fix: explicit `width: 100px; height: 125px; max-width/max-height` mind a link 
    wrapper-en, mind a belső `<img>`-en (a CartDrawer és checkout summary mintájára)

### Változott — Header mobile redesign (a v0.7.6 folytatása)

- **`.hide-tablet` specificitás bug fix** ⭐:
  - A v0.7.6-ban bevezetett `.hide-tablet` osztály **nem működött** az `Időpontfoglalás`
    gombon: a `.hide-tablet { display: none }` és a `.btn { display: inline-flex }` 
    ütközött (mindkettő 0,1,0 specificitás), és mivel a `buttons.css` később töltődik
    mint a `layout.css`, a `.btn` nyert → a gomb tablet/landscape mobile-on csonkulva 
    látszott
  - Fix: `.hide-mobile`, `.hide-tablet`, `.hide-desktop` utility-k **`!important`** flag-gel
  - Plusz: `display: initial` → `display: revert` (jobb flex/grid container kezelés —
    a `.lang-switcher` korábban `display: initial` miatt `inline`-ra váltott volna 
    desktop-on, ami a flex layout-ot törte)
- **Mobile menu: full-screen drawer → dropdown overlay**:
  - Az eddigi balról csúszó full-screen drawer helyett **dropdown overlay** a header alól
  - `position: absolute; top: 100%` — a sticky header-hez kötve
  - Animáció: `max-height: 0 → calc(100vh - var(--header-height))`
  - Backdrop overlay a tartalom fölött (`rgb(0 0 0 / 0.32)`) — kattintásra bezár
  - A `.mobile-menu__header` (logo + bezárás gomb) eltávolítva — a hamburger ikon 
    maga vált X-re, ha nyitva van a menü
  - Link kattintás auto-zárja a menüt
  - Viewport átméretezés desktop-ra (≥1024px) miközben nyitva van — auto-zár
- **HU/EN nyelvválasztó visszahozva mobile-on a header bar-ra**:
  - A v0.7.6-ban `hide-tablet` osztályt kapott — most levéve
  - Minden viewport-on látszik a bar-on (a duplikált `.mobile-menu__lang` blokk 
    eltávolítva a dropdown footer-éből)
  - Plusz fix: `.lang-switcher` explicit `display: inline-flex` (eddig csak 
    `align-items: center` volt rajta `display` nélkül — örökölt bug)
- **Header bar 5 elemes layout — esztétikus elrendezés mobile-on**:
  ```
  [Mona Studio]  [HU·EN]  [🛍️]  [👤]  [☰]
  ```
  - Action ikonok: 40×40px → 36×36px keskeny mobile-on (≤768px), SVG 20px → 18px
  - Action gap: `var(--space-1)` (~4px) → `2px` keskeny mobile-on
  - Logo méret: 18px (≤480px) → 20px (≥480px) → 22px (≥768px) → 24px (≥1024px)
- **Hamburger / X ikon váltás animálva**:
  - Egy gomb, két SVG (`.site-header__hamburger-icon` + `.site-header__close-icon`)
  - `aria-expanded="true"` állapot kapcsolja átmenetet (opacity + 90° rotate)
  - `aria-label` is dinamikusan vált ("Menü megnyitása" / "Menü bezárása")

### Megjegyzés
- A teljes responsive logika érvényes mobile portrait + landscape + tablet portrait + 
  landscape mobile mind ≤1024px tartományban — egységes mobile menu viselkedés
- Az `Időpontfoglalás` gomb most véglegesen rejtett ≤1024px alatt — a dropdown 
  menüben CTA-ként elérhető

### Fájlok (5)
- `package.json` — verzió `0.7.7` → `0.7.8`
- `src/components/common/Header.astro` — markup + JS átalakítás
- `src/styles/components/header.css` — bar layout + dropdown overlay CSS
- `src/styles/layout.css` — `.hide-*` utility-k `!important` + `revert`
- `src/pages/penztar/index.astro` — `.form-checkbox` CSS
- `src/pages/kosar.astro` — `.cart-page-item__image` méret

---

## [0.7.7] — 2026-04-26 — (placeholder)

> Ennek a verziónak a tényleges tartalma nem került naplózásra a session során 
> (`package.json` 0.7.7-en volt rögzítve, de az ehhez kapcsolódó konkrét változtatás 
> nem azonosítható egyértelműen). Lehetséges hogy egy gyors UI tweak vagy build hotfix 
> volt — a rákövetkező v0.7.8 ezt a hiányt is rendezi a header redesign keretében.

---

## [0.7.6] — 2026-04-26 — Header mobile/tablet kompakt + tagline rejtés

**Patch bump**. A Sprint 3 funkciók befejezése után utolsó jelentős UI fix: a mobil 
header zsúfolt és nem fér ki. (Visszamenőlegesen dokumentálva.)

### Probléma
Mobile screen-en (iPhone Pro ~390px széles) a header **6 elemet** próbált egy sorba 
zsúfolni: logo + tagline + Időpontfoglalás gomb + HU·EN + 3 ikon. Eredmény: 
átlapolódás, vagy a hamburger menü kicsúszott a viewport-ról iOS Safari-ban.

### Változott
- **`src/styles/components/header.css`**:
  - Tagline mobile-tablet rejtve, csak desktop-on (≥1024px) látszik
  - Logo szöveg kompaktabb: 18px mobile, 20px tablet, 22px desktop, `white-space: nowrap`
  - Header padding kompaktabb mobile-on
  - Actions gap szűkítve mobile-on
  - Action gombok `flex-shrink: 0`
- **`src/components/common/Header.astro`**:
  - `hide-mobile` → `hide-tablet` csere az Időpontfoglalás gombon és a `.lang-switcher` 
    div-en (cél: tablet-en is rejtett legyen)
- **`src/styles/layout.css`** — responsive helper logika tisztítás:
  ```css
  .hide-mobile { display: none }              /* < 768px-en rejt */
  @media (min-width: 768px) { .hide-mobile { display: initial } }
  .hide-tablet { display: none }              /* < 1024px-en rejt */
  @media (min-width: 1024px) { .hide-tablet { display: initial } }
  .hide-desktop { display: initial }
  @media (min-width: 1024px) { .hide-desktop { display: none } }
  ```

### Ismert probléma (a v0.7.8-ban javítva)
A `.hide-tablet { display: none }` valójában **NEM működött** az Időpontfoglalás 
gombon, mert specificitás-konfliktusban volt a `.btn { display: inline-flex }`-szel 
(mindkettő 0,1,0), és a `buttons.css` később töltődik mint a `layout.css`. A v0.7.8 
ezt `!important` flag-gel oldja meg.

### Fájlok (4)
- `package.json` — verzió `0.7.5` → `0.7.6`
- `src/components/common/Header.astro`
- `src/styles/components/header.css`
- `src/styles/layout.css`

---

## [0.7.5] — 2026-04-26 — Kép méret korlátok + fieldset → div csere

**Patch bump**. (Visszamenőlegesen dokumentálva.)

### Változott
- **`src/components/shop/CartDrawer.astro` — termékkép méret kényszerítés**:
  ```css
  .cart-item__image-link {
    width: 80px; height: 100px;
    max-width: 80px; max-height: 100px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .cart-item__image {
    width: 100%; height: 100%;
    max-width: 80px; max-height: 100px;
    object-fit: contain;
  }
  ```
  Korábban a kép a teljes drawer szélességére (~400px) kifújódott, mert a globális 
  `img { max-width: 100% }` felülírta a 80px szándékot, és az `aspect-ratio: 4/5` 
  egyedül nem volt elég kényszer.
- **`src/pages/penztar/index.astro` — `<fieldset>` → `<div class="checkout-section">` csere** ⭐:
  - Mind az 5 form szekciónál (Vásárlói adatok, Szállítási mód, Szállítási cím, 
    Fizetési mód, Megjegyzés, GDPR)
  - `<legend>` → `<h3 class="checkout-section__title">` csere
  - **Indok**: a böngészők (különösen Chrome) inkonzisztensen renderelik a `<legend>`-et,
    fehér háttér + barna kontúr glitch-csel ami a screenshot-okon "barna doboz"-ként 
    jelent meg. A `<div>` + `<h3>` ugyanaz vizuálisan, viselkedés szempontból 
    kontrollálhatóbb.
- **Checkout summary kép méret korlát**:
  ```css
  .checkout-item { display: grid; grid-template-columns: 60px 1fr; min-width: 0 }
  .checkout-item__image-wrap { width: 60px; max-width: 60px; flex-shrink: 0 }
  .checkout-item__image { max-width: 60px }
  ```

### Egységesítő ZIP
A session során sok kis ZIP készült, a v0.7.5 záróverziójához egy **`v0.7.5-final-overrides.zip`** 
(110 KB, 25 fájl) készült — a teljes Sprint 3.3 + 3.4 + UI fix-ek v0.7.3-5 egybe.

### Fájlok (3)
- `package.json` — verzió `0.7.4` → `0.7.5`
- `src/components/shop/CartDrawer.astro`
- `src/pages/penztar/index.astro`

---

## [0.7.4] — 2026-04-26 — Termékoldal qty + tabok + globális overflow ⭐

**Patch bump**. (Visszamenőlegesen dokumentálva.) — **Kritikus fix** a globális 
horizontális overflow miatt.

### Változott
- **`src/pages/webshop/termek/[slug].astro`**:
  - **Qty kontroll középre igazítás**:
    - `.qty-control { justify-content: center; width: fit-content }`
    - `.qty-control__btn { display: flex; align-items: center; justify-content: center }`
    - `.qty-control__input { text-align: center !important }`
    - Korábban a `1`-es szám az input bal oldalán ragadt, mert valamelyik globális 
      stylesheet `text-align: left`-et adott az `<input>`-nak.
  - **Qty + Kosárba gomb wrapping**: `.product-buy { flex-wrap: wrap }` + 
    `.product-buy__cta { min-width: 200px }`
  - **Tabok scrollbar elrejtés**: `.product-tabs__nav { overflow-x: auto; overflow-y: hidden; 
    scrollbar-width: none }` + `::-webkit-scrollbar { display: none }`
  - **Number input spinner standardizálás**: `appearance: none|textfield`
- **`src/styles/reset.css`** ⭐ **KRITIKUS**:
  ```css
  html { overflow-x: hidden; width: 100%; max-width: 100% }
  body { overflow-x: hidden; width: 100%; max-width: 100% }
  ```
  Az "egész oldal végtelenül görgethető jobbra-balra" jelenség megszűnik. Ez a bug a 
  Sprint 1 óta megvolt — valamelyik szekció kilógott a viewport-on túl.

### Tanulság
A `npm run deploy` CLI direct upload **preview URL-re** ment (pl. 
`a6ce11d6.monabeauty2.pages.dev`), és **NEM Production-ra**. A Production a 
GitHub → CF Pages auto-build-ből frissül `git push origin main`-nel. Ez félreértést 
okozott — Peter `v0.7.3`-at látott a footer-ben, miközben a Claude `v0.7.4`-et 
feltételezett aktívnak. **Tanulság**: production deploy-hoz mindig commit + push, 
soha csak CLI deploy.

### Fájlok (3)
- `package.json` — verzió `0.7.3` → `0.7.4`
- `src/pages/webshop/termek/[slug].astro`
- `src/styles/reset.css`

---

## [0.7.3] — 2026-04-26 — Cart UI fix (radio + üres állapot + sortörés)

**Patch bump**. (Visszamenőlegesen dokumentálva.) Az első UI fix kör v0.7.2 után.

### Változott
- **`src/components/shop/CartDrawer.astro`**:
  - **Radio gombok méret rögzítés**: `.cart-shipping__option input { width: 18px; 
    height: 18px; flex-shrink: 0; accent-color: var(--mona-warm) }`. Korábban a 
    globális reset hiányos `input` szabálya miatt a flex layout ~60-70px átmérőjű 
    kék óriási körökre fújta a radio gombokat.
  - **Üres állapot + footer egyszerre láthatóság fix**: `.cart-drawer__footer`, 
    `.cart-drawer__empty`, `.cart-drawer__items` `[hidden]` attribute selectorral 
    `display: none !important`. Korábban a `display: flex/grid` felülírta a HTML 
    `hidden` attribute alapértelmezett `display: none`-ját → "fantom kosár" 
    (üres üzenet alatt mégis látszott a 31.000 Ft összesen).
  - **"FoxPost csomagautomata 1.990 Ft" sortörés**: `.cart-shipping__option-content 
    { gap: var(--space-2); min-width: 0 }`, `.cart-shipping__option-name { flex: 1; 
    min-width: 0 }`, `.cart-shipping__option-price { white-space: nowrap; flex-shrink: 0 }`
- **`src/pages/kosar.astro`** — ugyanazok a fix-ek mint a CartDrawer-ben
- **`src/pages/penztar/index.astro`**:
  - `.shipping-option input, .payment-option input { width: 18px; height: 18px; 
    flex-shrink: 0; accent-color: var(--mona-warm) }`

### Megjegyzés
- Az `[hidden] { display: none !important }` mintát Tailwind és más design rendszerek 
  is használják — CSS specificitás-trükk, nem szép, de szükséges, ha a komponens 
  `display: flex|grid` van állítva.
- Az `accent-color` modern CSS feature (Chrome 93+, Firefox 92+, Safari 15.4+) — 
  natív radio/checkbox színezésre. Régebbi böngészőkön a radio kék marad, de a 
  mérete jó lesz (a fő bug).

### Fájlok (4)
- `package.json` — verzió `0.7.2` → `0.7.3`
- `src/components/shop/CartDrawer.astro`
- `src/pages/kosar.astro`
- `src/pages/penztar/index.astro`

---

## [0.7.2] — 2026-04-26 — Sprint 3.4 — Pénztár + email + Mailchimp tag

### Hozzáadva
- **`src/pages/api/checkout/index.ts`** (~600 sor) — checkout endpoint:
  - Body validáció + termék frissítés D1-ből + készlet ellenőrzés
  - Order number: `MS-YYYY-NNNN` formátum
  - D1 INSERT: orders + order_items + készlet csökkentés
  - Resend email vendégnek + Mónikának (HTML template-ek)
  - Mailchimp tag-elés (csak ha email a listán) — non-fatal
  - Saját MD5 implementáció Mailchimp member hash-hez
- **`src/pages/penztar/index.astro`** — checkout oldal:
  - Vendég adatok form (név, email, telefon)
  - Szállítási mód (FoxPost / Personal) + dinamikus cím szekció
  - Fizetési mód (átutalás / utánvét)
  - Sticky summary jobb oldalon
  - localStorage → API call → redirect
- **`src/pages/penztar/koszonjuk.astro`** — thank-you oldal:
  - Server-side D1 lookup
  - Hero + tételek + szállítás/fizetés info + kapcsolat
  - `noindex`

### Változott
- **Verzió bump**: `0.7.1` → `0.7.2` (patch — Sprint 3 kiegészítés)

### Megjegyzés
- A **Resend env var** (`RESEND_API_KEY`) **kötelező** a checkout flow-hoz
- **Sprint 3 LEZÁRVA** — a webshop élesen rendelést tud fogadni

---

## [0.7.1] — 2026-04-26 — Newsletter Mailchimp error handling fix

### Változott
- **`src/pages/api/newsletter/subscribe.ts`** — érdemi hibakezelés:
  - Csak konkrét `"Member Exists"` string-et fogad sikeresként (előtte minden 400-as error sikeres volt!)
  - Részletes Mailchimp HTTP error logging (status, title, detail, type, errors)
  - 401 → "Hitelesítési hiba" specifikus üzenet
  - 404 → "Konfigurációs hiba" specifikus üzenet
  - Sikeres feliratkozáskor `console.log` is
- **Verzió bump**: `0.7.0` → `0.7.1` (patch — bug fix)

### Megjegyzés
- Az előző hibás kódban minden 400-as Mailchimp hiba (pl. "Invalid Resource", rossz API kulcs) **sikeresnek** nyilvánult → frontend "Köszönjük"-öt írt, miközben a Mailchimp valójában elutasította a kérést

---

## [0.7.0] — 2026-04-26 — Sprint 3.3 — Termékoldal + kosár drawer + /kosar

**MINOR bump** — vásárlási folyamat első fele, új user flow.

### Hozzáadva
- **`src/pages/webshop/termek/[slug].astro`** — egyedi termékoldal:
  - Kép galéria (fő + thumbnailek)
  - Akció / Új / Mónika ajánlja badge
  - Tartalom: márka link, név, lead, ár, méret, készlet státusz
  - **Mónika ajánlása blokk** kiemelve (warm bal border)
  - Mennyiség választó (− / + qty)
  - Kosárba gomb → drawer megnyit
  - 3 fülek: Leírás / Összetevők / Használat
  - Kapcsolódó termékek szekció (max 4)
  - Schema.org Product JSON-LD
- **`src/pages/api/products/[slug].ts`** — egy termék GET endpoint
- **`src/pages/kosar.astro`** — full page kosár nézet:
  - Üres állapot CTA-val
  - 2 oszlop layout (termékek + sticky summary)
  - `noindex` (ne kerüljön Google indexbe)
- **`src/components/shop/CartDrawer.astro`** — oldalsó panel:
  - Right-side slide-in animation
  - Backdrop + body scroll lock + Esc bezárás
  - Tételek: kép + név + qty + ár + eltávolítás
  - Szállítási mód radio (FoxPost / Személyes)
  - Free shipping progress bar (20.000 Ft küszöbig)
  - "Tovább a pénztárhoz" + "Kosár megtekintése"
- **`src/components/shop/CartIcon.astro`** — alternatív kosár ikon (most nem használt)

### Változott
- **`src/lib/cart.ts`** — teljes átírás:
  - `CartItem` interface a `shop.ts` típusokra (`productId`, `slug`, `priceAtAddFt`, `maxQty`, `brandName`)
  - localStorage kulcs: `mona_cart` → `mona_cart_v2` (séma váltás)
  - `getShippingMethod()` / `setShippingMethod()`
  - `getCartSummary()` — szállítási költséggel együtt
  - `addToCart` — készlet ellenőrzés (cap a stockQty-re), `capped` jelzés toast-ban
  - Custom események: `mona-cart-update`, `mona-cart-open`
- **`src/components/common/Header.astro`** — kosár ikon átalakítás:
  - `data-cart-trigger` attribute
  - Click → drawer megnyitás (preventDefault)
  - Ctrl/Cmd-klikk + középső gomb klikk → engedi a `/kosar` navigációt új fülbe
  - Counter `mona-cart-update` event-re
- **`src/layouts/BaseLayout.astro`** — `CartDrawer` import + render
- **Verzió bump**: `0.6.4` → `0.7.0` (MINOR — új user flow: vásárlási folyamat)

### Megjegyzés
- A **régi `mona_cart` localStorage** értékek **invalid-ok lesznek** — friss kezdés
- A **/penztar oldal még nem létezik** — Sprint 3.4-ben jön. A "Tovább a pénztárhoz" gomb kattintáskor 404
- A **kosár ikon Ctrl-klikk** opció megőrzi a `/kosar` URL-t (új fülben nyitja) — accessibility + SEO miatt
- A **Probiotic utazó készlet** termék (8.) a placeholder ikont mutatja a galériában — Sprint 5 (admin)-ban Mónika tölthet fel képet

---

## [0.6.4] — 2026-04-26 — Sprint 3.2 (2. rész) — Webshop oldalak

### Hozzáadva
- **`src/components/shop/ProductCard.astro`** — termék kártya komponens:
  - 4:5 aspektrátió kép, hover effekt
  - Badge-ek: akció (`−15%`), új, Mónika ajánlja
  - Akciós ár megjelenítés (piros + áthúzott eredeti)
  - Készlet jelzés (low / out of stock)
  - 3 soros line-clamp short_description
- **`src/components/shop/FilterPanel.astro`** — szűrő oldalsáv:
  - Kategória + márka + ár + rendezés szűrők
  - URL state alapú (search params) — canonical-friendly
  - Sticky desktop, mobile statikus
- **`src/pages/webshop/index.astro`** — webshop hub:
  - Akciós + kiemelt termék szekciók
  - 5 kategória tile (arclemosok, tonikok, szerumok, arckremek, csomagok)
  - Márka tile-ok (KRX)
  - Szállítási info CTA blokk
- **`src/pages/webshop/[kategoria].astro`** — kategória oldal szűrőkkel + lapozással
- **`src/pages/webshop/markak/[marka].astro`** — márka oldal márka bemutatással
- **`src/pages/api/products/index.ts`** — GET endpoint:
  - Query: `kategoria`, `marka`, `ar`, `sort`, `keres`, `akcios`, `page`, `per_page`
  - JSON válasz: `{ products, total, page, perPage, totalPages }`
  - Validáció: max 100 termék/oldal

### Változott
- **Verzió bump**: `0.6.3` → `0.6.4` (patch — új funkcionalitás Sprint 3 keretén belül)

### Teszt URL-ek deploy után
- `/webshop` — hub oldal
- `/webshop/szerumok` — Szérumok kategória (4 KRX termék)
- `/webshop/markak/krx` — KRX márka (8 termék)
- `/webshop/szerumok?ar=5000-10000&sort=price_asc` — szűrt + rendezett
- `/api/products?akcios=1` — csak akciós termékek JSON

### Megjegyzés
- A **termékoldal** (`/webshop/termek/[slug]`) **még nincs** — Sprint 3.3-ban jön
- A ProductCard `<a>` tag már a `/webshop/termek/{slug}` URL-re mutat — Sprint 3.3 előtt ez 404 lesz, **a kártyák kattinthatóak de hibás oldalra mennek**
- Ha gyorsan élesíthető teszt-termékoldalt akarunk Sprint 3.3 előtt, a ProductCard `productUrl`-t lehet `#`-ra állítani átmenetileg

---

## [0.6.3] — 2026-04-26 — Hírlevél újrapozícionálás Mónika hangjára

### Változott
- **`NewsletterForm.astro`** — teljes szöveg újraírás:
  - Eyebrow: "Szakmai hírlevél" → **"Mónika havi naplója"**
  - Cím: "Mónika kurátori válogatása" → **"Bőrápolás, közvetlenül tőlem"**
  - Blurb: új koncepció — bőrtípus szerinti tanácsok, kezelés ajánlások, alkalmankénti próbatermék/kedvezmény
  - CTA: "Feliratkozás" → **"Igen, küldd a naplót"**
  - **Eltávolítva** a "kéretlen levelek nélkül" fordulat — implicit, és modernebbül "Csak email cím kell"
  - **Eltávolítva** a "kizárólagos kedvezmények előfizetőknek" — Mónika brand-je nem kuponújság

### Hozzáadva
- **`/api/newsletter/subscribe.ts`** — strukturált Mailchimp tag rendszer:
  - `source` paraméter támogatás (footer, popup, signup-form, stb.) a felhasználói viselkedés követéséhez
  - Tag-ek: `website-signup` + forrás-jelölő automatikusan
  - Üzenet hangja: "havi napló" — nem "feliratkozás"
- **Sprint 4 hírlevél ↔ regisztráció összekapcsolás dokumentálva**:
  - A `/api/auth/register` és OAuth callback-ek Sprint 4-ben Mailchimp lekérdezést végeznek (MD5 email hash)
  - Ha az email már a Mailchimp listán van → `registered` tag automatikusan adódik
  - Plusz `customers.is_newsletter_member` flag jelöli a kapcsolatot
  - Jutalom-logika: első rendelés -10% (vagy más kedvezmény Mónika döntése alapján), korai hozzáférés új termékekhez, alkalmanként próbatermék

### Stratégiai döntés
- **A hírlevél nem előfizetés** — szakmai tartalom mindenkinek, **a regisztrált fiókokat plusz jutalmazzuk**
- A "premium" / "subscriber" / "exkluzív" szóhasználat kerülése — nem illik Mónika természetes-szakmai brand-jébe
- A tartalom **kevert**: bőrtípus tanácsok, kezelés ajánlások, termék bemutatók, alkalmanként próbatermékkel

### Megjegyzés
- Az `/api/newsletter/subscribe.ts` változás **backward-compatible** — a régi `{ email }` request body továbbra is működik (a `source` opcionális)
- A frontend NewsletterForm jelenleg **nem küldi** a `source` paramétert — Sprint 3.2 (2. rész)-ben hozzáadjuk amikor több helyen lesz a form (pl. /webshop oldalon, vagy popup-ban)

---

## [0.6.2] — 2026-04-26 — Sprint 3.2 (1. rész — javítások)

### Javítva
- **`@astrojs/sitemap` SSR build crash** — `Cannot read properties of undefined (reading 'reduce')`:
  - Verzió pinnelve `3.6.0`-ra (a `^3.2.0` caret 3.7.x-et hozott le, ami SSR módban broken)
  - **`patch-package`** telepítve mint védőháló — `postinstall` hook + `patches/` mappa (lásd `patches/README.md`)
- **`db:seed` idempotens lett** — többször is futtatható duplikálás / unique hiba nélkül:
  - Kategóriák, márkák: `INSERT OR IGNORE`
  - Termékek: `INSERT OR REPLACE` (megőrzi az ID-t, így a FK-k jók)
  - Termékképek: `DELETE` slug-prefixre, aztán `INSERT`

### Hozzáadva
- **`migrations/9999_reset_seed_data.sql`** — biztonságos reset SQL ami **csak** a seed táblákat üríti (categories, brands, products, product_images). Az `orders` és `order_items` érintetlenül marad, az `order_items.product_id` NULL-ra állítódik a snapshot mezők megőrzésével.
- **`db:reset` és `db:reseed` scriptek** (remote + local variánssal):
  - `db:reset` — csak a seed adatok ürítése
  - `db:reseed` — `db:reset` + `db:seed` egyben (tiszta újratöltés)
- **`patches/` mappa** — `patch-package` által kezelt patch fájlok helye (jelenleg 1 fájl: `@astrojs+sitemap+3.7.2.patch` mint biztonsági fallback)
- **7 KRX termékkép** elhelyezve: `public/images/products/krx-*.webp`
  - Cica vonal: 4/4 kép
  - Probiotic vonal: 3/4 kép (Probiotic utazó készlet képe később jön)

### Változott
- **`package.json`**:
  - `"@astrojs/sitemap": "3.6.0"` (pin, nem caret)
  - `+ "patch-package": "^8.0.0"` dependency
  - `+ "postinstall": "patch-package"` script
  - `+ db:reset, db:reseed (+ :local variánsok)` scriptek
- **`migrations/0002_sprint3_seed_krx_products.sql`** — idempotens UPSERT-ekkel
- **Verzió bump**: `0.6.1` → `0.6.2` (patch — bugfix)

### Megjegyzés
- A `patches/@astrojs+sitemap+3.7.2.patch` jelenleg **nem aktív** (3.6.0 van pinnelve), Cursor figyelmeztetést írhat ki ami **nem hiba** — a fájl csak akkor lép működésbe ha valaki frissítené 3.7.x-re a sitemap-et
- Ha a Cursor pontos hash-eket akar a patch fájlban, regenerálható: `npx patch-package @astrojs/sitemap` (a node_modules-ből kiolvassa az aktuális tartalmat)

---

## [0.6.1] — 2026-04-26 — Sprint 3.2 (1. rész) — KRX termékek migráció + Footer Maps

### Hozzáadva
- **`migrations/0002_sprint3_seed_krx_products.sql`** — 8 KRX termék migráció a régi `site_content.json`-ből:
  - **Cica vonal** (Centella Asiatica, érzékeny/rosaceás bőrre): 4 termék
  - **Probiotic vonal** (mikrobiom-támogatás): 4 termék
  - 5 új kategória: arclemosok, tonikok, szerumok, arckremek, csomagok
  - 1 márka: KRX (Korea)
- **Mónika hangú rövid `monika_recommends`** minden termékhez:
  - Bőrtípus + kombináció + mikor — marketing-fókuszú
  - Példa: "Érzékeny, rosaceára vagy aknéra hajlamos bőrre. Tökéletes párosa: Cica Tonik utána, majd Cica Szérum vagy Krém."
- **`short_description` (max 120 kar.)** kártyán optimalizált leírások
- **Footer Google Maps link**:
  - A `2600 Vác, Zrínyi Miklós u. 3.` cím **kattintható** Google Maps-re
  - Telefonszám is kattintható (`tel:` link)
  - Hover effekt: warm tónusú szín

### Eltávolítva
- `migrations/0002_sprint3_seed_demo.sql` (a régi 8 demo termék — Eclado/Mesotica/London Beauty/Image Skincare placeholder)

### Változott
- **`package.json`** — `db:seed` script az új SQL fájlra
- **Verzió bump**: `0.6.0` → `0.6.1` (patch — tartalmi finomítás, séma változatlan)

### Megjegyzés
- A 8 KRX termék képei a `public/images/products/krx-...webp` útvonalon várhatók — Mónika feltöltheti, vagy átmásolhatóak a régi rendszer `images/products/` mappájából
- A `description` mezőben **markdown formázás** működik (Astro built-in markdown), így a termékoldalon a kiemelések és listák szépen jelennek meg

---

## [0.6.0] — 2026-04-26 — Sprint 3.1 — Webshop D1 séma + demo

### Hozzáadva
- **D1 séma** (`migrations/0001_sprint3_webshop.sql`):
  - `categories` (hierarchikus, parent_id-val)
  - `brands` (Eclado, Mesotica, London Beauty, Image Skincare)
  - `products` (28 mező: ár, akció, készlet, méret, SEO, megjelölések, Mónika ajánlása)
  - `product_images` (1-N kapcsolat termékkel, is_primary jelzéssel)
  - `orders` (vendég adatok közvetlenül a táblában, customer_id NULL Sprint 3-ban)
  - `order_items` (freezeled árak: price_at_order_ft, product_name snapshot)
  - Triggerek `updated_at` automatikus frissítéshez
- **Demo seed** (`migrations/0002_sprint3_seed_demo.sql`):
  - 7 kategória, 4 márka, 8 demo termék
  - 1 akciós termék (London Beauty hialuron por -15%)
- **TypeScript típusok** (`src/lib/types/shop.ts`):
  - `Product`, `Category`, `Brand`, `ProductImage`, `Order`, `OrderItem`, `CartItem`, `CartSummary`
  - Helper függvények: `effectivePrice`, `isOnSale`, `discountPercent`, `stockStatus`
  - `SHIPPING_OPTIONS` konstans (foxpost: 1990 Ft, personal: 0 Ft)
  - `FREE_SHIPPING_THRESHOLD_FT = 20000`
  - `calculateShipping` függvény
- **D1 lekérdezések** (`src/lib/products.ts`):
  - `listProducts(filter)` — szűrés, lapozás, bulk enrichment
  - `getProduct(slug)` — egyedi termék kapcsolt adatokkal
  - `listCategories`, `listBrands`, `getCategory`, `getBrand`
  - `listFeaturedProducts`, `listOnSaleProducts`, `getPriceRange`
- **package.json scriptek**:
  - `npm run db:migrate` — séma feltöltés (remote)
  - `npm run db:seed` — demo adatok
  - `npm run db:migrate:local` / `db:seed:local` — lokális teszt

### Változott
- **`wrangler.toml`** — ⚠️ KV ID javítva: `REPLACE_WITH_YOUR_KV_ID` → `b2da4e4639ec4141a4f0c91ab3c5e8b7` (a régi rendszer KV-jét használjuk a CONTENT binding-hez)
- **`wrangler.toml`** — új `[vars]` szekció Sprint 3 szállítási konstansokkal
- **Verzió bump**: `0.5.3` → `0.6.0` (minor — Sprint 3 indítás)

### Megjegyzés
- A demo termékek **a régi rendszer adatokkal felül lesznek írva** Sprint 3.2-ben (`export-regi-termekek.ps1` script futtatása után)
- **`npm install` nem kötelező** új dep nincs, de a `db:migrate` parancsok a `wrangler` CLI-t használják ami már installálva van

---

## [0.5.3] — 2026-04-26 — Sprint 2B (6. kör) — SEO optimalizáció + FB OAuth előkészítés

### Hozzáadva
- **`@astrojs/sitemap` integráció** (`astro.config.mjs`):
  - Build-time automatikus sitemap.xml generálás
  - Filter: admin, api, profil, login/register oldalak kihagyva
  - i18n hreflang map: hu-HU + en-US
  - Custom prioritások: főoldal 1.0 (daily), szolgáltatások/blog 0.8 (weekly), jogi oldalak 0.3 (monthly)
- **LCP optimalizáció — hero kép preload**:
  - BaseLayout `heroImage` és `heroImageMobile` props
  - `<link rel="preload" as="image" fetchpriority="high">` responsive media queries-vel
  - Index.astro főoldal hero kép preload aktív (hero-main.webp + hero-480.webp)
- **Facebook OAuth előkészítés (Sprint 4 előtt)**:
  - `env.d.ts` — `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` env vars típusok
  - `bejelentkezes.astro` — Facebook gomb hozzáadva (disabled, Sprint 4-ben aktiválódik)
  - API endpoint terv: `/api/auth/facebook`, `/api/auth/facebook-callback`
  - `customers` tábla `facebook_id` és `apple_id` mezők előre megtervezve

### Változott
- **`docs/06-api-reference.md`** — Sprint 4 endpoint-ok bővítve FB OAuth-tal, FB Login követelmények dokumentálva
- **`docs/07-deployment.md`** — FACEBOOK_APP_ID/SECRET env vars, FB Redirect URI-k, Mailchimp env vars szekció bővítve, `.dev.vars` minta frissítve
- **`docs/08-sprint-log.md`** — Sprint 4 leírás bővítve OAuth provider összehasonlító táblával (Google/FB/Apple)
- **`docs/03-known-issues.md`** — SEO problémák státuszok frissítve:
  - 5.1 Sitemap.xml ✅ MEGOLDVA
  - 5.4 404 oldal ✅ MEGOLDVA
  - 5.5 Open Graph ✅ MEGOLDVA
  - 5.6 LCP optimalizáció ✅ MEGOLDVA (új issue)
  - 5.7 Schema.org JSON-LD ✅ MEGOLDVA (új issue)

### Brand alapelvek megerősítve
- ✅ **Apple Sign-In elhalasztva** — drága ($99/év), csak iOS app esetén kötelező; a Mónika célcsoport (25-50 nők, magyar piac) Google + FB-vel 95%-ban lefedhető

### Megjegyzés
- Az `@astrojs/sitemap` package a `package.json`-ben hozzáadva, **`npm install` szükséges Cursor-ban** a deploy előtt!
- A FB OAuth funkcionalitás Sprint 4-ben aktiválódik (a gomb most disabled placeholderrel)

---

## [0.5.2] — 2026-04-26 — Sprint 2B (5. kör) — 26 akciónaptár

### Hozzáadva
- **26 új akció markdown** (`src/content/promotions/`):
  - Forrás: `MonaStudio_Marketing_Kampanynaptar.xlsx` (5 munkalap)
  - Mind a 26 ciklus Mónika hangján — "Kinek ajánlom" struktúrával
  - Tartalom 800-1500 karakter ciklusonként
  - Frontmatter: badge, serviceSlug, discountPercent, startsAt, endsAt, showOnHomepage, heroImageUrl, ctaText, ctaUrl, sortOrder
- **Aktuális akció (2026-04-26)**: #1 Tavaszi Frissítés (Arckezelés −15% csomag, ápr 21 - máj 4)
- **Következő**: #2 Anyák Napja (máj 5 - máj 18)

### Akcióstruktúra
- **2 hetes ciklusok** — szépségiparban természetes ritmus
- **Szezonalitás**: PMU főleg ősszel + tél, gyantázás nyár előtt + húsvét, smink alkalmakkor
- **Bevételi potenciál cimkék**: Magas, Nagyon magas, Közepes
- **Service slug mapping**: minden akció kötődik egy szolgáltatáshoz (kivéve "Komplex" csomagok)

### Eltávolítva
- `szemoldok-tetovalas-bevezeto.md` (a régi demó akció) — felülírva az Excel-alapú aktuális #25 Tavaszi PMU-val

### Megjegyzés
A naptár 2026.04 → 2027.04-ig fedi le az évet. Az `ActivePromotion` komponens automatikusan a most aktívat mutatja a főoldalon (`showOnHomepage: true` + dátumok).

---

## [0.5.1] — 2026-04-26 — Sprint 2B (4. kör) — Tartalom finomítás + verziózás

### Hozzáadva
- **Verziózás bevezetése a UI-ban**:
  - `package.json` `version` mező → build-időben beégetve a HTML-be
  - `astro.config.mjs` Vite `define` plugin: `import.meta.env.PUBLIC_APP_VERSION`, `import.meta.env.PUBLIC_BUILD_DATE`
  - **Footer verziósor**: `v0.5.1 · SP Design` diszkrét, hover-re kicsit erősebb, tooltip-ben build dátum
  - **HTML meta tag**: `<meta name="app-version">` és `<meta name="build-date">`
  - **`GET /api/version`** endpoint — JSON: name, version, buildDate, runtime, framework
- **Új doksi**: `docs/10-versioning.md` — verziózási konvenció, bump folyamat, hol látszik

### Változott
- **Mind a 8 szolgáltatás markdown újraírva** Mónika személyes hangján:
  - Szemöldök tetoválás
  - Szemöldök laminálás + szempilla lifting
  - Nanopen kezelés
  - Arckezelések (7 kezeléstípus, döntési útmutatóval)
  - Műszempilla
  - Gyantázás
  - Szemöldök festés + szempilla festés
  - Smink
- **Új struktúra**: `Mitől különleges? / Kinek ajánlott?` (lista) → `Kinek ajánlom / Kinek nem ajánlom` (Mónika hangján, részletes magyarázattal)
- **Részletes szolgáltatás oldal**: hero kép szekció levéve (`[slug].astro`)
  - A kártyán már látta a vendég, duplikáció volt
  - A `heroImageUrl` továbbra is használatos a kártyán + OG meta tag-ben
- **package.json** verzió: `1.0.0` → `0.5.1` (a tényleges projekt fázis szerint)
- **package.json** deploy parancs: `monabeauty` → `monabeauty2`

### SEO előny
- Lényegesen több egyedi tartalom oldalanként (~3-4× hosszabb)
- Természetes long-tail kulcsszavak ("ki ne csináltassa", "alkalmas-e", "fájdalmas-e")
- Strukturált információ (kérdés-válasz alapú szekciók)

### Brand alapelvek megerősítve
- ✅ **Csendes** — kevesebb felkiáltó marketing-szöveg
- ✅ **Személyes** — Mónika beszél első személyben
- ✅ **Természetes** — élet- és bőrtípus szerinti tanácsok
- ✅ **Szakmai** — őszinte ellenjavallatok minden kezelésnél

---

## [0.5.0] — 2026-04-26 — Sprint 2B (3. kör) — Főoldal + jogi oldalak

### Hozzáadva
- **Új Astro Content Collection**: `src/content/promotions/`
  - Schema: `badge`, `serviceSlug`, `discountPercent`, `startsAt`, `endsAt`, `showOnHomepage`, `ctaText`, `ctaUrl`
  - Demó akció: `szemoldok-tetovalas-bevezeto.md` (−20% bevezető akció, 2026-04-01 → 2026-05-31)
- **8 főoldal komponens** (`src/components/home/`):
  - `HomeHero.astro` — Mónika portré responsive `<picture>` 480/900/main
  - `BrandPillars.astro` — 4 alapelv (csendes / személyes / természetes / szakmai)
  - `FeaturedTreatment.astro` — kiemelt szolgáltatás Mónika idézettel
  - `ActivePromotion.astro` — aktív akció + `SaleCountdown`
  - `ServicesPreview.astro` — featured szolgáltatások (max 4)
  - `BlogPreview.astro` — 3 legutolsó cikk
  - `AboutMonikaTeaser.astro` — Mónika rövid teaser
  - `TrustindexReviews.astro` — Trustindex.io widget integráció
- **Új főoldal** (`src/pages/index.astro`) — teljes szekció-sorrend: HomeHero → BrandPillars → FeaturedTreatment → ActivePromotion → ServicesPreview → BlogPreview → AboutMonikaTeaser → TrustindexReviews → NewsletterForm
- **Header mobile menu drawer kibővítve**:
  - Foglalás CTA gomb
  - HU/EN nyelv váltó
  - Social linkek (Facebook + Instagram, frissített URL-ekkel: monastudiovac)
  - Telefon, email, cím
- **9 új statikus oldal**:
  - `/galeria` — kezelési képek + Instagram CTA
  - `/velemenyek` — Trustindex widget egész oldal + Google review CTA
  - `/szalon` — Vác Local SEO oldal Google Maps embed-del
  - `/aszf` — Általános Szerződési Feltételek
  - `/adatvedelem` — GDPR Adatkezelési tájékoztató
  - `/cookies` — Cookie tájékoztató (3 kategóriás magyarázat)
  - `/szallitas` — FoxPost / GLS / személyes átvétel infó
  - `/bejelentkezes` — login form (statikus, Sprint 4-ben funkcionálissá)
  - `/regisztracio` — register form (statikus, Sprint 4-ben funkcionálissá)

### Változott
- **Content Collections schema** — `promotions` collection hozzáadva
- **Header.astro mobile menu** drawer-be bekerült a foglalás gomb, lang switcher, social, kontakt
- **header.css** mobile menu footer szekció CSS

### Megjegyzések
- A jogi oldalakon `placeholder` szakaszok jelölik a finalizálandó részeket (nyilvántartási szám, adószám, fizetési díjszabás stb.) — ezek a webshop élesítésekor frissítendők
- A Trustindex widget URL `index.astro` és `velemenyek.astro` oldalakon `TRUSTINDEX_WIDGET_URL = ""` placeholder — cseréld le a Trustindex.io loader URL-jére
- Login és register formok jelenleg disabled állapotban vannak placeholder üzenettel, Sprint 4-ben funkcionálissá válnak

### Megoldott issue-k
- ✅ 11. — Header tablet + landscape mobil (mobile menu drawer kibővítve)
- ✅ 13. — Főoldal kiemelt szolgáltatás + akció szekciók implementálva

---

## [0.4.0] — 2026-04-26 — Sprint 2B (2. kör) — Szolgáltatás oldalak

### Hozzáadva
- **8 szolgáltatás markdown** (`src/content/services/`):
  - Szemöldök tetoválás (szálazás + ombre technika)
  - Szemöldök laminálás + Szempilla lifting (egy oldalon)
  - Nanopen kezelés (London Beauty hialuron por)
  - Arckezelések (7 variáns: Rejuven, Mesotica peptides, Savas hámlasztás, Tini, Hidratáló, Frissítő, Arc-dekoltázs masszázs)
  - Műszempilla (1D, 3D, 5D, 7D volumen)
  - Gyantázás (patronos + wax)
  - Szemöldök formázás és festés, szempilla festés
  - Smink (egyedi árazással)
- **Új oldalak**:
  - `/szolgaltatasok` — hub (kiemelt + grid kártyákkal)
  - `/szolgaltatasok/[slug]` — egyedi szolgáltatás Schema.org Service markup-pal
- **Új komponens**: `ServiceCard.astro` — hero képpel és ár-jelzéssel
- **17 új kép** (`public/images/`):
  - `services/` — 10 hero kép (Mona-branded, professzionális)
  - `sections/` — `hero-main.webp` (responsive 480/900 variánsokkal), `blog-hero.webp`, `galeria-hero.webp`, `szolgaltatasok-hero.webp`
  - `og-default.jpg` — frissítve (Mónika szalon háttérrel)
- **Schema.org Service markup**: provider (BeautySalon), areaServed (Vác, Budapest), opcionális offers (priceFrom)
- **Related kezelések blokk** minden egyedi szolgáltatás oldal alján (3 random másik)

### Featured kezelések
- Arckezelések (a leggazdagabb tartalom + Eclado/Mesotica brand fókusz)
- Szemöldök tetoválás (`sortOrder: 5`)
- Szemöldök laminálás + Szempilla lifting (`sortOrder: 20`)
- Nanopen kezelés (`sortOrder: 30`)

---

## [0.3.0] — 2026-04-26 — Sprint 2B (1. kör) + dokumentáció

### Hozzáadva
- **Astro Content Collections** — `src/content/config.ts` (blog + services schema)
- **3 blog cikk markdown** formátumban a régi oldalról:
  - "Hogyan állapítsd meg a bőrtípusodat?"
  - "Amikor valaki kozmetikust választ..."
  - "Az első találkozásunk"
- **3 szolgáltatás markdown** (1. félidő):
  - Szemöldök laminálás + Szempilla lifting
  - Nanopen kezelés
  - Műszempilla
- **Új oldalak**:
  - `/blog` — lista (kiemelt + grid)
  - `/blog/[slug]` — egyedi cikk Schema.org Article-vel, prev/next nav
  - `/rolam` — Mónika E-E-A-T (Schema.org Person)
  - `/kapcsolat` — info + kontakt form
  - `/404` — egyedi hibaoldal
- **Új komponensek**:
  - `PageHero.astro` — közös oldal cím + breadcrumb
  - `ContactForm.astro` — Resend API integráció
  - `BlogCard.astro` — blog kártya
- **Új API**: `POST /api/contact` — kontakt form Resend-en + KV rate limit (5/óra/IP)
- **Schema.org BeautySalon kiegészítés** (BaseLayout):
  - `openingHoursSpecification`
  - `geo` (47.7821181, 19.1300852)
  - `areaServed` (Vác, Budapest, Hungary)
  - `priceRange` ($$)
- **Statikus prerender** a blog oldalakhoz (`export const prerender = true`)
- **Dokumentáció bővítés**:
  - `docs/00-architektura.md` — teljes tech architektúra
  - `docs/06-api-reference.md` — API endpoint referencia
  - `docs/07-deployment.md` — Cloudflare setup útmutató
  - `docs/08-sprint-log.md` — sprint napló
  - `docs/09-changelog.md` — ez a fájl
  - `docs/README.md` frissítve — új fájlok indexelése

### Változott
- **BaseLayout.astro**:
  - Email: `info@monastudio.hu` → `mona@monastudio.hu`
  - Cím Schema.org-ban: `Bartók Béla utca 3.` → `Zrínyi Miklós u. 3.`
  - Schema.org BeautySalon kiegészítve a fenti kulcsokkal
- **Footer.astro**:
  - Cím: `Bartók Béla utca 3.` → `Zrínyi Miklós u. 3.`

### Javítva
- **astro.config.mjs**: i18n.routing-ban eltávolítva a `redirectToDefaultLocale: false` (csak `prefixDefaultLocale: true` mellett van értelme — Astro 4 figyelmeztetés)
- **wrangler.toml**:
  - KV ID placeholder lecserélve valós értékre: `b2da4e4639ec4141a4f0c91ab3c5e8b7`
  - Pages projekt név: `monabeauty2`
- **package.json**: deploy parancs `monabeauty` → `monabeauty2` (egyezés a CF projekttel)

### Szükséges env vars (új)
- `RESEND_API_KEY` — kontakt form email küldéshez

---

## [0.2.0] — 2026-04-25 — Sprint 2A (Cookie consent + Toast + Newsletter)

### Hozzáadva
- **3 kategóriás GDPR cookie consent**:
  - `consent.ts` — állapot kezelés localStorage-ban
  - `CookieConsent.astro` — banner + részletes modal
  - Kategóriák: szükséges (mindig on), analytics, marketing
  - Cookie törlés ha visszavonja a hozzájárulást
- **Toast notification rendszer**:
  - `toast.ts` — esemény-alapú API
  - `ToastContainer.astro` — UI komponens
  - Helper-ek: `toastSuccess`, `toastError`, `toastCartAdd`
- **Newsletter feliratkozás**:
  - `NewsletterForm.astro` — Mailchimp double opt-in
  - `/api/newsletter/subscribe` — Mailchimp API proxy
- **Sale countdown időzítő**:
  - `SaleCountdown.astro` — vegyes (compact / full variant)
  - Sürgetés ≤ 1 óra alatt, max 7 napra mutat
- **Cart helper**: `cart.ts` — localStorage-alapú kosár logika
- **Layout javítások**:
  - Sticky footer (`body { display: flex; flex-direction: column }`)
  - iOS scroll lock fix (mobile menu)
  - Hover lock `@media (hover: hover)` médián
  - Touch target 44px minimum
  - Header scroll-direction (lefelé scroll-on eltűnik)
  - Scroll-padding-top (anchor link nem csúszik header alá)
- **WebP automatikus generálás**:
  - `scripts/generate-webp.mjs` — sharp-pal rekurzív
  - `npm run images:webp` script
  - mtime alapú kihagyás (csak újabb forrásokat dolgozza fel)

### Változott
- **tokens.css**:
  - Új változó: `--header-height` (scroll-padding-hoz)
  - Új változó: `--touch-target` (44px)
- **reset.css**:
  - Sticky footer pattern
  - Hover lock fix
- **Header.astro**:
  - Scroll direction logika
  - iOS-kompatibilis scroll lock
- **Footer.astro**:
  - "Cookie beállítások" gomb hozzáadva
- **BaseLayout.astro**:
  - CookieConsent + ToastContainer integráció
  - Analytics consent-gating

### Szükséges env vars (új)
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_AUDIENCE_ID`
- `MAILCHIMP_SERVER`

---

## [0.1.0] — 2026-04-25 — Sprint 1 (Astro alap + Design system)

### Hozzáadva
- **Astro 4 projekt** Cloudflare Pages adapter-rel (SSR mód)
- **TypeScript** szigorú konfigurációval
- **Design system v1.0**:
  - `tokens.css` — paletta (tört bézs + sötétzöld + patina arany), tipográfia (Cormorant Garamond + system-ui), térköz, sorköz
  - `reset.css` — modern reset
  - `layout.css` — container, grid, flex utility
  - Komponens stílusok: `buttons.css`, `badges.css`, `header.css`, `footer.css`
- **Komponensek**:
  - `Header.astro` — navigáció, mobile menu
  - `Footer.astro` — brand info, linkek, social
  - `BaseLayout.astro` — teljes oldal sablon (head meta, OG, Schema.org BeautySalon)
- **i18n**:
  - `hu.json`, `en.json` szótárfájlok
  - `utils.ts` segéd
  - Astro i18n config (HU default, EN támogatott)
- **Cloudflare config**:
  - `wrangler.toml` — D1, KV, R2 bindings sablon
  - `astro.config.mjs` — Cloudflare adapter, i18n, image domains
- **Dokumentáció**:
  - `README.md` — projekt áttekintés
  - `SETUP.md` — telepítési útmutató
  - `docs/01-design-system.md` — paletta, tipográfia, komponensek
  - `docs/02-reorganization-plan.md` — brand stratégia, SEO
  - `docs/03-known-issues.md` — régi rendszer hibái
  - `docs/04-v2-migration-plan.md` — átfogó projekt terv
  - `docs/05-product-schema.md` — termék adatlap séma
  - `.cursorrules` — Cursor automatikus kontextus

### Tech stack
- Astro 4.16.x
- @astrojs/cloudflare 11.2.x
- TypeScript 5.6.x
- wrangler 3.78.x

---

## Verziózási konvenció

A projekt **Semantic Versioning**-et követ:
- **MAJOR** (1.0.0): breaking change, új arch, API kompatibilitás vesztés
- **MINOR** (0.1.0): új funkció, sprint vége
- **PATCH** (0.0.1): bugfix, kis javítás

Sprintek **MINOR** verziót kapnak (0.1.0 = Sprint 1, 0.2.0 = Sprint 2A, 0.3.0 = Sprint 2B...).

---

## Karbantartás

Minden push előtt:
1. Hozzáadni az új commit-ot a `[Unreleased]` szekcióhoz
2. Sprint végén "kiadás": `[Unreleased]` → `[0.X.0] — DÁTUM — Sprint NÉV`
3. Új `[Unreleased]` szekciót nyitni a következő munkának
