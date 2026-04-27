// src/lib/types/auth.ts
// Sprint 4 — Ügyfél törzs (auth + profil)
//
// TypeScript típusok a customers, customer_sessions, customer_addresses, wishlists
// táblákhoz. A D1 séma a migrations/0003_sprint4_customers.sql fájlban van.

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────────────────────

export type CustomerStatus = "active" | "suspended" | "deleted";

/**
 * D1 row, ahogy a SELECT * visszaadja.
 * Megjegyzés: az `INTEGER NOT NULL DEFAULT 0` mezők boolean-ek (0/1).
 */
export interface CustomerRow {
  id: number;
  email: string;
  email_verified: 0 | 1;
  email_verify_token: string | null;
  email_verify_expires_at: string | null;

  password_hash: string | null;
  password_salt: string | null;
  password_reset_token: string | null;
  password_reset_expires_at: string | null;

  google_id: string | null;
  facebook_id: string | null;
  apple_id: string | null;

  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;

  is_newsletter_member: 0 | 1;
  newsletter_joined_at: string | null;
  accepts_marketing: 0 | 1;
  loyalty_points: number;

  status: CustomerStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * "Public" customer view — soha nem küldjük a password_hash-t kliensnek!
 * Az API-k mindig ezt a shape-et adják vissza (vagy ennek subset-jét).
 */
export interface CustomerPublic {
  id: number;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isNewsletterMember: boolean;
  acceptsMarketing: boolean;
  loyaltyPoints: number;
  hasPassword: boolean;       // van-e jelszó alapú login (vs. csak OAuth)
  oauthProviders: AuthProvider[];  // mely OAuth providerekkel van összekapcsolva
  status: CustomerStatus;
  createdAt: string;
}

export type AuthProvider = "google" | "facebook" | "apple";

/**
 * D1 row → public view konverzió. Soha ne adj át CustomerRow-t a kliensnek.
 */
export function customerRowToPublic(row: CustomerRow): CustomerPublic {
  const oauthProviders: AuthProvider[] = [];
  if (row.google_id) oauthProviders.push("google");
  if (row.facebook_id) oauthProviders.push("facebook");
  if (row.apple_id) oauthProviders.push("apple");

  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified === 1,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    isNewsletterMember: row.is_newsletter_member === 1,
    acceptsMarketing: row.accepts_marketing === 1,
    loyaltyPoints: row.loyalty_points,
    hasPassword: row.password_hash !== null,
    oauthProviders,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerSessionRow {
  id: number;
  session_id: string;
  customer_id: number;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}

/**
 * Session validation eredmény — auth middleware használja.
 */
export type SessionLookupResult =
  | { valid: true; customer: CustomerPublic; sessionId: string }
  | { valid: false; reason: "no_cookie" | "not_found" | "expired" | "customer_inactive" };

// ─────────────────────────────────────────────────────────────────────────────
// CÍMKÖNYV
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerAddressRow {
  id: number;
  customer_id: number;
  label: string;
  recipient_name: string;
  phone: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_shipping: 0 | 1;
  is_billing: 0 | 1;
  is_default: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddressPublic {
  id: number;
  label: string;
  recipientName: string;
  phone: string | null;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isShipping: boolean;
  isBilling: boolean;
  isDefault: boolean;
}

export function addressRowToPublic(row: CustomerAddressRow): CustomerAddressPublic {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    street: row.street,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country,
    isShipping: row.is_shipping === 1,
    isBilling: row.is_billing === 1,
    isDefault: row.is_default === 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST / RESPONSE shape-ek
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
  acceptsTerms: boolean;       // ÁSZF + adatvédelem — kötelező
  turnstileToken: string;       // Cloudflare Turnstile captcha token
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  customer?: CustomerPublic;
  error?: string;               // kódszerű, pl. "invalid_credentials", "email_already_exists"
  message?: string;             // human-readable HU üzenet
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION KONFIG — central place
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE_NAME = "mona_session";
export const SESSION_DURATION_DAYS = 30;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

// PBKDF2 paraméterek — OWASP 2023 ajánlás (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
export const PBKDF2_ITERATIONS = 600_000;   // 600k a SHA-256 esetén az ajánlott
export const PBKDF2_HASH_LENGTH = 32;       // 32 byte = 256 bit hash
export const PBKDF2_SALT_LENGTH = 32;       // 32 byte salt
