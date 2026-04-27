// src/lib/oauth-google.ts
// Sprint 4.3 — Google OAuth 2.0 helper függvények
//
// Flow áttekintés:
//   1. buildAuthUrl(state) → redirect URL ahova a vendég megy bejelentkezni
//   2. callback megérkezik /api/auth/google/callback?code=...&state=...
//   3. exchangeCodeForToken(code) → access_token + id_token
//   4. fetchUserInfo(access_token) → { sub, email, name, picture, ... }
//
// Doc: https://developers.google.com/identity/protocols/oauth2/web-server

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export interface GoogleOAuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export interface GoogleUserInfo {
  sub: string;             // unique Google user ID (string, NEM email!)
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;     // keresztnév
  family_name?: string;    // vezetéknév
  picture?: string;        // avatar URL
  locale?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHORIZATION URL építés
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Megépíti a Google OAuth authorization URL-t, ahova a vendéget redirectaljuk.
 *
 * @param env — runtime env (CF Pages binding)
 * @param state — CSRF védelmi random token (cookie-ba is mentjük)
 * @param redirectUri — a callback endpoint teljes URL-je (https://monastudio.hu/api/auth/google/callback)
 */
export function buildGoogleAuthUrl(
  env: GoogleOAuthEnv,
  state: string,
  redirectUri: string
): string | null {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",      // nincs refresh token-re szükségünk
    prompt: "select_account",   // mindig megkérdezi melyik fiókkal akarnak (multi-account user)
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTHORIZATION CODE → ACCESS TOKEN
// ─────────────────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  scope?: string;
  token_type: string;
}

export type ExchangeResult =
  | { ok: true; accessToken: string; idToken?: string }
  | { ok: false; reason: "config_missing" | "invalid_code" | "network_error"; debug?: string };

/**
 * A Google authorization code-ot exchange-eli access token-re.
 * @param code — a Google callback URL-jében érkezett `code` paraméter
 * @param redirectUri — ugyanaz mint a buildGoogleAuthUrl-nél (kötelező egyezni)
 */
export async function exchangeGoogleCode(
  env: GoogleOAuthEnv,
  code: string,
  redirectUri: string
): Promise<ExchangeResult> {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { ok: false, reason: "config_missing" };
  }

  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      return {
        ok: false,
        reason: "invalid_code",
        debug: `Google token endpoint ${res.status}: ${errorBody.slice(0, 200)}`,
      };
    }

    const data = await res.json() as TokenResponse;
    return {
      ok: true,
      accessToken: data.access_token,
      idToken: data.id_token,
    };
  } catch (err) {
    return {
      ok: false,
      reason: "network_error",
      debug: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. USER INFO LEKÉRÉS
// ─────────────────────────────────────────────────────────────────────────────

export type UserInfoResult =
  | { ok: true; user: GoogleUserInfo }
  | { ok: false; reason: "unauthorized" | "network_error"; debug?: string };

/**
 * Az access token segítségével lekérdezzük a Google user info-t.
 * Visszaadja: sub (Google user ID), email, név, avatar URL, stb.
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<UserInfoResult> {
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: "unauthorized" };
    }
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      return {
        ok: false,
        reason: "network_error",
        debug: `Google userinfo ${res.status}: ${errorBody.slice(0, 200)}`,
      };
    }

    const user = await res.json() as GoogleUserInfo;
    return { ok: true, user };
  } catch (err) {
    return {
      ok: false,
      reason: "network_error",
      debug: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CSRF STATE COOKIE
// ─────────────────────────────────────────────────────────────────────────────

export const OAUTH_STATE_COOKIE = "mona_oauth_state";
export const OAUTH_FROM_COOKIE = "mona_oauth_from";
export const OAUTH_STATE_DURATION_SEC = 600; // 10 perc

/**
 * Set-Cookie header építése — state CSRF token + redirect URL ("from").
 */
export function buildOAuthStateCookies(state: string, fromPath: string): string[] {
  const cookies = [
    `${OAUTH_STATE_COOKIE}=${state}; Max-Age=${OAUTH_STATE_DURATION_SEC}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    `${OAUTH_FROM_COOKIE}=${encodeURIComponent(fromPath)}; Max-Age=${OAUTH_STATE_DURATION_SEC}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  ];
  return cookies;
}

/**
 * Cookie-k clearelése a callback után.
 */
export function buildClearOAuthStateCookies(): string[] {
  return [
    `${OAUTH_STATE_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`,
    `${OAUTH_FROM_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`,
  ];
}

/**
 * State cookie kiolvasás a request-ből.
 */
export function readOAuthStateCookies(request: Request): {
  state: string | null;
  from: string | null;
} {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map(c => c.trim());

  let state: string | null = null;
  let from: string | null = null;

  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf("=");
    if (eqIdx === -1) continue;
    const name = cookie.slice(0, eqIdx);
    const value = cookie.slice(eqIdx + 1);
    if (name === OAUTH_STATE_COOKIE) state = value || null;
    if (name === OAUTH_FROM_COOKIE) from = value ? decodeURIComponent(value) : null;
  }

  return { state, from };
}
