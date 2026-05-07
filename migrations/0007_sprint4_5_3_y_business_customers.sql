-- migrations/0007_sprint4_5_3_y_business_customers.sql
-- Sprint 4.5.3.y v0.9.27 — B2B Cégadatok (Magán / Belföldi cég / EU cég)
--
-- Bemenet: a vendég kérése — a számla helyes kiállításához
-- a cég-vásárlóknak külön cégszékhely-cím kell, NAV-szabványú adószámmal.
--
-- Új mezők (mind opcionális, NULL ha magán-vásárló):
--   customer_type      'private' (default) | 'company_hu' | 'company_eu'
--   company_name       cég neve
--   tax_number         magyar adószám: 8-1-2 formátum (pl. 12345678-1-12)
--   eu_vat_number      EU VATIN: ISO ország kód + 8-12 szám (pl. DE123456789)
--   company_country    cégszékhely országkódja (HU / DE / AT / ...)
--   company_zip        cégszékhely irányítószám
--   company_city       cégszékhely város
--   company_county     cégszékhely megye (HU only)
--   company_street     cégszékhely utca + házszám
--
-- Megjegyzés: a CHECK constraint nem-NULL-okra csak ha customer_type cég —
--   az SQLite ALTER TABLE nem támogat CHECK módosítást egyszerűen, ezért az
--   alkalmazás-rétegben validáljuk (update.ts). DB-szinten csak a típus enum.

-- Customer type (private/company_hu/company_eu)
ALTER TABLE customers ADD COLUMN customer_type TEXT NOT NULL DEFAULT 'private';

-- Cégadatok (csak company_hu / company_eu esetén töltjük)
ALTER TABLE customers ADD COLUMN company_name TEXT;
ALTER TABLE customers ADD COLUMN tax_number TEXT;
ALTER TABLE customers ADD COLUMN eu_vat_number TEXT;

-- Cégszékhely (külön, nem a szállítási vagy lakcím!)
ALTER TABLE customers ADD COLUMN company_country TEXT;
ALTER TABLE customers ADD COLUMN company_zip TEXT;
ALTER TABLE customers ADD COLUMN company_city TEXT;
ALTER TABLE customers ADD COLUMN company_county TEXT;
ALTER TABLE customers ADD COLUMN company_street TEXT;

-- Index a cégadatok alapú keresésre (jövőbeli admin riportokhoz, B2B export-hoz)
CREATE INDEX IF NOT EXISTS idx_customers_company_hu_tax
  ON customers (tax_number)
  WHERE tax_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_company_eu_vatin
  ON customers (eu_vat_number)
  WHERE eu_vat_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_type
  ON customers (customer_type);
