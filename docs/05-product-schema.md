# Mona Studio — Készletkezelő + Webshop modul

## TELJES TERV DOKUMENTUM

---

## 1. Mit építünk és miért

A Mona Studio webshopja jelenleg **statikus HTML kártyákból** áll. A cél egy **dinamikus webshop rendszer**, amely:

- Adatbázis-vezérelt termékeket jelenít meg (D1)
- SEO-barát (Worker SSR, gyors betöltés)
- Készletet kezel (rendeléskor csökken, számla feltöltéskor nő)
- Excel/PDF/AI bemenetet támogat tömeges frissítéshez
- Google Merchant Center kompatibilis (minden mező megvan)
- Mónika admin felületen kezeli (R2 képfeltöltés)
- Akciókat, hűségpontokat, kívánságlistát támogat (későbbi aktiválás)

---

## 2. Mire jött rá a tervezés során — kritikus döntések

### 2.1 SSR (Server-Side Rendering) Worker
A webshop oldalakat egy Cloudflare Worker rendereli D1-ből, **nem JS fetch-csel**. Ez azért fontos:
- Google bot azonnal látja a tartalmat (SEO)
- PageSpeed score nem romlik
- Nincs "üres oldal" vagy skeleton loader
- Cloudflare CDN cache-eli (5 perc TTL)

### 2.2 R2 + custom domain képtárolásra
- Bucket: `mona-products` ✓ (létrehozva)
- Custom domain: `images.monastudio.hu` (még nincs csatolva)
- Pages binding: `PRODUCT_IMAGES` (még nincs)
- 10GB ingyenes — bőven elég

### 2.3 SEO-barát URL-ek
```
/webshop                          → összes termék
/webshop/arcapolas                → kategória oldal
/webshop/arcapolas/szerum         → kategória + típus
/webshop/marka/krx-aesthetics     → márka oldal
/termek/cica-tonik                → egyedi termékoldal (slug alapján)
/webshop?skin=dry&concern=aging   → szűrt nézet
```

### 2.4 Variánsok és hűségprogram előkészítve, de nem aktív
A séma támogatja, az UI nem mutatja indulásnál — később flag-gel bekapcsolható.

---

## 3. Adatbázis séma (D1)

### 3.1 `products` tábla — a fő termék tábla

**Azonosítás:**
- `id`, `sku` (UNIQUE), `slug` (UNIQUE)
- `gtin` (Merchant), `mpn`
- `barcode_image` (R2 URL nyomtatható vonalkódhoz)

**Megjelenítés (HU + EN):**
- `name_hu`, `name_en`
- `description_hu`, `description_en`
- `short_description_hu`, `short_description_en`
- `category_id` (FK), `google_category` (Merchant)
- `product_type`, `collection`, `series_position`

**Márka:**
- `brand` (Merchant)
- `manufacturer`, `country_of_origin`

**Árazás:**
- `purchase_price_huf`, `price_huf`
- `sale_price_huf`, `sale_price_effective_date`
- `tax_rate` (HU áfa), `currency` default 'HUF'
- `margin_pct` (számított), `markup_pct` (számított)
- `discount_pct` (számított), `loyalty_points` (vásárláskor kapott pont)

**Készlet:**
- `stock`, `stock_reserved`, `stock_available` (számított)
- `low_stock_threshold` (default 3)
- `reorder_point` (AI ajánlhat)
- `availability` (Merchant)
- `warehouse_location` (pl. "Polc-A2")
- `expiry_date`, `lot_number`

**Fizikai:**
- `weight_g` (Merchant)
- `length_mm`, `width_mm`, `height_mm`
- `volume_ml`, `package_quantity`

**Állapot:**
- `condition` default 'new' (Merchant)
- `is_active` (webshopban látszik-e)
- `is_featured` (manuális kiemelés)
- `sales_count`, `view_count`
- `is_bestseller` (számított: top 10%)

**Képek (R2):**
- `image_url` (főkép, Merchant `image_link`)
- `additional_images` (JSON tömb, max 10)

**SEO + Marketing:**
- `meta_title`, `meta_description`
- `tags` (JSON tömb)
- `usage_instructions_hu`, `usage_instructions_en`

