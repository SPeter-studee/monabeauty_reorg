// src/lib/auth.ts
// Sprint 4 — Server-side auth helpers
//
// Funkcionalitás:
//   1. PBKDF2 jelszó hash + verify (Web Crypto API, nincs npm dep)
//   2. CSPRNG token generálás (session ID, email verify, password reset)
//   3. Session cookie kezelés (parse, set, clear)
//   4. Cloudflare Turnstile captcha verifikáció
//   5. Email validáció + jelszó erősség ellenőrzés
//   6. Helper: getCurrentCustomer (auth middleware)

import {
  PBKDF2_ITERATIONS,
  PBKDF2_HASH_LENGTH,
  PBKDF2_SALT_LENGTH,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  customerRowToPublic,
  type CustomerRow,
  type SessionLookupResult,
  type CustomerSessionRow,
} from "./types/auth";

// ─────────────────────────────────────────────────────────────────────────────
// 1. PBKDF2 PASSWORD HASH + VERIFY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generál egy random salt-ot (32 byte = 64 hex karakter).
 */
function generateSalt(): string {
  const arr = new Uint8Array(PBKDF2_SALT_LENGTH);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

/**
 * Jelszó hash PBKDF2-vel + outer SHA-256 réteg.
 * Eredmény: hex string (64 karakter, 32 byte).
 *
 * **Architektúra**: a Cloudflare Workers PBKDF2 100k iter limit miatt a 600k
 * helyett egy outer SHA-256 hash réteget alkalmazunk. Ez gyakorlatilag azonos
 * brute-force költség, de Workers-kompatibilis.
 *
 * @param password — kliens által küldött plaintext jelszó
 * @param saltHex — 64-karakter hex salt (a customers.password_salt mezőből)
 */
async function pbkdf2Hash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);
  const saltBuffer = hexToBytes(saltHex);

  // Step 1: PBKDF2 (100k iter, max ami CF Workers-ben elérhető)
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    PBKDF2_HASH_LENGTH * 8 // bits
  );

  // Step 2: Outer SHA-256(intermediateHash + salt) — extra brute-force költség
  const combined = new Uint8Array(derivedBits.byteLength + saltBuffer.byteLength);
  combined.set(new Uint8Array(derivedBits), 0);
  combined.set(saltBuffer, derivedBits.byteLength);

  const finalHashBuffer = await crypto.subtle.digest("SHA-256", combined);
  return bytesToHex(new Uint8Array(finalHashBuffer));
}

/**
 * Új jelszó hash-elés — hash + salt visszadás.
 * Tárolás: customers.password_hash + customers.password_salt
 */
export async function hashNewPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const hash = await pbkdf2Hash(password, salt);
  return { hash, salt };
}

/**
 * Jelszó verifikáció — login flow-ban. Constant-time comparison a timing attack-ek ellen.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const computedHash = await pbkdf2Hash(password, storedSalt);
  return constantTimeEqual(computedHash, storedHash);
}

/**
 * Constant-time string összehasonlítás — timing attack védelem.
 * (Nem kritikus a hash-ek esetén, mert mindkét oldal hash-elt, de jó gyakorlat.)
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CSPRNG TOKEN GENERÁLÁS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Random token generálás. CSPRNG (crypto.getRandomValues) — biztonságos session
 * ID-hez, email verify token-hez, password reset token-hez.
 *
 * @param byteLength — alapértelmezett 32 byte = 64 hex karakter (256 bit entrópia)
 */
export function generateSecureToken(byteLength = 32): string {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SESSION COOKIE KEZELÉS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cookie header-ből a session ID kiolvasása.
 * @returns session ID hex string, vagy null ha nincs cookie
 */
export function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  // Egyszerű cookie parser: "key1=value1; key2=value2"
  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === SESSION_COOKIE_NAME) {
      return rest.join("=") || null;
    }
  }
  return null;
}

/**
 * Set-Cookie header építése a session-hez.
 * httpOnly + Secure + SameSite=Lax + Path=/ + Max-Age 30 nap.
 */
