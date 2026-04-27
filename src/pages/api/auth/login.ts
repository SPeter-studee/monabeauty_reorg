// src/pages/api/auth/login.ts
// Sprint 4.1 — Bejelentkezés (email + jelszó)
//
// Flow:
//   1. Bemeneti validáció (email + jelszó)
//   2. Customer lookup email alapján
//   3. Jelszó verifikáció (constant-time)
//   4. Customer status check (active?)
//   5. Session létrehozás + cookie
//   6. last_login_at frissítés
//   7. Customer public view visszadás
//
// Brute-force védelem: TODO Sprint 4.x — rate limiting Cloudflare Workers KV-vel
// (max 5 sikertelen login / IP / 15 perc).

import type { APIRoute } from "astro";
import {
  verifyPassword,
  isValidEmail,
  normalizeEmail,
  createSession,
  buildSessionCookie,
} from "@/lib/auth";
import {
  customerRowToPublic,
  type CustomerRow,
  type LoginRequest,
  type AuthResponse,
} from "@/lib/types/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as any;
  const db: D1Database = env.DB;

  // 1. Bemenet parse + validáció
  let body: LoginRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_request", "Érvénytelen kérés.", 400);
  }

  const email = normalizeEmail(body.email || "");
  if (!isValidEmail(email)) {
    return jsonError("invalid_email", "Érvénytelen email cím.", 400);
  }

  if (!body.password) {
    return jsonError("password_required", "A jelszó megadása kötelező.", 400);
  }

  // 2. Customer lookup
  const customer = await db
    .prepare("SELECT * FROM customers WHERE email = ? LIMIT 1")
    .bind(email)
    .first<CustomerRow>();

  // Egységes válaszüzenet hibás email és hibás jelszó esetén — ne lehessen
  // user enumerációs támadással email-listát építeni.
  if (!customer) {
    return jsonError("invalid_credentials", "Hibás email cím vagy jelszó.", 401);
  }

  // 3. Csak email/jelszó alapú accountoknál — nincs password_hash, ha csak OAuth-tal regisztrált
  if (!customer.password_hash || !customer.password_salt) {
    return jsonError(
      "oauth_only_account",
      "Ehhez az email-hez nem tartozik jelszavas fiók. Próbáld a Google vagy Facebook bejelentkezést.",
      401
    );
  }

  // 4. Jelszó verifikáció
  const passwordOk = await verifyPassword(
    body.password,
    customer.password_hash,
    customer.password_salt
  );

  if (!passwordOk) {
    return jsonError("invalid_credentials", "Hibás email cím vagy jelszó.", 401);
  }

  // 5. Status check
  if (customer.status !== "active") {
    return jsonError(
      "account_inactive",
      "A fiókod jelenleg nem aktív. Vedd fel a kapcsolatot a Mona Studio csapattal.",
      403
    );
  }

  // 6. Session + cookie
  const ipAddress = request.headers.get("cf-connecting-ip");
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 256);
  const sessionId = await createSession(db, customer.id, ipAddress, userAgent);
  const cookie = buildSessionCookie(sessionId);

  // 7. last_login_at frissítés
  await db
    .prepare("UPDATE customers SET last_login_at = datetime('now') WHERE id = ?")
    .bind(customer.id)
    .run();

  // 8. Public view válasz
  const response: AuthResponse = {
    success: true,
    customer: customerRowToPublic(customer),
    message: `Üdv újra, ${customer.first_name || customer.email}!`,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
  });
};

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