**Mona-specifikus:**
- `mona_recommendation_hu`, `mona_recommendation_en`
- `is_mona_recommended` (flag)
- `recommended_after_treatment` (Setmore kezelés FK tömb)
- `professional_use_only`

**Szépségápolás-specifikus:**
- `product_type_beauty` (szérum/krém/maszk/tonik/...)
- `skin_type` (JSON tömb: normal/dry/oily/combination/sensitive/mature)
- `skin_concerns` (JSON tömb: aging/acne/pigmentation/redness/dehydration)
- `usage_time` (morning/evening/both/weekly)
- `usage_step` (1-5: tisztítás/tonik/szérum/krém/fényvédő)
- `ingredients_inci` (TEXT, INCI lista)
- `key_ingredients` (JSON tömb kiemelt hatóanyagokhoz)
- `ph_value` (DECIMAL)
- `is_vegan`, `is_cruelty_free`, `is_fragrance_free`
- `is_hypoallergenic`, `is_dermatologist_tested`
- `pregnancy_safe`
- `certifications` (JSON tömb: EcoCert/COSMOS/Leaping Bunny)
- `awards` (JSON tömb)

**Kapcsolódó termékek:**
- `related_products` (SKU JSON tömb — "Ezt is megvették")
- `complementary_products` (SKU JSON tömb — "Ezzel együtt használd")
- `bundle_id` (FK)
- `replacement_for` (SKU JSON tömb)

**Akciók:**
- `promotion_id` (FK), `promotion_label`

**Auditálás:**
- `created_at`, `updated_at`
- `created_by`, `updated_by` (email)
- `last_sync_merchant` (Merchant feed exportkor)

---

### 3.2 `product_categories`

```
id, name_hu, name_en, slug, description, 
icon_emoji, image_url, parent_id, sort_order, is_active
```

Hierarchikus (parent_id-vel), ikon emoji a UI-hoz.

---

### 3.3 `product_variants` (előkészítés, indulásnál nem aktív)

```
id, product_id, sku, name,
price_huf, sale_price_huf, stock,
attributes (JSON: méret, szín),
image_url, is_active
```

---

### 3.4 `stock_movements` (készletmozgás napló)

```
id, product_id, type, quantity, reason,
order_id, source, document_url,
unit_cost, total_cost,
created_at, created_by, note
```

**Típusok:** purchase / sale / return / adjustment / damage / expired / transfer

---

### 3.5 `promotions`

```
id, name, type, value, 
start_date, end_date, is_active, 
banner_image, applicable_categories (JSON)
```

---

### 3.6 `bundles`

```
id, name, description, items_json,
bundle_price, regular_price, savings_pct,
image_url, is_active
```

---

### 3.7 Hűségprogram (előkészítés)

**`loyalty_accounts`:**
```
id, customer_id, points_balance, tier,
total_spent, joined_at
```

**`loyalty_transactions`:**
```
id, account_id, order_id, points_change,
reason (earn/redeem/expire), created_at
```

**Tier logika:**
- Bronze (0-50.000 Ft) → 1× pont
- Silver (50-200K) → 1.2×
- Gold (200K+) → 1.5× + kizárólagos akciók

---

### 3.8 Kuponok

**`discount_codes`:**
```
id, code, type (percent/fixed/free_shipping),
value, min_order, max_uses, used_count,
valid_from, valid_until,
applicable_categories, is_active
```

**`discount_usage`:**
```
id, code_id, customer_id, order_id, used_at
```

---

### 3.9 Wishlist

```
id, customer_id, product_id, added_at
```

Bejelentkezés nélkül `localStorage`, bejelentkezéskor sync.

---

## 4. Backend végpontok (Cloudflare Functions)

### 4.1 Publikus
- `GET /api/products` — termékek listázás (szűrőkkel, lapozással)
- `GET /api/products/:slug` — egyedi termék
- `GET /api/products/featured` — kiemelt termékek (főoldalra)
- `GET /api/categories` — kategóriák fa

### 4.2 Webshop SSR
- `GET /webshop` — összes termék HTML render
- `GET /webshop/:category` — kategória oldal
- `GET /webshop/:category/:type` — kategória + típus
- `GET /webshop/marka/:brand` — márka oldal
- `GET /termek/:slug` — egyedi termék HTML render

