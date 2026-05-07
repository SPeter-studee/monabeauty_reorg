// src/lib/types/profile.ts
// Sprint 4.5 — Profil oldalak + discount code típusok

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL ADATOK FRISSÍTÉS
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileUpdateRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  // Email és jelszó NEM itt — külön endpointokon (Sprint 4.5.5/4.5.6)

  // Sprint 4.5.3.y v0.9.27 — B2B Cégadatok (opcionális, csak ha customerType !== "private")
  customerType?: "private" | "company_hu" | "company_eu";
  companyName?: string | null;
  taxNumber?: string | null;
  euVatNumber?: string | null;
  companyCountry?: string | null;
  companyZip?: string | null;
  companyCity?: string | null;
  companyCounty?: string | null;
  companyStreet?: string | null;
}

// Sprint 4.5.3.y — B2B validációs hibák
export type B2BValidationError =
  | "company_name_required"
  | "tax_number_required"
  | "tax_number_format_invalid"
  | "eu_vat_number_required"
  | "eu_vat_number_format_invalid"
  | "company_country_required"
  | "company_country_invalid"
  | "company_zip_required"
  | "company_city_required"
  | "company_street_required"
  | "company_county_required";  // HU only

export interface ProfileUpdateResponseError extends ProfileUpdateResponse {
  validationErrors?: B2BValidationError[];
}

export interface ProfileUpdateResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOUNT CODE
// ─────────────────────────────────────────────────────────────────────────────

export type DiscountCodeType = "welcome" | "promo" | "birthday";

export interface DiscountCodeRow {
  id: number;
  code: string;
  customer_id: number | null;
  type: DiscountCodeType;
  discount_percent: number | null;
  discount_amount_ft: number | null;
  min_order_ft: number | null;
  max_uses: number;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  used_at: string | null;
  used_order_id: number | null;
  created_at: string;
}

export interface DiscountCodePublic {
  code: string;
  type: DiscountCodeType;
  discountPercent: number | null;
  discountAmountFt: number | null;
  minOrderFt: number | null;
  validUntil: string | null;
  isUsed: boolean;
}

export function discountCodeRowToPublic(row: DiscountCodeRow): DiscountCodePublic {
  return {
    code: row.code,
    type: row.type,
    discountPercent: row.discount_percent,
    discountAmountFt: row.discount_amount_ft,
    minOrderFt: row.min_order_ft,
    validUntil: row.valid_until,
    isUsed: row.used_at !== null || row.uses_count >= row.max_uses,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOUNT VALIDATION (Sprint 4.5.7-ben checkout-on)
// ─────────────────────────────────────────────────────────────────────────────

export type DiscountValidationResult =
  | { valid: true; discountFt: number; code: DiscountCodePublic }
  | {
      valid: false;
      reason:
        | "not_found"
        | "expired"
        | "already_used"
        | "min_order_not_met"
        | "wrong_customer"
        | "not_yet_valid";
      message: string;
    };
