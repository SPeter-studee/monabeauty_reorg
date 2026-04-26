-- migrations/0002_sprint3_seed_krx_products.sql
-- Sprint 3.2 — KRX termékek migráció a régi rendszer site_content.json-jából
-- IDEMPOTENS verzió: többször is futtatható dupla sor / unique hiba nélkül.
--
-- 8 KRX termék: Cica vonal (4 db) + Probiotic vonal (4 db)
-- Mónika ajánlások átdolgozva: rövid, marketing-fókuszú, bőrtípus + kombináció
--
-- Futtatás:
--   npm run db:seed         (remote)
--   npm run db:seed:local   (lokális)
--
-- Tiszta újratöltéshez (ha tényleg nulláról kell):
--   npm run db:reseed       (reset + seed egyben)

-- ─────────────────────────────────────────────────────────────────────────────
-- KATEGÓRIÁK
-- INSERT OR IGNORE: ha már létezik a slug (UNIQUE), nem dob hibát
-- ─────────────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (slug, name, description, sort_order) VALUES
  ('arclemosok',    'Arctisztítás',
   'Lemosó, peeling, micellás víz — a bőr alapfeltételeit megteremtő termékek.',
   10),
  ('tonikok',       'Tonikok',
   'pH-egyensúly és hatóanyag-bevitel előkészítés — a kezelésed megsokszorozott eredményéért.',
   20),
  ('szerumok',      'Szérumok',
   'Koncentrált hatóanyagok közvetlenül a bőrbe — a célzott eredményhez.',
   30),
  ('arckremek',     'Arckrémek',
   'Hidratáló, regeneráló krémek — a bőr védőrétegének megerősítéséért.',
   40),
  ('csomagok',      'Csomagok',
   'Próbacsomagok és úti készletek — egy egész vonalat kipróbálhatsz egyben.',
   50);

-- ─────────────────────────────────────────────────────────────────────────────
-- MÁRKA — KRX
-- ─────────────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO brands (slug, name, description, country, sort_order) VALUES
  ('krx',
   'KRX',
   'Koreai professzionális szépségápolás. Két fő termékvonal: a **Cica** (Centella Asiatica alapú) az érzékeny, gyulladt bőrre, és a **Probiotic** (pre- és probiotikumok) a bőr mikrobiomjának helyreállítására. Mónika személyesen választott márkája — a szalonban végzett kezelések után otthoni ápolásként ajánlott.',
   'Korea',
   10);

