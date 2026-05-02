-- migrations/0006_backfill_orders_customer_id.sql
-- Sprint 4.5.x — Backfill: anonymous rendelések összekapcsolása customers-zel email egyezés alapján
--
-- Probléma:
--   A Sprint 4 ELŐTT a checkout-on csak guest_email/guest_name lett rögzítve,
--   a customer_id NULL maradt. Ezért a /profil/rendelesek oldal nem találta
--   a régi rendeléseket.
--
-- Megoldás:
--   Frissítjük az összes orders.customer_id = NULL rekordot, ahol a guest_email
--   egyezik egy customers.email-lel.
--
-- BIZTONSÁG:
--   - Csak akkor írunk, ha customer_id IS NULL (nem írjuk felül a meglévő kapcsolatokat)
--   - Csak akkor, ha pontosan egy customer egyezik (customers.email UNIQUE garantálja)
--
-- Futtatás (production):
--   npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0006_backfill_orders_customer_id.sql

-- Diagnózis: hány rendelés érintett
SELECT 'BEFORE: orders with NULL customer_id but matching guest_email:' as info,
       COUNT(*) as count
FROM orders o
WHERE o.customer_id IS NULL
  AND o.guest_email IN (SELECT email FROM customers);

-- A backfill UPDATE
UPDATE orders
SET customer_id = (
  SELECT c.id
  FROM customers c
  WHERE c.email = orders.guest_email
  LIMIT 1
)
WHERE customer_id IS NULL
  AND guest_email IN (SELECT email FROM customers);

-- Verifikáció: most már nincs orphan rendelés (matched email-lel)
SELECT 'AFTER: orders with NULL customer_id but matching guest_email:' as info,
       COUNT(*) as count
FROM orders o
WHERE o.customer_id IS NULL
  AND o.guest_email IN (SELECT email FROM customers);
