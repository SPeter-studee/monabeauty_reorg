// src/pages/api/auth/register.ts
// Sprint 4.1 — Vendég regisztráció (email + jelszó + Turnstile captcha)
//
// Flow:
//   1. Bemeneti validáció (email, jelszó erősség, kötelező ÁSZF, Turnstile)
//   2. Cloudflare Turnstile captcha verify
//   3. Email duplikáció check (customers tábla)
//   4. PBKDF2 jelszó hash
//   5. Customer rekord beszúrás
//   6. Mailchimp bridge (sync, ~500-1000ms): ha már a listán van → "registered" tag,
//      is_newsletter_member = 1
//   7. Session létrehozás + cookie beállítás
//   8. Visszaadás: customer public view
//
// Env vars szükségesek:
//   - DB                       (D1 binding)
//   - TURNSTILE_SECRET_KEY     (Cloudflare Turnstile)
//   - MAILCHIMP_API_KEY/AUDIENCE_ID/SERVER (opcionális — bridge átugrik ha hiányzik)
//
// TODO Sprint 4.x: email verifikáció — most a status-t "active"-ra állítjuk regisztrációkor,
// később legyen "pending_email_verify" → email-link → "active". Egyelőre nincs email
// küldés a regisztrációhoz, csak a Welcome email Sprint 5-ben.

import type { APIRoute } from "astro";
import {
  hashNewPassword,
  isValidEmail,
  validatePasswordStrength,
  normalizeEmail,
  verifyTurnstile,
  createSession,
  buildSessionCookie,
  generateSecureToken,
} from "@/lib/auth";
import { bridgeRegistrationToMailchimp } from "@/lib/mailchimp";
import {
  customerRowToPublic,
  type CustomerRow,
  type RegisterRequest,
  type AuthResponse,
} from "@/lib/types/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    return await handleRegister(request, locals);
  } catch (err) {
    // Bármilyen unhandled exception → JSON-os 500
    // (Sosem szabad üres body-jú 500-at adni, mert a frontend JSON parse fail-el)
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("[register] UNHANDLED EXCEPTION:", errorMessage, errorStack);

    return new Response(
      JSON.stringify({
        success: false,
        error: "server_exception",
        message: "Szerverhiba történt. Próbáld később.",
        debug: errorMessage, // ideiglenes — Sprint 4.x-ben kivesszük production-ben
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

async function handleRegister(request: Request, locals: any): Promise<Response> {
  const env = locals.runtime.env as any;
  const db: D1Database = env.DB;

  // 1. Bemenet parse + validáció
  let body: RegisterRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_request", "Érvénytelen kérés.", 400);
  }

  const email = normalizeEmail(body.email || "");
  if (!isValidEmail(email)) {
    return jsonError("invalid_email", "Érvénytelen email cím.", 400);
  }

  const passwordCheck = validatePasswordStrength(body.password || "");
  if (!passwordCheck.valid) {
    return jsonError("weak_password", passwordCheck.hu || "A jelszó nem felel meg a követelményeknek.", 400);
  }

  if (!body.acceptsTerms) {
    return jsonError(
      "terms_not_accepted",
      "El kell fogadnod az ÁSZF-et és az adatvédelmi tájékoztatót.",
      400
    );
  }

  // 2. Cloudflare Turnstile captcha verifikáció
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!body.turnstileToken) {
      return jsonError("captcha_missing", "Kérlek igazold, hogy nem vagy robot.", 400);
    }
    const remoteIp = request.headers.get("cf-connecting-ip") || undefined;
    const captchaOk = await verifyTurnstile(body.turnstileToken, turnstileSecret, remoteIp);
    if (!captchaOk) {
      return jsonError("captcha_failed", "A captcha-ellenőrzés sikertelen volt. Próbáld újra.", 400);
    }
  } else {
    console.warn("[register] TURNSTILE_SECRET_KEY hiányzik — captcha kihagyva!");
  }

  // 3. Email duplikáció check
  const existing = await db
    .prepare("SELECT id FROM customers WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: number }>();

  if (existing) {
    return jsonError(
      "email_already_exists",
      "Ezzel az email címmel már van regisztrált fiók. Próbáld a bejelentkezést.",
      409
    );
  }

  // 4. Jelszó hash
  const { hash, salt } = await hashNewPassword(body.password);

  // 5. Customer beszúrás
  const firstName = body.firstName?.trim() || null;
  const lastName = body.lastName?.trim() || null;
  const acceptsMarketing = body.acceptsMarketing === true ? 1 : 0;

  const insertResult = await db
    .prepare(`
      INSERT INTO customers (
        email, password_hash, password_salt,
        first_name, last_name,
        accepts_marketing,
        status, email_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, 'active', 0)
    `)
    .bind(email, hash, salt, firstName, lastName, acceptsMarketing)
    .run();

  if (!insertResult.success) {
    console.error("[register] Customer insert failed:", insertResult);
    return jsonError("server_error", "Sikertelen regisztráció. Próbáld később.", 500);
  }

  const customerId = insertResult.meta.last_row_id as number;

  // 6. Mailchimp bridge — sync (a kérés végén várunk rá)
  // Ha a Mailchimp listán már szerepel az email, "registered" tag + is_newsletter_member = 1
  const mailchimpResult = await bridgeRegistrationToMailchimp(env, email);

  if (mailchimpResult.isExistingMember) {
    await db
      .prepare(`
        UPDATE customers
        SET is_newsletter_member = 1,
            newsletter_joined_at = datetime('now')
        WHERE id = ?
      `)
      .bind(customerId)
      .run();
    console.log(`[register] ${email} already in Mailchimp — newsletter_member flag set`);
  }

  // 7. Session létrehozás + cookie
  const ipAddress = request.headers.get("cf-connecting-ip");
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 256);
  const sessionId = await createSession(db, customerId, ipAddress, userAgent);
  const cookie = buildSessionCookie(sessionId);

  // 8. Customer public view + last_login_at frissítés
  await db
    .prepare("UPDATE customers SET last_login_at = datetime('now') WHERE id = ?")
    .bind(customerId)
    .run();

  const customerRow = await db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .bind(customerId)
    .first<CustomerRow>();

  if (!customerRow) {
    return jsonError("server_error", "Sikertelen regisztráció.", 500);
  }

  const response: AuthResponse = {
    success: true,
    customer: customerRowToPublic(customerRow),
    message: mailchimpResult.isExistingMember
      ? "Sikeres regisztráció! Mivel már fel vagy iratkozva a havi naplóra, az első rendelésednél kedvezményt kapsz."
      : "Sikeres regisztráció. Üdvözlünk a Mona Studio-ban!",
  };

  return new Response(JSON.stringify(response), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function jsonError(code: string, hu: string, status: number): Response {
  const body: AuthResponse = {
    success: false,
    error: code,
    message: hu,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
