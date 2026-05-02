-- migrations/0004_sprint4_5_profile.sql
-- Sprint 4.5 — Profil oldalak + email verifikáció + discount code bónusz
--
-- Futtatás (production):
--   npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0004_sprint4_5_profile.sql
-- Lokális teszthez:
--   npx wrangler d1 execute monastudio-v2-db --local --file migrations/0004_sprint4_5_profile.sql
--
-- Tartalom:
--   1. discount_codes tábla — vendég-specifikus + általános kuponkódok
--   2. customers bővítés — discount_code_used_at flag (egy bónusz / vendég)
--   3. orders bővítés — discount_code_id FK + discount_amount_ft tárolás

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────────────────────
-- DISCOUNT_CODES — kuponkódok (vendég-specifikus + általános)
-- ─────────────────────────────────────────────────────────────────────────────
-- Architektúra:
--   - "WELCOME-XXXXXX" típusú kódok: új vendégek email-ben kapják regisztrációkor
--     (csak ha verified email + Mailchimp newsletter member volt korábban)
--   - "PROMO-XXXXXX" típusú kódok: későbbi marketing kampányokhoz általános
--     használatra (Sprint 5+)
--   - A kód lehet customer_id-hez kötve (egyedi) vagy NULL (általános, pl. "TAVASZ24")
--   - Egy kód csak EGYSZER használható (used_at != NULL)
--   - Lejárati dátum minden kódhoz
CREATE TABLE IF NOT EXISTS discount_codes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  code              TEXT NOT NULL UNIQUE,                    -- pl. "WELCOME-A8K4L9", lowercase storage
  customer_id       INTEGER REFERENCES customers(id) ON DELETE CASCADE, -- NULL = általános
  type              TEXT NOT NULL DEFAULT 'welcome',         -- 'welcome', 'promo', 'birthday'

  -- Kedvezmény értéke (egy aktív, a másik NULL)
  discount_percent  INTEGER,                                  -- 0-100, pl. 10 = -10%
  discount_amount_ft INTEGER,                                 -- fix Ft összeg (pl. 1000 Ft)

  -- Korlátozások
  min_order_ft      INTEGER,                                  -- minimum rendelés-érték (NULL = nincs)
  max_uses          INTEGER NOT NULL DEFAULT 1,               -- hányszor használható összesen
  uses_count        INTEGER NOT NULL DEFAULT 0,

  -- Időbeli érvényesség
  valid_from        TEXT NOT NULL DEFAULT (datetime('now')),
  valid_until       TEXT,                                     -- NULL = nincs lejárat

  -- Használat audit
  used_at           TEXT,                                     -- első felhasználás ideje
  used_order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,

  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_customer ON discount_codes(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discount_codes_type ON discount_codes(type);

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMERS bővítés — bónusz tracking
-- ─────────────────────────────────────────────────────────────────────────────
-- A welcome bónusz egyszer adható ki vendégenként. Ezt a flag jelzi.
-- Akkor sem ad újra ha valaki email-et regisztrációkor változtat — a flag-et
-- a beváltáskor (nem a kibocsátáskor) állítjuk be.
ALTER TABLE customers ADD COLUMN welcome_discount_issued_at TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS bővítés — discount tracking
-- ─────────────────────────────────────────────────────────────────────────────
-- A checkout során a discount alkalmazva. A teljes számolás auditálható.
ALTER TABLE orders ADD COLUMN discount_code_id INTEGER REFERENCES discount_codes(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN discount_amount_ft INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code_id) WHERE discount_code_id IS NOT NULL;
