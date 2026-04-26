-- migrations/0001_sprint3_webshop.sql
-- Sprint 3 — Webshop alapszéma
-- Futtatás:
--   npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0001_sprint3_webshop.sql
-- Lokális teszthez:
--   npx wrangler d1 execute monastudio-v2-db --local --file migrations/0001_sprint3_webshop.sql
--
-- Megjegyzés: a Sprint 4 (customers) és Sprint 5 (admin) sémák külön migrations
-- fájlokba kerülnek (0002_, 0003_, stb.).

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────────────────────
-- KATEGÓRIÁK
-- Hierarchikus (parent_id-val), pl. "Arckezelés > Szérumok > Anti-aging"
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,                     -- pl. "arckezeles", "anti-aging"
  name          TEXT NOT NULL,                            -- pl. "Arckezelés"
  description   TEXT,                                     -- rövid bevezető a kategória oldalra
  parent_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sort_order    INTEGER NOT NULL DEFAULT 100,
  is_active     INTEGER NOT NULL DEFAULT 1,               -- 0/1 boolean
  hero_image    TEXT,                                     -- /images/categories/arckezeles.webp
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- MÁRKÁK
-- Eclado, Mesotica, London Beauty, stb.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,                     -- pl. "eclado", "mesotica"
  name          TEXT NOT NULL,                            -- pl. "Eclado"
  description   TEXT,                                     -- márka bemutatás
  logo_url      TEXT,                                     -- /images/brands/eclado.svg
  country       TEXT,                                     -- pl. "Korea", "Olaszország"
  sort_order    INTEGER NOT NULL DEFAULT 100,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- TERMÉKEK
-- Kapcsolódik kategóriához és márkához (1-1).
-- A képek külön táblában (`product_images`) — több kép is lehet.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT NOT NULL UNIQUE,                 -- pl. "regeneralo-arcserum"
  name              TEXT NOT NULL,                        -- pl. "Regeneráló arcszérum"
  short_description TEXT,                                 -- rövid leírás kártyára (max 200 karakter)
  description       TEXT,                                 -- teljes leírás (markdown)
  ingredients       TEXT,                                 -- INCI lista (vesszővel)
  usage_instructions TEXT,                                -- használati útmutató
  monika_recommends TEXT,                                 -- Mónika ajánlása (E-E-A-T!)
  -- ───────── Árazás ──────────
  price_ft          INTEGER NOT NULL,                     -- alapár forintban
  sale_price_ft     INTEGER,                              -- akciós ár (NULL ha nincs akció)
  sale_starts_at    TEXT,                                 -- ISO date — akció kezdete
  sale_ends_at      TEXT,                                 -- ISO date — akció vége
  -- ───────── Készlet ──────────
  stock_qty         INTEGER NOT NULL DEFAULT 0,           -- aktuális készlet
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,         -- ennél kisebb → "kevés van!" jelzés
  -- ───────── Kategória / márka kapcsolat ──────────
  category_id       INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand_id          INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  -- ───────── Méret / kiszerelés ──────────
  size_value        REAL,                                 -- pl. 50, 100
  size_unit         TEXT,                                 -- pl. "ml", "g"
  -- ───────── SEO + meta ──────────
  meta_title        TEXT,                                 -- ha üres → name használt
  meta_description  TEXT,                                 -- ha üres → short_description
  -- ───────── Megjelölések ──────────
  is_featured       INTEGER NOT NULL DEFAULT 0,           -- főoldali kiemelt
  is_active         INTEGER NOT NULL DEFAULT 1,           -- megjelenjen-e a webshopon
  is_new            INTEGER NOT NULL DEFAULT 0,           -- "ÚJ" badge
  is_recommended    INTEGER NOT NULL DEFAULT 0,           -- Mónika ajánlja
  -- ───────── Opcionális tulajdonságok (Sprint 5+ termék-szűrőkhöz) ──────────
  skin_types        TEXT,                                 -- JSON array: ["dry","sensitive"]
  skin_concerns     TEXT,                                 -- JSON array: ["wrinkles","dryness"]
  -- ───────── Időbélyegek ──────────
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = 1;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_ft);

