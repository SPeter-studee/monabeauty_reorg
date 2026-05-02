// src/pages/api/profile/orders/[orderNumber].ts
// Sprint 4.5.x — Egy rendelés részletei (a /profil/rendelesek/[orderNumber] oldalhoz)
//
// GET /api/profile/orders/MS-2026-0001
// Visszaadja a megadott rendelést a tételekkel együtt, ownership check.

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";
import {
  orderRowToPublic,
  type OrderRow,
  type OrderItemRow,
} from "@/lib/types/orders";

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    return await handleGetOrder(request, locals, params);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[profile/orders/[orderNumber]] UNHANDLED EXCEPTION:", errorMessage, err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "server_exception",
        message: "Szerverhiba történt.",
        debug: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

async function handleGetOrder(request: Request, locals: any, params: any): Promise<Response> {
  const env = (locals.runtime?.env || {}) as any;
  const db: D1Database = env.DB;

  // 1. Auth check
  const authResult = await getCurrentCustomer(request, db);
  if (!authResult.valid) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "not_authenticated",
        message: "Bejelentkezés szükséges.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const customerId = authResult.customer.id;
  const customerEmail = authResult.customer.email;
  const orderNumber = String(params.orderNumber || "").trim();

  if (!orderNumber) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "invalid_order_number",
        message: "Érvénytelen rendelés azonosító.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. A rendelés lekérdezése — ownership ellenőrzés a customer_id VAGY guest_email egyezéssel
  // (lásd: v0.9.8 backfill + fallback logika)
  const order = await db
    .prepare(`
      SELECT * FROM orders
      WHERE order_number = ?
        AND (customer_id = ? OR (customer_id IS NULL AND guest_email = ?))
      LIMIT 1
    `)
    .bind(orderNumber, customerId, customerEmail)
    .first<OrderRow>();

  if (!order) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "not_found",
        message: "A rendelés nem található.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. A rendelés tételei
  const itemsResult = await db
    .prepare(`
      SELECT * FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `)
    .bind(order.id)
    .all<OrderItemRow>();

  const items = itemsResult.results || [];
  const orderPublic = orderRowToPublic(order, items);

  return new Response(
    JSON.stringify({
      success: true,
      order: orderPublic,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
