// src/lib/types/addresses.ts
// Sprint 4.5.3 — Címkönyv típusok

// ─────────────────────────────────────────────────────────────────────────────
// D1 ROW
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressRow {
  id: number;
  customer_id: number;
  label: string;                  // "Otthon", "Munkahely"
  recipient_name: string;
  phone: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;                // ISO 3166-1 alpha-2, default 'HU'
  is_shipping: number;            // 0/1 — használható szállításra
  is_billing: number;             // 0/1 — használható számlázásra
  is_default_shipping: number;    // 0/1 — Sprint 4.5.3
  is_default_billing: number;     // 0/1 — Sprint 4.5.3
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (API válasz)
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressPublic {
  id: number;
  label: string;
  recipientName: string;
  phone: string | null;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isShipping: boolean;
  isBilling: boolean;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

export function addressRowToPublic(row: AddressRow): AddressPublic {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    street: row.street,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country,
    isShipping: row.is_shipping === 1,
    isBilling: row.is_billing === 1,
    isDefaultShipping: row.is_default_shipping === 1,
    isDefaultBilling: row.is_default_billing === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressCreateRequest {
  label: string;
  recipientName: string;
  phone?: string | null;
  street: string;
  city: string;
  postalCode: string;
  country?: string;        // default "HU"
  isShipping?: boolean;    // default true
  isBilling?: boolean;     // default true
  setDefaultShipping?: boolean;
  setDefaultBilling?: boolean;
}

export interface AddressUpdateRequest extends AddressCreateRequest {
  // semmi extra mező — id-t URL paraméterben kapjuk
}

export interface SetDefaultRequest {
  type: "shipping" | "billing";
  addressId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// VÁLASZ TÍPUSOK
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressListResponse {
  success: boolean;
  addresses?: AddressPublic[];
  error?: string;
  message?: string;
}

export interface AddressMutationResponse {
  success: boolean;
  address?: AddressPublic;
  error?: string;
  message?: string;
  debug?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDÁCIÓK
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_ADDRESSES_PER_CUSTOMER = 10;

/**
 * Cím-mező validáció — kötelező mezők, max length-ek.
 * Visszaadja a sanitizálót objektumot vagy hibakódot.
 */
export type AddressValidationResult =
  | {
      valid: true;
      data: {
        label: string;
        recipientName: string;
        phone: string | null;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        isShipping: number;
        isBilling: number;
      };
    }
  | {
      valid: false;
      error: string;
      message: string;
    };

export function validateAddress(req: AddressCreateRequest): AddressValidationResult {
  const label = sanitize(req.label, 50);
  if (!label) return invalid("label_required", "A címke megadása kötelező.");

  const recipientName = sanitize(req.recipientName, 100);
  if (!recipientName) return invalid("recipient_required", "A címzett neve kötelező.");

  const street = sanitize(req.street, 200);
  if (!street) return invalid("street_required", "Az utca és házszám kötelező.");

  const city = sanitize(req.city, 100);
  if (!city) return invalid("city_required", "A város megadása kötelező.");

  const postalCode = sanitize(req.postalCode, 10);
  if (!postalCode) return invalid("postal_code_required", "Az irányítószám kötelező.");

  const country = sanitize(req.country, 2) || "HU";
  if (country !== "HU") return invalid("country_unsupported", "Jelenleg csak Magyarországi címek támogatottak.");

  const phone = sanitize(req.phone, 20);

  // Legalább az egyiknek igaznak kell lennie (különben minek tárolod?)
  const isShipping = req.isShipping !== false ? 1 : 0;
  const isBilling = req.isBilling !== false ? 1 : 0;
  if (!isShipping && !isBilling) {
    return invalid("at_least_one_use", "A címnek legalább szállításra vagy számlázásra használhatónak kell lennie.");
  }

  return {
    valid: true,
    data: { label, recipientName, phone, street, city, postalCode, country, isShipping, isBilling },
  };
}

function sanitize(value: string | null | undefined, maxLength: number): string {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  return trimmed.slice(0, maxLength);
}

function invalid(error: string, message: string): AddressValidationResult {
  return { valid: false, error, message };
}