### 4.3 Admin (Google session védett)
- `GET /api/admin/products` — admin lista
- `POST /api/admin/products` — új termék
- `PUT /api/admin/products/:id` — módosítás
- `DELETE /api/admin/products/:id` — törlés (soft delete: is_active=0)
- `POST /api/admin/products/upload-image` — R2 képfeltöltés
- `POST /api/admin/products/import` — Excel/CSV import
- `POST /api/admin/products/import-ai` — PDF/kép AI elemzés
- `GET /api/admin/products/export-merchant` — Merchant feed XML

### 4.4 Készletmozgás
- `POST /api/admin/stock/adjust` — manuális korrekció
- `GET /api/admin/stock/movements` — napló lekérdezés
- `GET /api/admin/stock/low` — alacsony készlet riasztás

### 4.5 Akció / kupon (előkészítés)
- `POST /api/discount/validate` — kuponkód ellenőrzés kosár oldalon

---

## 5. Frontend oldalak

### 5.1 Webshop oldal (`/webshop`)
**SSR Worker rendereli.** Tartalmazza:
- Hero szekció (cím, breadcrumb)
- Bal oldali szűrő (kategória, ár, márka, bőrtípus, hatóanyag, tulajdonságok, rendezés)
- Termék grid (kártyákkal)
- Lapozás
- Mobile: bottom-sheet szűrő gomb

### 5.2 Egyedi termékoldal (`/termek/:slug`)
**SSR Worker rendereli.** Tartalmazza:
- Breadcrumb
- Kép galéria (főkép + thumbnail-ek + lightbox)
- Ár + akciós ár + spórolás üzenet
- Készlet jelzés
- Kosárba gomb + mennyiség
- Wishlist 🤍 ikon
- Mónika ajánlása doboz
- Tulajdonság badge-ek (vegán, cruelty-free stb.)
- Kiemelt hatóanyagok
- Használati útmutató
- Részletes leírás (tab-okkal)
- Sorozat további termékei (pl. Cica rutin)
- "Ezzel együtt használd" — kapcsolódó termékek
- JSON-LD strukturált adat (Schema.org Product)

### 5.3 Admin termékkezelő (`/admin-termek.html`)
- Termék lista (kereshető, szűrhető)
- Új termék gomb
- Tömeges import (Excel/PDF/AI)
- Merchant feed export gomb
- Egy termék szerkesztő nézet (tab-okra bontva):
  - Általános (név, leírás, ár, készlet)
  - Képek (R2 drag & drop feltöltés)
  - SEO (meta mezők)
  - Készlet & raktár
  - Hatóanyagok & tulajdonságok
  - Kapcsolódó termékek
  - Akciók
- Készletmozgás tab (történeti napló)

### 5.4 Kosár oldal (`/kosar.html`)
- Kosár tartalma
- Kuponkód mező
- Hűségpont felhasználás
- Szállítási opciók (FoxPost APM/HD)
- Tovább a pénztárhoz

### 5.5 Pénztár (`/penztar.html` — már részben kész)
- Címek (címkönyvből)
- Fizetési mód
- Áttekintés
- Megrendelés gomb

### 5.6 Profil oldal — wishlist tab (már megvan a profil)
- Wishlist tab hozzáadása

---

## 6. Tömeges frissítés — Excel + AI

### 6.1 Excel template
Letölthető `.xlsx` minden mezővel, `Required` és `Optional` jelöléssel. Kötelező mezők:
- `sku`, `name_hu`, `category`, `price_huf`, `stock`

### 6.2 AI bemenet (PDF beszállítói számla)
1. Mónika feltölt egy PDF-t
2. Anthropic Vision API kiolvassa a táblázatot
3. Sorokat párosít meglévő SKU-val
4. Hiányzó mezőket javasol (Google kategória, márka)
5. Preview admin UI: "Ezeket a változásokat fogom alkalmazni"
6. Mónika jóváhagy → INSERT/UPDATE + stock_movement

### 6.3 Készlet csökkentés rendeléskor
A meglévő `order.js`-be beépül:
```
1. Rendelés validálás
2. FOR EACH item: stock -= qty, stock_movement INSERT
3. FoxPost csomag létrehozás
4. Ha bármi hiba: rollback (D1 transaction)
```

---

## 7. Indulási és későbbi flag-ek

