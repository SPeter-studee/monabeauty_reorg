// src/pages/api/auth/google/callback.ts
// Sprint 4.3 — Google OAuth callback endpoint
//
// Flow:
//   1. Google redirectsel ide ?code=...&state=... vagy ?error=...
//   2. State cookie ellenőrzés (CSRF)
//   3. Code → access_token exchange
//   4. Access token → user info (email, sub, name, picture)
//   5. Customer match logika:
//      a) van customer ahol google_id = sub → login
//      b) van customer ahol email = userInfo.email → összekapcsolás (set google_id)
//      c) nincs → új customer rekord
//   6. Mailchimp bridge (új vendég esetén)
//   7. Session létrehozás + cookie
//   8. Redirect az eredeti "from" path-ra
//
// Hibás esetben: redirect a "from" path-ra `?auth_error=...` paraméterrel,
// hogy a frontend tudjon megfelelő üzenetet mutatni.

import type { APIRoute } from "astro";
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  readOAuthStateCookies,
  buildClearOAuthStateCookies,
} from "@/lib/oauth-google";
import {
  createSession,
  buildSessionCookie,
  normalizeEmail,
} from "@/lib/auth";
import { bridgeRegistrationToMailchimp } from "@/lib/mailchimp";
import type { CustomerRow } from "@/lib/types/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    return await handleCallback(request, locals);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[google-callback] UNHANDLED EXCEPTION:", errorMessage, err);
    return redirectWithError("/", "server_exception", errorMessage);
  }
};

async function handleCallback(request: Request, locals: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromQuery = url.searchParams.get("state");
  const errorFromQuery = url.searchParams.get("error");

  // 1. Cookie-ból visszaolvassuk a state-et és a from path-ot
  const { state: stateFromCookie, from } = readOAuthStateCookies(request);
  const fromPath = from || "/";

  // 2. Hibakezelés: ha a Google hibát küldött vissza
  if (errorFromQuery) {
    console.warn(`[google-callback] Google returned error: ${errorFromQuery}`);
    return redirectWithError(fromPath, "google_error", errorFromQuery);
  }

  // 3. CSRF state ellenőrzés
  if (!code || !stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    console.warn("[google-callback] State mismatch or missing code");
    return redirectWithError(fromPath, "state_mismatch");
  }

  // 4. Code → access_token exchange
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const tokenResult = await exchangeGoogleCode(env, code, redirectUri);

  if (!tokenResult.ok) {
    return redirectWithError(fromPath, "token_exchange_failed", tokenResult.debug);
  }

  // 5. Access token → user info
  const userInfoResult = await fetchGoogleUserInfo(tokenResult.accessToken);

  if (!userInfoResult.ok) {
    return redirectWithError(fromPath, "userinfo_failed", userInfoResult.debug);
  }

  const googleUser = userInfoResult.user;
  const googleId = googleUser.sub;
  const email = normalizeEmail(googleUser.email || "");

  if (!email) {
    return redirectWithError(fromPath, "no_email_from_google");
  }

  // 6. Customer match logika
  let customer: CustomerRow | null = null;

  // 6a. google_id alapján
  customer = await db
    .prepare("SELECT * FROM customers WHERE google_id = ? LIMIT 1")
    .bind(googleId)
    .first<CustomerRow>();

  // 6b. email alapján — ha még nincs google_id-vel összekapcsolva
  if (!customer) {
    customer = await db
      .prepare("SELECT * FROM customers WHERE email = ? LIMIT 1")
      .bind(email)
      .first<CustomerRow>();

    if (customer) {
      // Email match — összekapcsoljuk a Google fiókkal
      // (a meglévő jelszavas fiókhoz hozzáadjuk a Google login-t is)
      await db
        .prepare(`
          UPDATE customers
          SET google_id = ?,
              email_verified = 1,
              avatar_url = COALESCE(?, avatar_url),
              first_name = COALESCE(first_name, ?),
              last_name = COALESCE(last_name, ?)
          WHERE id = ?
        `)
        .bind(
          googleId,
          googleUser.picture || null,
          googleUser.given_name || null,
          googleUser.family_name || null,
          customer.id
        )
        .run();

      console.log(`[google-callback] Linked Google to existing customer #${customer.id} (${email})`);
    }
  }

  // 6c. Nincs customer → új létrehozás
  if (!customer) {
    const insertResult = await db
      .prepare(`
        INSERT INTO customers (
          email, email_verified,
          google_id,
          first_name, last_name, avatar_url,
          status
        )
        VALUES (?, 1, ?, ?, ?, ?, 'active')
      `)
      .bind(
        email,
        googleId,
        googleUser.given_name || null,
        googleUser.family_name || null,
        googleUser.picture || null
      )
      .run();

    if (!insertResult.success) {
      console.error("[google-callback] Customer insert failed:", insertResult);
      return redirectWithError(fromPath, "customer_insert_failed");
    }

    const newCustomerId = insertResult.meta.last_row_id as number;
    console.log(`[google-callback] Created new customer #${newCustomerId} via Google (${email})`);

    // Mailchimp bridge — új vendég esetén
    try {
      const mailchimpResult = await bridgeRegistrationToMailchimp(env, email);
      if (mailchimpResult.isExistingMember) {
        await db
          .prepare(`
            UPDATE customers
            SET is_newsletter_member = 1,
                newsletter_joined_at = datetime('now')
            WHERE id = ?
          `)
          .bind(newCustomerId)
          .run();
      }
    } catch (err) {
      // Mailchimp baj nem fail-eli a teljes flow-t
      console.warn("[google-callback] Mailchimp bridge error (non-fatal):", err);
    }

    // Reload the customer rekord
    customer = await db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .bind(newCustomerId)
      .first<CustomerRow>();
  }

  if (!customer) {
    return redirectWithError(fromPath, "customer_lookup_failed");
  }

  // 7. Status check
  if (customer.status !== "active") {
    return redirectWithError(fromPath, "account_inactive");
  }

  // 8. Session létrehozás + last_login_at frissítés
  const ipAddress = request.headers.get("cf-connecting-ip");
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 256);

  const sessionId = await createSession(db, customer.id, ipAddress, userAgent);
  const sessionCookie = buildSessionCookie(sessionId);

  await db
    .prepare("UPDATE customers SET last_login_at = datetime('now') WHERE id = ?")
    .bind(customer.id)
    .run();

  // 9. Redirect az eredeti "from" path-ra + cookie-k
  const headers = new Headers();
  headers.set("Location", fromPath);
  headers.append("Set-Cookie", sessionCookie);
  // OAuth state cookie clear
  buildClearOAuthStateCookies().forEach(c => headers.append("Set-Cookie", c));

  return new Response(null, {
    status: 302,
    headers,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redirect a fromPath-ra ?auth_error=... paraméterrel.
 * A frontend ezt felismeri és megfelelő üzenetet jelenít meg.
 */
function redirectWithError(fromPath: string, errorCode: string, debug?: string): Response {
  const url = new URL(fromPath, "https://placeholder.local");
  url.searchParams.set("auth_error", errorCode);
  if (debug) {
    url.searchParams.set("auth_error_debug", debug.slice(0, 200));
  }

  // Csak a path + query rész, a host-ot nem visszük
  const target = url.pathname + url.search;

  const headers = new Headers();
  headers.set("Location", target);
  // OAuth state cookie clear
  buildClearOAuthStateCookies().forEach(c => headers.append("Set-Cookie", c));

  return new Response(null, {
    status: 302,
    headers,
  });
}
