-- migrations/0005_sprint4_5_3_addresses.sql
-- Sprint 4.5.3 — Címkönyv séma frissítés
--
-- Változás:
--   - Eddig: customer_addresses.is_default — EGYETLEN default cím a vendégnek
--     (mind szállítás, mind számlázás esetén ugyanaz)
--   - Most:  customer_addresses.is_default_shipping + is_default_billing —
--     a vendég külön választhat default szállítási és számlázási címet,
--     amik LEHETNEK ugyanaz vagy különböző címek
--
-- Migráció:
--   1. Új mezők hozzáadás
--   2. Adatok átkonvertálás: a meglévő is_default = 1 → mindkét új flag = 1
--   3. Régi unique index törlés + új két index hozzáadása
--   4. is_default mező eltávolítása NEM (D1 SQLite limit), csak DEPRECATED komment
--
-- Futtatás:
--   npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0005_sprint4_5_3_addresses.sql

PRAGMA foreign_keys = ON;

-- 1. Új mezők
ALTER TABLE customer_addresses ADD COLUMN is_default_shipping INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customer_addresses ADD COLUMN is_default_billing  INTEGER NOT NULL DEFAULT 0;

-- 2. Adatok átkonvertálás: ami eddig is_default = 1 volt, az mostantól mindkét default
UPDATE customer_addresses
SET is_default_shipping = 1, is_default_billing = 1
WHERE is_default = 1;

-- 3. Régi unique index törlés
DROP INDEX IF EXISTS idx_customer_addresses_default;

-- 4. Új unique index-ek (egy customer-enként max 1 default mindkét típushoz)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_default_shipping
  ON customer_addresses(customer_id) WHERE is_default_shipping = 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_default_billing
  ON customer_addresses(customer_id) WHERE is_default_billing = 1;

-- Megjegyzés: az is_default mezőt NEM töröljük (D1 SQLite ALTER TABLE DROP
-- COLUMN limitált), csak deprecated lesz. Az új kódbázis nem használja.