| Flag | Indulás | Aktiválás |
|---|---|---|
| Variánsok | Off | Amikor az első variáns termék jön |
| Hűségpont | Off | 50+ rendelés után |
| Vélemények | Off | 6 hónap múlva, ha 100+ ügyfél |
| Wishlist | On | Indulástól |
| Akciók | On | Indulástól |
| Kuponok | On | Welcome kuponnal indul |

---

## 8. Mire NINCS szükség (és miért nem)

- **Live chat widget** — nincs mögötte ember, zavaró
- **Vélemény rendszer indulásnál** — üres rosszabb mint nem lenni
- **Variáns kezelés UI** — most minden termék 1 variáns, később aktiválható
- **Saját értékelési rendszer** — Google Merchant Reviews jobb
- **Multi-currency** — csak HUF kell

---

## 9. Mit nem hagytunk ki — biztonsági / jogi szempontok

- **GDPR**: készlet/rendelés adatok már védve a meglévő privacy policyval
- **EU kozmetikai jogszabály**: INCI lista a `ingredients_inci` mezőben kötelező — séma támogatja
- **Lejárati dátum**: `expiry_date` mező — kozmetikumoknál kötelező, séma támogatja
- **Áfa**: `tax_rate` mező + bruttó/nettó ár — magyar számlázáshoz szükséges
- **Származási ország**: `country_of_origin` — EU vámkezeléshez

---

## 10. Mire van még szükség (te döntsd el)

Az alábbiakat **érdemes megfontolni** a séma véglegesítése előtt:

### A) Számlázás
A jelenlegi rendszer küldi rendelésnél az emailt, de **számlát NEM állít ki**. Magyar jogszabály szerint kötelező a számla. Két opció:
- **Külső szolgáltató** (Számlázz.hu, Billingo) API integráció
- **Saját számla generálás** PDF-be Workers-ből

### B) Fizetési integráció
Jelenlegi rendszer **nem dolgoz fel fizetést**. Most utánvét? Banki átutalás? Online kártya (Stripe/Barion/SimplePay)?

### C) NAV Online Számla bejelentés
Ha lesz saját számlázás, NAV Online Számla automatikus bejelentés is kötelező.

### D) ÁFA típusok
Kozmetikumok: 27% normál ÁFA. Vannak egyéb termékek (pl. élelmiszer kiegészítő) eltérő ÁFA-val? A séma támogatja.

### E) Csomagajánló (bundle) most kell?
Tervben van, de UI támogatás indulásra nem mindenhol ér ki — variánsokhoz hasonlóan flag-elhető.

### F) Pre-order / előrendelés
Ha 0 készleten is rendelhető (ahogy mondtad), az gyakorlatilag **előrendelés**. Mónikának külön kell jeleznie ez OK-e (mikor szállít)?

---

## 11. Telepítési lépések (sorrend)

1. **R2 custom domain csatolása** (`images.monastudio.hu`)
2. **Pages binding** (`PRODUCT_IMAGES`)
3. **D1 migráció futtatása** (új táblák)
4. **Backend végpontok deploy**
5. **Admin oldal frissítése** (R2 feltöltő, új mezők)
6. **Termékek migrálása statikus HTML-ből D1-be** (egyszer)
7. **Webshop SSR Worker deploy**
8. **Egyedi termékoldal SSR deploy**
9. **Kosár + pénztár frissítése** (új termékadatok használata)
10. **Google Merchant feed exportálás** és Merchant Center beállítás
11. **Régi statikus webshop HTML törlése**

---

## 12. Becsült munka

Kódszinten:
- Migráció + táblák: 1 fájl
- Backend végpontok: ~12 fájl
- Frontend admin: 1 nagy HTML
- Webshop SSR: 2 fájl (lista + termékoldal)
- Excel/AI import: 2 fájl
- Migráció script (statikus → D1): 1 fájl

**Összesen: ~20 fájl**, ezek mindegyikét egyenként készítjük és teszteljük.

---

## 13. Mi a következő lépés?

A terv készen áll. Eldöntendő:

**A) Indul a kód építése** → SQL migráció lesz az első, utána sorban a többi.

**B) Még gondolkozunk** → válaszolj a 10-es szakasz nyitott kérdéseire.

**C) Egy részmodul először** → pl. csak az R2 + admin képfeltöltő, hogy lásd hogyan működik.