-- ─────────────────────────────────────────────────────────────────────────────
-- TERMÉK KÉPEK
-- 1-N kapcsolat termékkel. Az `is_primary = 1` képe a kártya/preview.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,                            -- R2 vagy local path
  alt_text      TEXT,                                     -- accessibility
  sort_order    INTEGER NOT NULL DEFAULT 100,
  is_primary    INTEGER NOT NULL DEFAULT 0,               -- a fő (kártya) kép
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- ─────────────────────────────────────────────────────────────────────────────
-- RENDELÉSEK
-- Vendég módban (Sprint 3) — customer_id NULL.
-- Sprint 4 után regisztrált vendéghez kötődik.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number      TEXT NOT NULL UNIQUE,                 -- pl. "MS-2026-0001"
  -- ───────── Vendég adatok (Sprint 3) ──────────
  customer_id       INTEGER,                              -- Sprint 4-től NOT NULL ha regisztrált
  guest_name        TEXT NOT NULL,
  guest_email       TEXT NOT NULL,
  guest_phone       TEXT NOT NULL,
  -- ───────── Szállítás ──────────
  shipping_method   TEXT NOT NULL CHECK (shipping_method IN ('foxpost', 'personal')),
  shipping_address  TEXT,                                 -- FoxPost esetén automata cím
  shipping_city     TEXT,
  shipping_zip      TEXT,
  shipping_fee_ft   INTEGER NOT NULL DEFAULT 0,           -- 0 / 1990 / stb.
  -- ───────── Pénzügyi adatok ──────────
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('transfer', 'on_delivery', 'simplepay')),
  subtotal_ft       INTEGER NOT NULL,                     -- termékek összege akció után
  total_ft          INTEGER NOT NULL,                     -- subtotal + shipping
  -- ───────── Státusz ──────────
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending',           -- új rendelés, fizetésre vár
                      'paid',              -- kifizetve (átutalás megérkezett)
                      'preparing',         -- készítjük a csomagot
                      'shipped',           -- elküldtük
                      'delivered',         -- megérkezett a vendéghez
                      'cancelled',         -- törölve
                      'refunded'           -- visszafizetve
                    )),
  -- ───────── Megjegyzések ──────────
  customer_note     TEXT,                                 -- vendég megjegyzése
  admin_note        TEXT,                                 -- Mónika belső jegyzete
  -- ───────── Időbélyegek ──────────
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RENDELÉS TÉTELEK
-- 1-N kapcsolat rendeléssel. A termék árakat "freezeled" állapotban tárolja
-- (price_at_order), hogy a rendelés ne változzon ha a termék ára későbbi.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        INTEGER REFERENCES products(id) ON DELETE SET NULL,
  -- ───────── Snapshot a rendelés idejére ──────────
  product_slug      TEXT NOT NULL,                        -- ne vesszünk el ha törölik
  product_name      TEXT NOT NULL,
  product_image_url TEXT,
  -- ───────── Árazás (freezeled) ──────────
  qty               INTEGER NOT NULL CHECK (qty > 0),
  price_at_order_ft INTEGER NOT NULL,                     -- egységár a rendeléskor
  subtotal_ft       INTEGER NOT NULL,                     -- qty * price_at_order
  -- ───────── Időbélyegek ──────────
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGEREK — updated_at automatikus frissítés
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS categories_updated_at
  AFTER UPDATE ON categories
  FOR EACH ROW
BEGIN
  UPDATE categories SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS brands_updated_at
  AFTER UPDATE ON brands
  FOR EACH ROW
BEGIN
  UPDATE brands SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS products_updated_at
  AFTER UPDATE ON products
  FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS orders_updated_at
  AFTER UPDATE ON orders
  FOR EACH ROW
BEGIN
  UPDATE orders SET updated_at = datetime('now') WHERE id = OLD.id;
END;