-- ─────────────────────────────────────────────────────────────────────────────
-- TERMÉKEK — CICA VONAL (érzékeny, irritált, rosaceás bőrre)
-- INSERT OR REPLACE: ha létezik a slug (UNIQUE), felülírja az új tartalommal.
-- Megőrzi az ID-t, így a product_images FK kapcsolat megmarad.
--
-- ⚠️  Ha egy terméket KÉZIBŐL módosítottál (pl. ár), akkor a reseed felülírja!
-- A megoldás: db:reset SOSEM töröl, csak db:reseed-del jár együtt → ott direkt
-- akarjuk hogy minden visszakerüljön a seed értékekre.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Cica Oxigenizáló 2 in 1 arclemosó
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_featured, is_recommended
) VALUES (
  'krx-cica-2in1-arclemoso',
  'Cica Oxigenizáló 2 in 1 arclemosó',
  'Smink és szennyeződés eltávolítás egy lépésben — érzékeny bőrre.',
  'Arctisztító gél oxigenizáló komplexszel és magas hatóanyag tartalmú természetes ázsiai növényi összetevőkkel. Eltávolítja a sminket és a napi szennyeződést a bőrről, különleges eljárásának köszönhetően pedig oxigenizálja és frissíti az érzékeny, irritált, gyulladásra hajlamos bőrt.

**Fő összetevő:** A Centella Asiatica (CICA, tigrisfű) egy a koreai bőrápolásban közkedvelt hatóanyag. Nyugtató és hidratáló bőrápoló termék, amely helyreállítja az érzékeny bőr sérült védőrétegét.',
  'Centella Asiatica (CICA) kivonat, oxigenizáló komplex, természetes ázsiai növényi összetevők',
  'Reggel és este meleg vízzel — masszírozd a nedves arcra, majd öblítsd le.',
  'Érzékeny, rosaceára vagy aknéra hajlamos bőrre — egy lépésben sminklemosó és arctisztító. **Tökéletes párosa:** Cica Tonik utána, majd Cica Szérum vagy Krém. Arckezeléseim után is ezt javasolom otthoni rutinba.',
  7750,
  10,
  (SELECT id FROM categories WHERE slug = 'arclemosok'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  50, 'ml',
  1, 1
);

-- 2. Cica Tonik
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_featured, is_recommended
) VALUES (
  'krx-cica-tonik',
  'Cica Tonik',
  'Bőrpír és kiszáradás kezelése — antioxidánsokkal, hialuronnal.',
  'Kifejezetten bőrpír és kiszáradás kezelésére készült frissítő tonik antioxidánsokból (fügekaktusz kivonat, oliva kivonat) és fermentált (Lactobacillus ferment) összetevőkből álló gyógyító réteget ad a bőr mikrobiomjának védelmére. Hialuronsavat, kollagén peptideket tartalmaz amely hidratál, rugalmasan tartja a bőrt.',
  'Centella Asiatica, fügekaktusz kivonat, oliva kivonat, Lactobacillus ferment, hialuronsav, kollagén peptidek, peptidek, ceramidok',
  'Tisztítás után, vattára adagolva vagy tenyérbe nyomva, az arc-nyak területén szétmasszírozva. Reggel és este.',
  'Bőrpírra, érzékeny és rosaceás bőrre. **Kombinálva legerősebb:** Cica arclemosó után, Cica Szérum előtt. A szalonban végzett **arckezelés után** segít megnyugtatni és felkészíteni a bőrt a hatóanyagokra.',
  7050,
  12,
  (SELECT id FROM categories WHERE slug = 'tonikok'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  50, 'ml',
  1, 1
);

-- 3. Cica Szérum
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_featured, is_recommended
) VALUES (
  'krx-cica-szerum',
  'Cica Szérum',
  'Gyulladáscsökkentő, regeneráló — peptidekkel és ceramidokkal.',
  'Gyorsítja a bőr gyógyulását, nyugtató hatású szérum. Antioxidánsokban gazdag, növényi alapú összetevőkből áll. **Peptidek és ceramidok** erősítik a bőr védőrétegét és csökkentik a gyulladást.

A Centella Asiatica koncentrált formában — a szérumforma a leggyorsabb behatolást teszi lehetővé a bőrbe.',
  'Centella Asiatica koncentrátum, peptidek (Palmitoyl Tripeptide-1, -5, Tetrapeptide-7), ceramid NP, hialuronsav, Madecassoside, Asiaticoside, Squalane',
  'Cica Tonik után, 1-2 csepp az egész arc területére. Reggel és este, krém előtt.',
  'Aktív gyulladásra, posztpattanás-foltokra, érzékeny bőrre. **Ezt a szérumot ajánlom** ha a Cica Tonik nem elég — koncentráltabb hatóanyag, gyorsabb regeneráció. **Kombinálva** a szalonban végzett mélytisztítással **észrevehetően gyorsabban** csillapodik a gyulladás.',
  6050,
  15,
  (SELECT id FROM categories WHERE slug = 'szerumok'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  15, 'ml',
  1, 1
);

-- 4. Cica Nappali Krém
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_featured, is_recommended
) VALUES (
  'krx-cica-nappali-krem',
  'Cica Nappali Krém',
  'Könnyű, regeneráló krém — antioxidáns-fókusszal.',
  'Könnyű, antioxidánsokban gazdag krém, amely hidratálja, javítja a károsodott védőrétegeket, erősíti, megnyugtatja és helyreállítja a bőrt.

Természetes összetevők: Centella Asiatica (tigrisfű), kínai Cassia, oliva kivonat, fügekaktusz kivonat, sheavaj, hialuronsav, Lactobacillus ferment, kollagén peptidek.',
  'Centella Asiatica, kínai Cassia, oliva kivonat, fügekaktusz, sheavaj, hialuronsav, Lactobacillus ferment, kollagén peptid',
  'Cica Szérum után, borsónyi mennyiséget oszlassunk el az arcon. **Utána javasolt:** napvédő (KRX SPF 50+).',
  'Érzékeny, rosaceás, ekcémás bőrre — **napi alapkrém**. Záró lépésként, napvédő alatt. **A Cica vonal teljes kombinációja** (lemosó → tonik → szérum → krém) a leghatékonyabb a sérült barrier helyreállítására.',
  7050,
  14,
  (SELECT id FROM categories WHERE slug = 'arckremek'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  25, 'g',
  1, 1
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TERMÉKEK — PROBIOTIC VONAL (mikrobiom helyreállítás)
-- ─────────────────────────────────────────────────────────────────────────────

-- 5. Probiotikus habzó arclemosó
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_recommended
) VALUES (
  'krx-probiotikus-arclemoso',
  'Probiotikus habzó arclemosó',
  'Bőrt nem szárító, habzó arctisztító — mikrobiom-támogatással.',
  'Könnyed, habzó arctisztító a mindennapi arclemosáshoz. Hatékonyan távolítja el a napi szennyeződést és a felesleges faggyút a bőrről anélkül, hogy szárítaná. Használata után az arcbőr fellélegzik, előkészítve a tonizálásra.

**Bifida ferment**: probiotikus baktérium fermentálásával nyert összetevő, amely segíti a bőr természetes mikroflórájának fenntartását, a bőr természetes védekezőképességének visszaállítását.',
  'Bifida Ferment Filtrate, Lactococcus Ferment, Lactobacillus Ferment, Inulin, Tocopherol, Coco-Betaine',
  '1-2 pumpa felhabosítva, az egész arc-nyak területén szétmasszírozva. Reggel és este.',
  'Minden bőrtípusra — különösen ajánlott vízhiányos, városi levegőnek kitett bőrre. **Probiotic vonalat** a stresszelt, kifáradt bőrhöz választom — ha sok szmogban / képernyő előtt vagy.',
  10200,
  18,
  (SELECT id FROM categories WHERE slug = 'arclemosok'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  100, 'ml',
  1
);

-- 6. Probiotikus tonik
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_recommended
) VALUES (
  'krx-probiotic-tonik',
  'Probiotikus tonik',
  'Alacsony pH-jú, hidratáló tonik — mikrobiom-fókusszal.',
  'Alacsony pH-jú tonik a bőr gyengéd tonizálására, a bőr biomjának védelmére és helyreállítására. **Vitaminokban és aminosavakban gazdag** — nedvességgel látja el a száraz, érzékeny, irritált bőrt. Intenzíven hidratálja és nyugtatja, előkészítve arra, hogy jobban felszívja a hidratáló krém hatóanyagait.',
  'Inulin (probiotikus táplálék), Bifida Ferment, vitaminok, aminosavak, Glycerin, Pentylene Glycol',
  'Probiotikus arclemosó után. 1-2 pumpa, az egész arc területén szétmasszírozva. Reggel és este.',
  'Érzékeny, dehidratált, rosaceás bőrre. **A Probiotic vonal előkészítő lépése** — utána a hidratáló krém hatékonyabban szívódik fel. Ha **észrevehető a bőr stresszeltsége** (pirosság, kiszáradás), itt indulj.',
  10200,
  16,
  (SELECT id FROM categories WHERE slug = 'tonikok'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  120, 'ml',
  1
);

-- 7. Probiotic nappali krém
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_recommended
) VALUES (
  'krx-probiotic-nappali-krem',
  'Probiotic nappali krém',
  'Légiesen könnyed, hidratáló — a bőrbarrier helyreállítására.',
  'Intenzív, légiesen könnyed hidratáló, nyugtató hatású nappali arckrém. Probiotikus összetevői segítenek **helyreállítani és megerősíteni a bőrbarriert**, visszaállítja a bőr normál pH egyensúlyát és támogatja a mikrobiomját.

Rendszeres használata hozzájárul a bőr rugalmasságának megőrzéséhez, csökkenti a ráncok kialakulását, hatékony a száraz, dehidratált, rosaceás és ekcémás bőrökre is.',
  'Bifida Ferment Filtrate, Lactobacillus Ferment, Lactococcus Ferment, Inulin, Fructan, Papain, Tocopherol, Glycerin, Sheavaj',
  'Reggeli és esti arctisztítás + tonik után. Borsónyi mennyiséget az arcra. **Reggel napvédő alatt használandó.**',
  'Érzékeny, dehidratált, rosaceás bőrre — anti-aging hatással. **Kombinálva** a szalonban végzett **hidratáló arckezeléssel** különösen erős eredményt ad. Ha **30+ vagy** és érzed, hogy a bőr "nem tartja meg" amit kap — itt a megoldás.',
  11990,
  10,
  (SELECT id FROM categories WHERE slug = 'arckremek'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  50, 'g',
  1
);

-- 8. Probiotic line utazó készlet
INSERT OR REPLACE INTO products (
  slug, name, short_description, description,
  ingredients, usage_instructions, monika_recommends,
  price_ft, stock_qty,
  category_id, brand_id,
  size_value, size_unit,
  is_featured, is_new
) VALUES (
  'krx-probiotic-utazo-keszlet',
  'Probiotic utazó készlet',
  'Teljes Probiotic vonal mini méretben — kipróbáláshoz vagy úthoz.',
  'A pre- és probiotikumokat tartalmazó termékek **jól használhatóak bőrproblémáknál**. Ilyen például a túlzott faggyútermelődés, gyulladtabb aknés bőr, a városi levegőnek, elektroszmognak kitett, vízhiányos bőrökre. Emellett az érzékeny és ekcémára hajlamos bőrre is ajánlott.

**A csomag tartalma:**
- KRX Probiotic habzó arclemosó **20 ml**
- Probiotic tonik **20 ml**
- Probiotic nappali krém **20 ml**',
  'Lásd az egyes termékek INCI listáját.',
  'A teljes Probiotic rutin: lemosás → tonik → krém. Reggel és este.',
  'Tökéletes **kipróbáláshoz** ha még nem ismered a Probiotic vonalat — vagy **ajándékba**. Utazáshoz is ideális méret. **Új vendégeimnek** is gyakran ezt ajánlom első körben — 2-3 hét után már látszik az eredmény.',
  12990,
  8,
  (SELECT id FROM categories WHERE slug = 'csomagok'),
  (SELECT id FROM brands WHERE slug = 'krx'),
  60, 'ml',
  1, 1
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TERMÉK KÉPEK
-- A 7 KRX termékhez van fotó (public/images/products/), a 8. (utazó készlet)
-- később kap saját képet — egyelőre placeholder marad.
--
-- Idempotens megoldás: először töröljük, aztán beillesztjük.
-- Ez azért biztonságos, mert a product_images-nek nincs FK referenciája máshová.
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM product_images
WHERE product_id IN (SELECT id FROM products WHERE slug LIKE 'krx-%');

INSERT INTO product_images (product_id, url, alt_text, is_primary) VALUES
  ((SELECT id FROM products WHERE slug = 'krx-cica-2in1-arclemoso'),
   '/images/products/krx-cica-2in1-arclemoso.webp', 'KRX Cica Oxigenizáló 2 in 1 arclemosó', 1),
  ((SELECT id FROM products WHERE slug = 'krx-cica-tonik'),
   '/images/products/krx-cica-tonik.webp', 'KRX Cica Tonik', 1),
  ((SELECT id FROM products WHERE slug = 'krx-cica-szerum'),
   '/images/products/krx-cica-szerum.webp', 'KRX Cica Szérum', 1),
  ((SELECT id FROM products WHERE slug = 'krx-cica-nappali-krem'),
   '/images/products/krx-cica-nappali-krem.webp', 'KRX Cica Nappali Krém', 1),
  ((SELECT id FROM products WHERE slug = 'krx-probiotikus-arclemoso'),
   '/images/products/krx-probiotikus-arclemoso.webp', 'KRX Probiotikus habzó arclemosó', 1),
  ((SELECT id FROM products WHERE slug = 'krx-probiotic-tonik'),
   '/images/products/krx-probiotic-tonik.webp', 'KRX Probiotikus tonik', 1),
  ((SELECT id FROM products WHERE slug = 'krx-probiotic-nappali-krem'),
   '/images/products/krx-probiotic-nappali-krem.webp', 'KRX Probiotic nappali krém', 1);

-- A 8. (utazó készlet) kép később kerül be — addig kép nélkül jelenik meg
-- (a komponensek default placeholder ikont mutatnak ha nincs is_primary kép)
