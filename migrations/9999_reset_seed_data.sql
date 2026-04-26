-- migrations/9999_reset_seed_data.sql
-- ⚠️  RESET — csak a seed adatokat törli (kategóriák, márkák, termékek, képek).
--
-- BIZTONSÁGOS: az `orders` és `order_items` táblákat NEM érinti.
-- Ezeket törlés helyett a customer-id NULL-on hagyja, és a
-- product_slug + product_name snapshot megőrzi a rendelési előzményeket.
--
-- Futtatás:
--   npm run db:reset       (remote)
--   npm run db:reset:local (lokális)
--
-- Reseed (egyben):
--   npm run db:reseed     → reset + seed
--   npm run db:reseed:local
--
-- Sorrend FONTOS: foreign key constraint-ek miatt először a kapcsolt
-- (image-ek, products), aztán a hivatkozott (categories, brands) kerülnek törlésre.

PRAGMA foreign_keys = OFF;

-- 1. Order items product_id-ját NULL-ra állítjuk (snapshot megmarad)
UPDATE order_items SET product_id = NULL;

-- 2. Termék képek
DELETE FROM product_images;

-- 3. Termékek
DELETE FROM products;

-- 4. Márkák
DELETE FROM brands;

-- 5. Kategóriák
DELETE FROM categories;

-- AUTOINCREMENT visszaállítás (sqlite_sequence frissítés)
DELETE FROM sqlite_sequence WHERE name IN ('categories', 'brands', 'products', 'product_images');

PRAGMA foreign_keys = ON;
