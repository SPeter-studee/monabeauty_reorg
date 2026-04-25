// src/lib/cart.ts
// Kosár logika — localStorage alapú, server szinkron később

import { toastCartAdd } from "./toast";

export interface CartItem {
  id: number;
  sku: string;
  name: string;
  price: number;        // Ft
  qty: number;
  imageUrl?: string;
  variant?: string;     // pl. "50ml"
}

const STORAGE_KEY = "mona_cart";

// ── Lekérés ──────────────────────────────────────────────────────────────
export function getCart(): CartItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// ── Mentés ───────────────────────────────────────────────────────────────
function saveCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("mona-cart-update"));
}

// ── Kosárba helyezés ────────────────────────────────────────────────────
export function addToCart(item: Omit<CartItem, "qty">, qty = 1): void {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id && i.variant === item.variant);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  saveCart(cart);
  toastCartAdd(item.name, item.price * qty);
}

// ── Mennyiség módosítás ─────────────────────────────────────────────────
export function updateQuantity(id: number, qty: number, variant?: string): void {
  const cart = getCart();
  const item = cart.find(i => i.id === id && i.variant === variant);
  if (!item) return;

  if (qty <= 0) {
    removeFromCart(id, variant);
    return;
  }

  item.qty = qty;
  saveCart(cart);
}

// ── Eltávolítás ─────────────────────────────────────────────────────────
export function removeFromCart(id: number, variant?: string): void {
  const cart = getCart().filter(i => !(i.id === id && i.variant === variant));
  saveCart(cart);
}

// ── Kosár ürítése ───────────────────────────────────────────────────────
export function clearCart(): void {
  saveCart([]);
}
