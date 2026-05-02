// src/pages/api/profile/addresses/index.ts
// Sprint 4.5.3 — Címkönyv: lista (GET) + új cím (POST)

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";
import {
  addressRowToPublic,
  validateAddress,
  MAX_ADDRESSES_PER_CUSTOMER,
  type AddressRow,
  type AddressCreateRequest,
  type AddressListResponse,
  type AddressMutationResponse,
} from "@/lib/types/addresses";

// ─────────────────────────────────────────────────────────────────────────────
// GET — lista
// ─────────────────────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    return await handleList(request, locals);
  } catch (err) {
    return errorResponse(err, "[addresses/GET]");
  }
};

async function handleList(request: Request, locals: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  const auth = await getCurrentCustomer(request, db);
  if (!auth.valid) return notAuthenticated();

  const result = await db
    .prepare(`
      SELECT * FROM customer_addresses
      WHERE customer_id = ?
      ORDER BY is_default_shipping DESC, is_default_billing DESC, created_at ASC
    `)
    .bind(auth.customer.id)
    .all<AddressRow>();

  const addresses = (result.results || []).map(addressRowToPublic);

  return jsonResponse(200, {
    success: true,
    addresses,
  } as AddressListResponse);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — új cím létrehozás
// ─────────────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    return await handleCreate(request, locals);
  } catch (err) {
    return errorResponse(err, "[addresses/POST]");
  }
};

async function handleCreate(request: Request, locals: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  const auth = await getCurrentCustomer(request, db);
  if (!auth.valid) return notAuthenticated();
  const customerId = auth.customer.id;

  // Bemenet parse
  let body: AddressCreateRequest;
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

  // Limit ellenőrzés
  const countResult = await db
    .prepare("SELECT COUNT(*) as cnt FROM customer_addresses WHERE customer_id = ?")
    .bind(customerId)
    .first<{ cnt: number }>();

  const currentCount = countResult?.cnt || 0;
  if (currentCount >= MAX_ADDRESSES_PER_CUSTOMER) {
    return jsonResponse(400, {
      success: false,
      error: "address_limit_reached",
      message: `Maximum ${MAX_ADDRESSES_PER_CUSTOMER} cím tárolható egy fiókban. Töröld a régieket az új hozzáadásához.`,
    } as AddressMutationResponse);
  }

  const data = validation.data;

  // Default-ok kezelés:
  // Ha a vendég az új címet default-tá akarja tenni, először null-old a meglévőt
  const isFirst = currentCount === 0;
  const setDefaultShipping = body.setDefaultShipping === true || (isFirst && data.isShipping === 1);
  const setDefaultBilling = body.setDefaultBilling === true || (isFirst && data.isBilling === 1);

  if (setDefaultShipping) {
    await db
      .prepare("UPDATE customer_addresses SET is_default_shipping = 0 WHERE customer_id = ? AND is_default_shipping = 1")
      .bind(customerId)
      .run();
  }
  if (setDefaultBilling) {
    await db
      .prepare("UPDATE customer_addresses SET is_default_billing = 0 WHERE customer_id = ? AND is_default_billing = 1")
      .bind(customerId)
      .run();
  }

  // INSERT
  const insertResult = await db
    .prepare(`
      INSERT INTO customer_addresses (
        customer_id, label, recipient_name, phone, street, city, postal_code, country,
        is_shipping, is_billing, is_default_shipping, is_default_billing
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      customerId,
      data.label,
      data.recipientName,
      data.phone || null,
      data.street,
      data.city,
      data.postalCode,
      data.country,
      data.isShipping,
      data.isBilling,
      setDefaultShipping ? 1 : 0,
      setDefaultBilling ? 1 : 0,
    )
    .run();

  if (!insertResult.success) {
    console.error("[addresses/POST] INSERT failed:", insertResult);
    return jsonResponse(500, {
      success: false,
      error: "server_error",
      message: "Sikertelen mentés.",
    } as AddressMutationResponse);
  }

  const newId = insertResult.meta.last_row_id as number;
  const created = await db
    .prepare("SELECT * FROM customer_addresses WHERE id = ?")
    .bind(newId)
    .first<AddressRow>();

  if (!created) {
    return jsonResponse(500, {
      success: false,
      error: "server_error",
      message: "Sikertelen lookup mentés után.",
    } as AddressMutationResponse);
  }

  return jsonResponse(201, {
    success: true,
    address: addressRowToPublic(created),
    message: "Cím sikeresen mentve.",
  } as AddressMutationResponse);
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
