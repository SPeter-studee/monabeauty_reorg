// src/lib/cart.ts
// Kosár logika — localStorage alapú vendég módban (Sprint 3).
// Sprint 4-ben D1 sync regisztrált felhasználóknak.
//
// Az események:
//   - "mona-cart-update" — minden módosításnál (Header counter, Drawer újrarender)
//   - "mona-cart-open"   — kosár drawer megnyitása program szerint

import type {
  CartItem,
  CartSummary,
  ShippingMethod,
  Product,
} from "./types/shop";
import {
  calculateShipping,
  effectivePrice,
  FREE_SHIPPING_THRESHOLD_FT,
} from "./types/shop";
import { toastCartAdd } from "./toast";

const STORAGE_KEY = "mona_cart_v2";          // v2 — séma változás miatt új kulcs
const SHIPPING_KEY = "mona_cart_shipping";

// ─────────────────────────────────────────────────────────────────────────────
// LEKÉRÉS
// ─────────────────────────────────────────────────────────────────────────────

export function getCart(): CartItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validáció: tömb legyen, és minden item-nek legyen productId
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i: any): i is CartItem =>
        typeof i.productId === "number" &&
        typeof i.slug === "string" &&
        typeof i.qty === "number" &&
        i.qty > 0
    );
  } catch {
    return [];
  }
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function getCartSubtotal(): number {
  return getCart().reduce((sum, item) => sum + item.priceAtAddFt * item.qty, 0);
}

/**
 * Aktuális szállítási mód a localStorage-ből.
 * Default: foxpost (a legtöbb vásárló).
 */
export function getShippingMethod(): ShippingMethod {
  if (typeof localStorage === "undefined") return "foxpost";
  const value = localStorage.getItem(SHIPPING_KEY);
  if (value === "personal" || value === "foxpost") return value;
  return "foxpost";
}

export function setShippingMethod(method: ShippingMethod): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SHIPPING_KEY, method);
  window.dispatchEvent(new CustomEvent("mona-cart-update"));
}

/**
 * Teljes kosár összegzés — szállítási költséggel együtt.
 */
export function getCartSummary(): CartSummary {
  const items = getCart();
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotalFt = items.reduce((sum, i) => sum + i.priceAtAddFt * i.qty, 0);
  const shippingMethod = getShippingMethod();
  const shippingFt = calculateShipping(subtotalFt, shippingMethod);
  const totalFt = subtotalFt + shippingFt;
  const freeShippingEligible = subtotalFt >= FREE_SHIPPING_THRESHOLD_FT;

  return {
    items,
    itemCount,
    subtotalFt,
    shippingFt,
    totalFt,
    shippingMethod,
    freeShippingEligible,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTÉS + ESEMÉNYKEZELÉS
// ─────────────────────────────────────────────────────────────────────────────

function saveCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("mona-cart-update"));
}

// ─────────────────────────────────────────────────────────────────────────────
// KOSÁRBA HELYEZÉS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Termék hozzáadása a kosárhoz.
 * Ha már van ugyanaz a termék, a mennyiséget összevonjuk.
 * Ha az új mennyiség > stockQty, korlátozzuk és toast-ban jelezzük.
 *
 * @param product — a Product objektum (legalább a kötelező mezők)
 * @param qty — hány darab kerüljön be (default 1)
 */
export function addToCart(
  product: Pick<Product, "id" | "slug" | "name" | "stockQty"> & {
    priceFt: number;
    salePriceFt?: number | null;
    saleStartsAt?: string | null;
    saleEndsAt?: string | null;
    images?: Array<{ url: string; isPrimary: boolean }>;
    brand?: { name: string } | null;
  },
  qty = 1
): { success: boolean; capped?: boolean } {
  const cart = getCart();
  const primaryImage =
    product.images?.find(i => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
  const price = effectivePrice(product as any);

  const existing = cart.find(i => i.productId === product.id);
  let capped = false;

  if (existing) {
    const newQty = existing.qty + qty;
    if (newQty > product.stockQty) {
      // Készlethiány — korlátozzuk a maximumra
      existing.qty = product.stockQty;
      capped = true;
    } else {
      existing.qty = newQty;
    }
    // A maxQty frissül (a készlet változhatott)
    existing.maxQty = product.stockQty;
  } else {
    const initialQty = Math.min(qty, product.stockQty);
    if (initialQty < qty) capped = true;
    if (initialQty <= 0) return { success: false, capped: true };

    cart.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: primaryImage,
      priceAtAddFt: price,
      qty: initialQty,
      maxQty: product.stockQty,
      brandName: product.brand?.name,
    });
  }

  saveCart(cart);
  toastCartAdd(product.name, price * qty);

  return { success: true, capped };
}

// ─────────────────────────────────────────────────────────────────────────────
// MENNYISÉG MÓDOSÍTÁS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mennyiség frissítés. Ha qty <= 0, törli a terméket.
 * Ha qty > maxQty, a maximumra korlátozódik.
 */
export function updateQuantity(productId: number, qty: number): void {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }

  item.qty = Math.min(qty, item.maxQty);
  saveCart(cart);
}

// ─────────────────────────────────────────────────────────────────────────────
// ELTÁVOLÍTÁS
// ─────────────────────────────────────────────────────────────────────────────

export function removeFromCart(productId: number): void {
  const cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
}

// ─────────────────────────────────────────────────────────────────────────────
// KOSÁR ÜRÍTÉS (pl. sikeres rendelés után)
// ─────────────────────────────────────────────────────────────────────────────

export function clearCart(): void {
  saveCart([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWER NYITÁS — programmatic
// ─────────────────────────────────────────────────────────────────────────────

export function openCartDrawer(): void {
  window.dispatchEvent(new CustomEvent("mona-cart-open"));
}
