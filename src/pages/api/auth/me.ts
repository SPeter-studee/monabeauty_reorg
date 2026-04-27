// src/pages/api/auth/me.ts
// Sprint 4.1 — Current user lookup
//
// A frontend használhatja:
//   - Header rendering: bejelentkezve vagy sem ("Belépés" vs. avatar + dropdown)
//   - Profil oldal védett: ha 401 → redirect /belepes
//   - Cart drawer / checkout: prefill címek a logged-in vendég profile-jából
//
// Sosem ad vissza érzékeny adatot (password_hash, OAuth tokens) — csak a
// CustomerPublic shape-et.

import type { APIRoute } from "astro";
import { getCurrentCustomer } from "@/lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as any;
  const db: D1Database = env.DB;

  const result = await getCurrentCustomer(request, db);

  if (!result.valid) {
    return new Response(
      JSON.stringify({
        authenticated: false,
        reason: result.reason,
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      authenticated: true,
      customer: result.customer,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
