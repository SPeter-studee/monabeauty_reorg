// src/pages/api/profile/addresses/default.ts
// Sprint 4.5.3 — Címkönyv: default beállítás (külön szállítási vagy számlázási)
//
// POST { type: "shipping" | "billing", addressId: number }

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";
import type { SetDefaultRequest } from "@/lib/types/addresses";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    return await handleSetDefault(request, locals);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[addresses/default/POST] UNHANDLED EXCEPTION:", errorMessage, err);
    return jsonResponse(500, {
      success: false,
      error: "server_exception",
      message: "Szerverhiba történt.",
      debug: errorMessage,
    });
  }
};

async function handleSetDefault(request: Request, locals: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  const auth = await getCurrentCustomer(request, db);
  if (!auth.valid) {
    return jsonResponse(401, {
      success: false,
      error: "not_authenticated",
      message: "Bejelentkezés szükséges.",
    });
  }
  const customerId = auth.customer.id;

  let body: SetDefaultRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "invalid_request",
      message: "Érvénytelen kérés.",
    });
  }

  if (!body.type || (body.type !== "shipping" && body.type !== "billing")) {
    return jsonResponse(400, {
      success: false,
      error: "invalid_type",
      message: "A type 'shipping' vagy 'billing' kell legyen.",
    });
  }
  if (!body.addressId || Number.isNaN(body.addressId)) {
    return jsonResponse(400, {
      success: false,
      error: "invalid_address_id",
      message: "Érvénytelen cím-ID.",
    });
  }

  // Ownership check
  const exists = await db
    .prepare("SELECT id, is_shipping, is_billing FROM customer_addresses WHERE id = ? AND customer_id = ?")
    .bind(body.addressId, customerId)
    .first<{ id: number; is_shipping: number; is_billing: number }>();

  if (!exists) {
    return jsonResponse(404, {
      success: false,
      error: "not_found",
      message: "A cím nem található.",
    });
  }

  // Logikai check: a cím használható-e az adott célra?
  if (body.type === "shipping" && !exists.is_shipping) {
    return jsonResponse(400, {
      success: false,
      error: "not_shipping",
      message: "Ez a cím nem szállítási címként van megjelölve.",
    });
  }
  if (body.type === "billing" && !exists.is_billing) {
    return jsonResponse(400, {
      success: false,
      error: "not_billing",
      message: "Ez a cím nem számlázási címként van megjelölve.",
    });
  }

  // Két lépéses művelet: töröl mindenhonnan, majd beállít a célon
  const flagColumn = body.type === "shipping" ? "is_default_shipping" : "is_default_billing";

  await db
    .prepare(`UPDATE customer_addresses SET ${flagColumn} = 0 WHERE customer_id = ?`)
    .bind(customerId)
    .run();

  await db
    .prepare(`UPDATE customer_addresses SET ${flagColumn} = 1 WHERE id = ? AND customer_id = ?`)
    .bind(body.addressId, customerId)
    .run();

  return jsonResponse(200, {
    success: true,
    message: body.type === "shipping"
      ? "Alapértelmezett szállítási cím beállítva."
      : "Alapértelmezett számlázási cím beállítva.",
  });
}

function jsonResponse(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
