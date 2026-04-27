-- migrations/0003_sprint4_customers.sql
-- Sprint 4 — Ügyfél törzs (auth + profil)
--
-- Futtatás (remote/production):
--   npx wrangler d1 execute monastudio-v2-db --remote --file migrations/0003_sprint4_customers.sql
-- Lokális teszthez:
--   npx wrangler d1 execute monastudio-v2-db --local --file migrations/0003_sprint4_customers.sql
--
-- Tartalom:
--   1. customers — vendég accountok (email, jelszó hash, OAuth ID-k, profil)
--   2. customer_sessions — server-side session-ök (httpOnly cookie session-ID-vel)
--   3. customer_addresses — címkönyv (mentett szállítási/számlázási címek)
--   4. orders bővítés — customer_id FK (a Sprint 3.4 óta meglévő orders táblához)
--   5. wishlists — kívánságlista (Sprint 4 része, de placeholder a Sprint 3-ban)

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMERS — vendég account
-- ─────────────────────────────────────────────────────────────────────────────
-- Auth-providerek logikája:
--   - email + password_hash (PBKDF2 + 32-byte salt) — klasszikus regisztráció
--   - google_id — Google OAuth bejelentkezés (Sprint 4.2)
--   - facebook_id — Facebook Login (Sprint 4.3)
--   - apple_id — későbbi (Sprint 7+, iOS app esetén)
-- Egy felhasználónak több módon is lehet auth-ja (pl. email + Google ugyanahhoz az
-- emailhez): az `email` mező unique, és OAuth callback-kor megpróbáljuk match-elni.
CREATE TABLE IF NOT EXISTS customers (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  email                   TEXT NOT NULL UNIQUE,            -- lowercase, kötelező
  email_verified          INTEGER NOT NULL DEFAULT 0,      -- 0/1 — email verifikációs link után 1
  email_verify_token      TEXT,                             -- aktiváló token (NULL ha már verifikált)
  email_verify_expires_at TEXT,                             -- ISO 8601, 24h-os érvényesség

  -- Klasszikus auth (NULL ha csak OAuth-on keresztül regisztrált)
  password_hash           TEXT,                             -- PBKDF2 hash (Web Crypto API)
  password_salt           TEXT,                             -- 32-byte hex salt
  password_reset_token    TEXT,                             -- jelszó-csere token
  password_reset_expires_at TEXT,                           -- 1h-os érvényesség

  -- OAuth provider ID-k (provider account ID-ja)
  google_id               TEXT UNIQUE,                      -- Sprint 4.2
  facebook_id             TEXT UNIQUE,                      -- Sprint 4.3
  apple_id                TEXT UNIQUE,                      -- Sprint 7+ (placeholder)

  -- Profil adatok
  first_name              TEXT,
  last_name               TEXT,
  phone                   TEXT,                             -- +36 30 123 4567 formátum
  avatar_url              TEXT,                             -- OAuth provider profil kép, vagy R2 upload

  -- Hírlevél / Mailchimp bridge (lásd Sprint 4 — Hírlevél ↔ regisztráció)
  is_newsletter_member    INTEGER NOT NULL DEFAULT 0,       -- 1 ha a regisztráció előtt már a Mailchimp listán volt
  newsletter_joined_at    TEXT,                             -- ISO 8601 — első Mailchimp tag-elés ideje

  -- Marketing engagement
  accepts_marketing       INTEGER NOT NULL DEFAULT 0,       -- GDPR consent — explicit checkbox a register form-on
  loyalty_points          INTEGER NOT NULL DEFAULT 0,       -- jövőbeli loyalty rendszerre

  -- Status / metadata
  status                  TEXT NOT NULL DEFAULT 'active',   -- 'active', 'suspended', 'deleted'
  last_login_at           TEXT,                             -- ISO 8601 — frissül login-kor
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_google_id ON customers(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_facebook_id ON customers(facebook_id) WHERE facebook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email_verify_token ON customers(email_verify_token) WHERE email_verify_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_password_reset_token ON customers(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMER_SESSIONS — server-side session-ök
-- ─────────────────────────────────────────────────────────────────────────────
-- Architektúra:
--   - Login után létrehozunk egy random 32-byte session_id-t
--   - Cookie-ba beállítjuk httpOnly + Secure + SameSite=Lax
--   - Minden authenticated request-en lookup a customer_sessions táblában
--   - Logout = DELETE row (a cookie kliens oldali törlése csak udvariasság)
--   - "Logout mindenhonnan" = DELETE WHERE customer_id = ?
--   - Régi session-ök (>30 nap) periodikus takarítás (Sprint 5 admin cron)
CREATE TABLE IF NOT EXISTS customer_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT NOT NULL UNIQUE,                     -- 32-byte hex (64 char), CSPRNG-ből
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Metaadatok (audit-célból)
  ip_address      TEXT,                                     -- bejelentkezéskor cf-connecting-ip
  user_agent      TEXT,                                     -- bejelentkezéskor User-Agent (truncated 256 char)

  expires_at      TEXT NOT NULL,                            -- ISO 8601 — login után +30 nap
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at    TEXT NOT NULL DEFAULT (datetime('now'))   -- frissül minden authenticated request-en
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id ON customer_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_expires ON customer_sessions(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMER_ADDRESSES — címkönyv
-- ─────────────────────────────────────────────────────────────────────────────
-- A vendégek menthetik szállítási / számlázási címeiket, hogy a checkout-on ne
-- kelljen újra beírni. Default cím: a `is_default` flag.
-- A típus 'shipping' vagy 'billing' (vagy mindkettő, ha a vendég ezt jelzi).
CREATE TABLE IF NOT EXISTS customer_addresses (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id       INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Címke (a vendég adja, pl. "Otthon", "Munkahely", "Anyu címe")
  label             TEXT NOT NULL,

  -- Cím-mezők
  recipient_name    TEXT NOT NULL,                          -- Mihez címezzük (lehet más mint a customer neve)
  phone             TEXT,                                   -- futár hívásra
  street            TEXT NOT NULL,                          -- "Zrínyi Miklós u. 3."
  city              TEXT NOT NULL,                          -- "Vác"
  postal_code       TEXT NOT NULL,                          -- "2600"
  country           TEXT NOT NULL DEFAULT 'HU',             -- ISO 3166-1 alpha-2

  -- Típus: shipping / billing — egy cím lehet mindkettő (külön rekord vagy 1 rekord, választás kérdése)
  -- Most: külön rekord ha a vendég megkülönbözteti, de a UI default-ként ugyanazt használja.
  is_shipping       INTEGER NOT NULL DEFAULT 1,             -- 0/1
  is_billing        INTEGER NOT NULL DEFAULT 1,             -- 0/1
  is_default        INTEGER NOT NULL DEFAULT 0,             -- 0/1 — egyetlen default címe a vendégnek

  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
-- Egy-egy default cím per customer (constraint-szerű, részleges unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_default
  ON customer_addresses(customer_id) WHERE is_default = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS + customer_id
-- ─────────────────────────────────────────────────────────────────────────────
-- Az `orders.customer_id` és `idx_orders_customer` már a migrations/0001 mező —
-- nem kell ALTER TABLE. Az FK constraint SQLite-ban csak új táblánál strict;
-- runtime-ban az app köti a customers(id)-hez.

-- ─────────────────────────────────────────────────────────────────────────────
-- WISHLISTS — kívánságlista
-- ─────────────────────────────────────────────────────────────────────────────
-- Egyszerű many-to-many: customer_id × product_id, az hozzáadás idejével.
-- Megjegyzés: anonim wishlist (localStorage) is támogatható lenne, de most
-- csak login-ed userekkel megy.
CREATE TABLE IF NOT EXISTS wishlists (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (customer_id, product_id)                           -- egy termék egyszer egy wishlist-ben
);

CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS — updated_at automatikus frissítés
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS trg_customers_updated_at
AFTER UPDATE ON customers
BEGIN
  UPDATE customers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_customer_addresses_updated_at
AFTER UPDATE ON customer_addresses
BEGIN
  UPDATE customer_addresses SET updated_at = datetime('now') WHERE id = NEW.id;
END;
