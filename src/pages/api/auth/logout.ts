// src/pages/api/auth/logout.ts
// Sprint 4.1 — Kijelentkezés
//
// Flow:
//   1. Session cookie kiolvasás
//   2. Session törlés a customer_sessions táblából (ha létezik)
//   3. Cookie clear (Max-Age=0) válaszban
//
// Idempotens — akkor is sikeres, ha a session már nem létezett.

import type { APIRoute } from "astro";
import {
  getSessionCookie,
  deleteSession,
  buildClearSessionCookie,
} from "@/lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as any;
  const db: D1Database = env.DB;

  const sessionId = getSessionCookie(request);
  if (sessionId) {
    try {
      await deleteSession(db, sessionId);
    } catch (err) {
      // Idempotens — nem hiba ha nem volt
      console.warn("[logout] delete session warning:", err);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildClearSessionCookie(),
    },
  });
};
