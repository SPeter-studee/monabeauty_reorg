// src/pages/api/profile/addresses/[id].ts
// Sprint 4.5.3 — Címkönyv: módosítás (PUT) + törlés (DELETE) egy címen

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";
import {
  addressRowToPublic,
  validateAddress,
  type AddressRow,
  type AddressUpdateRequest,
  type AddressMutationResponse,
} from "@/lib/types/addresses";

// ─────────────────────────────────────────────────────────────────────────────
// PUT — módosít
// ─────────────────────────────────────────────────────────────────────────────

export const PUT: APIRoute = async ({ request, locals, params }) => {
  try {
    return await handleUpdate(request, locals, params);
  } catch (err) {
    return errorResponse(err, "[addresses/PUT]");
  }
};

async function handleUpdate(request: Request, locals: any, params: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  const auth = await getCurrentCustomer(request, db);
  if (!auth.valid) return notAuthenticated();
  const customerId = auth.customer.id;

  const addressId = parseInt(params.id, 10);
  if (!addressId || Number.isNaN(addressId)) {
    return jsonResponse(400, {
      success: false,
      error: "invalid_id",
      message: "Érvénytelen cím-ID.",
    } as AddressMutationResponse);
  }

  // Ownership check
  const existing = await db
    .prepare("SELECT * FROM customer_addresses WHERE id = ? AND customer_id = ?")
    .bind(addressId, customerId)
    .first<AddressRow>();

  if (!existing) {
    return jsonResponse(404, {
      success: false,
      error: "not_found",
      message: "A cím nem található.",
    } as AddressMutationResponse);
  }

  // Bemenet parse
  let body: AddressUpdateRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "invalid_request",
      message: "Érvénytelen kérés.",
    } as AddressMutationResponse);
  }

  // Validáció
  const validation = validateAddress(body);
  if (!validation.valid) {
    return jsonResponse(400, {
      success: false,
      error: validation.error,
      message: validation.message,
    } as AddressMutationResponse);
  }

  const data = validation.data;

  // Default-ok: ha bejelölte ezen a címen, töröljük máshol (más címeken)
  const setDefaultShipping = body.setDefaultShipping === true;
  const setDefaultBilling = body.setDefaultBilling === true;

  if (setDefaultShipping) {
    await db
      .prepare("UPDATE customer_addresses SET is_default_shipping = 0 WHERE customer_id = ? AND id != ? AND is_default_shipping = 1")
      .bind(customerId, addressId)
      .run();
  }
  if (setDefaultBilling) {
    await db
      .prepare("UPDATE customer_addresses SET is_default_billing = 0 WHERE customer_id = ? AND id != ? AND is_default_billing = 1")
      .bind(customerId, addressId)
      .run();
  }

  // UPDATE
  const updateResult = await db
    .prepare(`
      UPDATE customer_addresses
      SET label = ?, recipient_name = ?, phone = ?, street = ?, city = ?,
          postal_code = ?, country = ?, is_shipping = ?, is_billing = ?,
          is_default_shipping = ?, is_default_billing = ?,
          updated_at = datetime('now')
      WHERE id = ? AND customer_id = ?
    `)
    .bind(
      data.label, data.recipientName, data.phone || null,
      data.street, data.city, data.postalCode, data.country,
      data.isShipping, data.isBilling,
      setDefaultShipping ? 1 : (existing.is_default_shipping || 0),
      setDefaultBilling ? 1 : (existing.is_default_billing || 0),
      addressId, customerId,
    )
    .run();

  if (!updateResult.success) {
    return jsonResponse(500, {
      success: false,
      error: "server_error",
      message: "Sikertelen módosítás.",
    } as AddressMutationResponse);
  }

  const updated = await db
    .prepare("SELECT * FROM customer_addresses WHERE id = ?")
    .bind(addressId)
    .first<AddressRow>();

  if (!updated) {
    return jsonResponse(500, {
      success: false,
      error: "server_error",
      message: "Sikertelen lookup.",
    } as AddressMutationResponse);
  }

  return jsonResponse(200, {
    success: true,
    address: addressRowToPublic(updated),
    message: "Cím sikeresen módosítva.",
  } as AddressMutationResponse);
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — töröl
// ─────────────────────────────────────────────────────────────────────────────

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    return await handleDelete(request, locals, params);
  } catch (err) {
    return errorResponse(err, "[addresses/DELETE]");
  }
};

async function handleDelete(request: Request, locals: any, params: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  const auth = await getCurrentCustomer(request, db);
  if (!auth.valid) return notAuthenticated();
  const customerId = auth.customer.id;

  const addressId = parseInt(params.id, 10);
  if (!addressId || Number.isNaN(addressId)) {
    return jsonResponse(400, {
      success: false,
      error: "invalid_id",
      message: "Érvénytelen cím-ID.",
    });
  }

  // Ownership check + DELETE egy lépésben
  const result = await db
    .prepare("DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?")
    .bind(addressId, customerId)
    .run();

  if (!result.success || (result.meta?.changes || 0) === 0) {
    return jsonResponse(404, {
      success: false,
      error: "not_found",
      message: "A cím nem található.",
    });
  }

  return jsonResponse(200, {
    success: true,
    message: "Cím sikeresen törölve.",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function jsonResponse(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function notAuthenticated(): Response {
  return jsonResponse(401, {
    success: false,
    error: "not_authenticated",
    message: "Bejelentkezés szükséges.",
  });
}

function errorResponse(err: unknown, prefix: string): Response {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error(`${prefix} UNHANDLED EXCEPTION:`, errorMessage, err);
  return jsonResponse(500, {
    success: false,
    error: "server_exception",
    message: "Szerverhiba történt.",
    debug: errorMessage,
  });
}
