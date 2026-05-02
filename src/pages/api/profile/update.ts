// src/pages/api/profile/update.ts
// Sprint 4.5.1 — Profil adatok frissítés (auth required)
//
// Bemenet: { firstName, lastName, phone }
// Validáció:
//   - Auth required (session cookie)
//   - firstName/lastName: max 50 char, opt
//   - phone: max 20 char, opt (formátum-validáció lazább, csak max length)
// Művelet:
//   - UPDATE customers SET ... WHERE id = ?
//   - updated_at automatikusan frissül a trigger-rel
// Válasz: { success: true, customer: CustomerPublic }

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";
import {
  customerRowToPublic,
  type CustomerRow,
} from "@/lib/types/auth";
import type { ProfileUpdateRequest, ProfileUpdateResponse } from "@/lib/types/profile";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    return await handleUpdate(request, locals);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[profile/update] UNHANDLED EXCEPTION:", errorMessage, err);
    return jsonResponse(500, {
      success: false,
      error: "server_exception",
      message: "Szerverhiba történt. Próbáld később.",
      debug: errorMessage,
    } as any);
  }
};

async function handleUpdate(request: Request, locals: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  // 1. Auth check
  const authResult = await getCurrentCustomer(request, db);
  if (!authResult.valid) {
    return jsonResponse(401, {
      success: false,
      error: "not_authenticated",
      message: "Bejelentkezés szükséges.",
    });
  }

  const customerId = authResult.customer.id;

  // 2. Bemenet parse
  let body: ProfileUpdateRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "invalid_request",
      message: "Érvénytelen kérés.",
    });
  }

  // 3. Validáció
  const firstName = sanitize(body.firstName, 50);
  const lastName = sanitize(body.lastName, 50);
  const phone = sanitize(body.phone, 20);

  // 4. UPDATE
  const updateResult = await db
    .prepare(`
      UPDATE customers
      SET first_name = ?,
          last_name = ?,
          phone = ?
      WHERE id = ?
    `)
    .bind(firstName, lastName, phone, customerId)
    .run();

  if (!updateResult.success) {
    console.error("[profile/update] UPDATE failed:", updateResult);
    return jsonResponse(500, {
      success: false,
      error: "server_error",
      message: "Sikertelen mentés.",
    });
  }

  // 5. Vissza a frissített rekord
  const customer = await db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .bind(customerId)
    .first<CustomerRow>();

  if (!customer) {
    return jsonResponse(500, {
      success: false,
      error: "server_error",
      message: "Sikertelen lookup mentés után.",
    });
  }

  return jsonResponse(200, {
    success: true,
    message: "Adatok sikeresen frissítve.",
    customer: customerRowToPublic(customer),
  } as any);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trim + max length + üres → null konverzió.
 */
function sanitize(value: string | null | undefined, maxLength: number): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (trimmed === "") return null;
  return trimmed.slice(0, maxLength);
}

function jsonResponse(status: number, body: ProfileUpdateResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
