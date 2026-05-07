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

  // 3. Validáció — alapadatok
  const firstName = sanitize(body.firstName, 50);
  const lastName = sanitize(body.lastName, 50);
  const phone = sanitize(body.phone, 20);

  // ── Sprint 4.5.3.y v0.9.27 — B2B Cégadatok validáció ─────────────────────
  const customerType = body.customerType || "private";
  if (!["private", "company_hu", "company_eu"].includes(customerType)) {
    return jsonResponse(400, {
      success: false,
      error: "invalid_request",
      message: "Érvénytelen vásárló-típus.",
    });
  }

  const companyName = sanitize(body.companyName, 200);
  const taxNumber = sanitize(body.taxNumber, 20);
  const euVatNumber = sanitize(body.euVatNumber, 20);
  const companyCountry = sanitize(body.companyCountry, 2);  // ISO 2-betű
  const companyZip = sanitize(body.companyZip, 10);
  const companyCity = sanitize(body.companyCity, 100);
  const companyCounty = sanitize(body.companyCounty, 100);
  const companyStreet = sanitize(body.companyStreet, 200);

  // B2B-specifikus validáció ha cég
  const validationErrors: string[] = [];

  if (customerType === "company_hu" || customerType === "company_eu") {
    if (!companyName) validationErrors.push("company_name_required");
    if (!companyCountry) validationErrors.push("company_country_required");
    if (!companyZip) validationErrors.push("company_zip_required");
    if (!companyCity) validationErrors.push("company_city_required");
    if (!companyStreet) validationErrors.push("company_street_required");
  }

  if (customerType === "company_hu") {
    if (!taxNumber) {
      validationErrors.push("tax_number_required");
    } else if (!/^\d{8}-\d-\d{2}$/.test(taxNumber)) {
      validationErrors.push("tax_number_format_invalid");
    }
    // HU-cég kötelező megye
    if (!companyCounty) validationErrors.push("company_county_required");
    // Ország kötelezően HU
    if (companyCountry && companyCountry.toUpperCase() !== "HU") {
      validationErrors.push("company_country_invalid");
    }
  }

  if (customerType === "company_eu") {
    if (!euVatNumber) {
      validationErrors.push("eu_vat_number_required");
    } else if (!/^[A-Z]{2}\d{8,12}$/.test(euVatNumber)) {
      validationErrors.push("eu_vat_number_format_invalid");
    }
    // EU országkód: ISO 2-betűs, nem lehet HU (akkor company_hu lenne)
    if (companyCountry) {
      const cc = companyCountry.toUpperCase();
      if (!/^[A-Z]{2}$/.test(cc) || cc === "HU") {
        validationErrors.push("company_country_invalid");
      }
    }
  }

  if (validationErrors.length > 0) {
    return jsonResponse(400, {
      success: false,
      error: "validation_failed",
      message: "Hiányzó vagy érvénytelen cégadatok.",
      validationErrors,
    } as any);
  }

  // Magán-vásárlónál a cégadatokat NULL-ra állítjuk (cleanup)
  const isPrivate = customerType === "private";

  // 4. UPDATE — minden mező egyben
  const updateResult = await db
    .prepare(`
      UPDATE customers
      SET first_name = ?,
          last_name = ?,
          phone = ?,
          customer_type = ?,
          company_name = ?,
          tax_number = ?,
          eu_vat_number = ?,
          company_country = ?,
          company_zip = ?,
          company_city = ?,
          company_county = ?,
          company_street = ?
      WHERE id = ?
    `)
    .bind(
      firstName,
      lastName,
      phone,
      customerType,
      isPrivate ? null : companyName,
      isPrivate || customerType === "company_eu" ? null : taxNumber,
      isPrivate || customerType === "company_hu" ? null : (euVatNumber ? euVatNumber.toUpperCase() : null),
      isPrivate ? null : (companyCountry ? companyCountry.toUpperCase() : null),
      isPrivate ? null : companyZip,
      isPrivate ? null : companyCity,
      isPrivate || customerType === "company_eu" ? null : companyCounty,
      isPrivate ? null : companyStreet,
      customerId,
    )
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
