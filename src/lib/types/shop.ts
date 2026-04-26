// src/lib/types/shop.ts
// Webshop adatmodell típusok — Sprint 3

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  heroImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  country: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  ingredients: string | null;
  usageInstructions: string | null;
  monikaRecommends: string | null;

  // Árazás
  priceFt: number;
  salePriceFt: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;

  // Készlet
  stockQty: number;
  lowStockThreshold: number;

  // Kapcsolatok
  categoryId: number | null;
  brandId: number | null;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];

  // Méret
  sizeValue: number | null;
  sizeUnit: string | null;

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;

  // Megjelölések
  isFeatured: boolean;
  isActive: boolean;
  isNew: boolean;
  isRecommended: boolean;

  // Opcionális szűrőkhöz
  skinTypes: string[] | null;
  skinConcerns: string[] | null;

  // Időbélyegek
  createdAt: string;
  updatedAt: string;
}

/**
 * Effektív ár — figyelembe véve hogy aktív akcióban van-e a termék.
 * @returns aktuális eladási ár forintban
 */
export function effectivePrice(product: Pick<Product, "priceFt" | "salePriceFt" | "saleStartsAt" | "saleEndsAt">): number {
  if (product.salePriceFt === null) return product.priceFt;

  const now = new Date();

  if (product.saleStartsAt) {
    const starts = new Date(product.saleStartsAt);
    if (now < starts) return product.priceFt;
  }

  if (product.saleEndsAt) {
    const ends = new Date(product.saleEndsAt);
    if (now > ends) return product.priceFt;
  }

  return product.salePriceFt;
}

/**
 * Aktív akcióban van-e most a termék?
 */
export function isOnSale(product: Pick<Product, "priceFt" | "salePriceFt" | "saleStartsAt" | "saleEndsAt">): boolean {
  return effectivePrice(product) < product.priceFt;
}

/**
 * Megtakarítás százalékban (csak akciós termékre).
 */
export function discountPercent(product: Pick<Product, "priceFt" | "salePriceFt" | "saleStartsAt" | "saleEndsAt">): number {
  const eff = effectivePrice(product);
  if (eff >= product.priceFt) return 0;
  return Math.round(((product.priceFt - eff) / product.priceFt) * 100);
}

/**
 * Készlet státusz a megjelenítéshez.
 */
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function stockStatus(product: Pick<Product, "stockQty" | "lowStockThreshold">): StockStatus {
  if (product.stockQty <= 0) return "out_of_stock";
  if (product.stockQty <= product.lowStockThreshold) return "low_stock";
  return "in_stock";
}

// ─────────────────────────────────────────────────────────────────────────────
// Kosár (localStorage-alapú vendég módban — Sprint 3)
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceAtAddFt: number;          // amikor kosárba került
  qty: number;
  maxQty: number;                // készlet a kosárba tétel idejére
  brandName?: string;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;             // összes db
  subtotalFt: number;            // termékek
  shippingFt: number;            // szállítási díj
  totalFt: number;               // subtotal + shipping
  shippingMethod: ShippingMethod;
  freeShippingEligible: boolean; // 20.000 Ft fölött ingyenes
}

export type ShippingMethod = "foxpost" | "personal";

export const SHIPPING_OPTIONS = {
  foxpost: { ft: 1990, label: "FoxPost csomagautomata" },
  personal: { ft: 0, label: "Személyes átvétel — Vác, Zrínyi M. u. 3." },
} as const;

export const FREE_SHIPPING_THRESHOLD_FT = 20000;

/**
 * Szállítási díj kiszámítása.
 */
export function calculateShipping(
  subtotalFt: number,
  method: ShippingMethod
): number {
  if (method === "personal") return 0;
  if (subtotalFt >= FREE_SHIPPING_THRESHOLD_FT) return 0;
  return SHIPPING_OPTIONS[method].ft;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendelés
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "transfer" | "on_delivery" | "simplepay";

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;

  // Vendég adatok
  guestName: string;
  guestEmail: string;
  guestPhone: string;

  // Szállítás
  shippingMethod: ShippingMethod;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingZip: string | null;
  shippingFeeFt: number;

  // Pénzügyi
  paymentMethod: PaymentMethod;
  subtotalFt: number;
  totalFt: number;

  // Státusz
  status: OrderStatus;

  // Megjegyzések
  customerNote: string | null;
  adminNote: string | null;

  // Időbélyegek
  createdAt: string;
  updatedAt: string;

  // Kapcsolódó tételek
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  qty: number;
  priceAtOrderFt: number;
  subtotalFt: number;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Szűrők
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductFilter {
  categorySlug?: string;
  brandSlug?: string;
  minPriceFt?: number;
  maxPriceFt?: number;
  isFeatured?: boolean;
  isOnSale?: boolean;
  search?: string;          // keresés név alapján
  sortBy?: ProductSort;
  page?: number;
  perPage?: number;
}

export type ProductSort =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "popular"               // Sprint 5+ — view count alapján
  | "recommended";          // Mónika ajánlja