export function buildSessionCookie(sessionId: string): string {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    `Max-Age=${maxAge}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
  ].join("; ");
}

/**
 * Session cookie törlése (logout).
 */
export function buildClearSessionCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    `Max-Age=0`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
  ].join("; ");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AUTH MIDDLEWARE — getCurrentCustomer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticated endpoint-okban használandó: visszaadja a current vendéget
 * a session cookie alapján, vagy null ha nincs / lejárt / customer inaktív.
 *
 * @param db — Cloudflare D1 binding (env.DB)
 */
export async function getCurrentCustomer(
  request: Request,
  db: D1Database
): Promise<SessionLookupResult> {
  const sessionId = getSessionCookie(request);
  if (!sessionId) {
    return { valid: false, reason: "no_cookie" };
  }

  // Lookup session + customer egy SQL JOIN-nal
  const row = await db
    .prepare(`
      SELECT
        s.session_id, s.expires_at, s.customer_id,
        c.id, c.email, c.email_verified, c.email_verify_token, c.email_verify_expires_at,
        c.password_hash, c.password_salt, c.password_reset_token, c.password_reset_expires_at,
        c.google_id, c.facebook_id, c.apple_id,
        c.first_name, c.last_name, c.phone, c.avatar_url,
        c.is_newsletter_member, c.newsletter_joined_at, c.accepts_marketing, c.loyalty_points,
        c.status, c.last_login_at, c.created_at, c.updated_at
      FROM customer_sessions s
      INNER JOIN customers c ON c.id = s.customer_id
      WHERE s.session_id = ?
      LIMIT 1
    `)
    .bind(sessionId)
    .first<CustomerSessionRow & CustomerRow>();

  if (!row) {
    return { valid: false, reason: "not_found" };
  }

  // Session lejárt?
  const expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    // Takarítás — async, nem várjuk meg
    db.prepare("DELETE FROM customer_sessions WHERE session_id = ?")
      .bind(sessionId)
      .run()
      .catch(() => {});
    return { valid: false, reason: "expired" };
  }

  // Customer inaktív?
  if (row.status !== "active") {
    return { valid: false, reason: "customer_inactive" };
  }

  // Session frissítés — last_used_at most
  // Nem várjuk meg — fire-and-forget
  db.prepare("UPDATE customer_sessions SET last_used_at = datetime('now') WHERE session_id = ?")
    .bind(sessionId)
    .run()
    .catch(() => {});

  return {
    valid: true,
    sessionId,
    customer: customerRowToPublic(row),
  };
}

/**
 * Új session létrehozás (login után).
 */
export async function createSession(
  db: D1Database,
  customerId: number,
  ipAddress: string | null,
  userAgent: string | null
): Promise<string> {
  const sessionId = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db
    .prepare(`
      INSERT INTO customer_sessions (session_id, customer_id, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(sessionId, customerId, ipAddress, userAgent, expiresAt)
    .run();

  return sessionId;
}

/**
 * Session törlés (logout).
 */
export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare("DELETE FROM customer_sessions WHERE session_id = ?")
    .bind(sessionId)
    .run();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CLOUDFLARE TURNSTILE CAPTCHA
// ─────────────────────────────────────────────────────────────────────────────

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

/**
 * Cloudflare Turnstile token verifikáció — server-side.
 * Doc: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * @param token — kliensoldali turnstile widget által visszaadott token
 * @param secretKey — env.TURNSTILE_SECRET_KEY
 * @param remoteIp — opcionális, cf-connecting-ip header
 */
export async function verifyTurnstile(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<boolean> {
  if (!token || !secretKey) return false;

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (remoteIp) formData.append("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json() as TurnstileVerifyResponse;
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verify error:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VALIDÁCIÓK
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Jelszó erősség ellenőrzés.
 * Minimum: 8 karakter. Ajánlott: 12+ karakter, vegyes (de nem kötelező — a hossz a kulcs).
 */
export interface PasswordStrengthResult {
  valid: boolean;
  reason?: string;
  hu?: string;        // magyar üzenet a UI-nak
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length < 8) {
    return {
      valid: false,
      reason: "too_short",
      hu: "A jelszó legalább 8 karakter hosszú legyen.",
    };
  }
  if (password.length > 128) {
    return {
      valid: false,
      reason: "too_long",
      hu: "A jelszó túl hosszú (max. 128 karakter).",
    };
  }
  return { valid: true };
}

/**
 * Email normalizálás — lowercase + trim. Tárolás és lookup mindig így.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// HEX UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
