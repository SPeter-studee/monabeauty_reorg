// src/pages/api/profile/orders.ts
// Sprint 4.5.2 — Vendég rendelési előzményei (auth required)
//
// GET /api/profile/orders
// Visszaadja a logged-in vendég összes rendelését dátum szerint csökkenően,
// minden rendeléshez a tételeket is.
//
// Pagination: most NEM (Sprint 4.5.x-ben jöhet ha sok rendelés lesz).
// A vendégeknek várhatóan 0-50 rendelése van max — egy lekérés bőven elfér.

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";
import {
  orderRowToPublic,
  type OrderRow,
  type OrderItemRow,
  type OrderPublic,
} from "@/lib/types/orders";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    return await handleListOrders(request, locals);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[profile/orders] UNHANDLED EXCEPTION:", errorMessage, err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "server_exception",
        message: "Szerverhiba történt.",
        debug: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

async function handleListOrders(request: Request, locals: any): Promise<Response> {
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
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const customerId = authResult.customer.id;

  // 2. Lekérjük a vendég rendeléseit
  const ordersResult = await db
    .prepare(`
      SELECT * FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `)
    .bind(customerId)
    .all<OrderRow>();

  const orders = ordersResult.results || [];

  if (orders.length === 0) {
    return new Response(
      JSON.stringify({ success: true, orders: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Lekérjük az összes order_items-et egyszerre (BATCH lookup)
  const orderIds = orders.map(o => o.id);
  const placeholders = orderIds.map(() => "?").join(",");
  const itemsResult = await db
    .prepare(`
      SELECT * FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY id ASC
    `)
    .bind(...orderIds)
    .all<OrderItemRow>();

  const allItems = itemsResult.results || [];

  // 4. Csoportosítás order_id szerint
  const itemsByOrderId = new Map<number, OrderItemRow[]>();
  for (const item of allItems) {
    if (!itemsByOrderId.has(item.order_id)) {
      itemsByOrderId.set(item.order_id, []);
    }
    itemsByOrderId.get(item.order_id)!.push(item);
  }

  // 5. Konvertálás public view-vé
  const publicOrders: OrderPublic[] = orders.map(order => {
    const items = itemsByOrderId.get(order.id) || [];
    return orderRowToPublic(order, items);
  });

  return new Response(
    JSON.stringify({ success: true, orders: publicOrders }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
