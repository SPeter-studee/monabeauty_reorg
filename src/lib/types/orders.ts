// src/lib/types/orders.ts
// Sprint 4.5.2 — Rendelés típusok (a /profil/rendelesek oldalhoz)

export type OrderStatus =
  | "pending"      // új, fizetésre vár
  | "paid"         // kifizetve
  | "preparing"    // csomagolás
  | "shipped"      // elküldve
  | "delivered"    // leszállítva
  | "cancelled"    // törölve
  | "refunded";    // visszafizetve

export type ShippingMethod = "foxpost" | "personal";
export type PaymentMethod = "transfer" | "on_delivery" | "simplepay";

// ─────────────────────────────────────────────────────────────────────────────
// D1 ROWS
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderRow {
  id: number;
  order_number: string;
  customer_id: number | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  shipping_method: ShippingMethod;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_zip: string | null;
  shipping_fee_ft: number;
  payment_method: PaymentMethod;
  subtotal_ft: number;
  total_ft: number;
  status: OrderStatus;
  customer_note: string | null;
  // Sprint 4.5 hozzáadás
  discount_code_id: number | null;
  discount_amount_ft: number;
  created_at: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number | null;
  product_slug: string;
  product_name: string;
  product_image_url: string | null;
  qty: number;
  price_at_order_ft: number;
  subtotal_ft: number;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API VIEW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A vendéghez visszaadott rendelés. NEM tartalmazza a guest email/phone-t,
 * mert a vendég már bejelentkezve, ezt nem szükséges duplikálni.
 */
export interface OrderPublic {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;        // magyar nyelvű cimke
  statusColor: "amber" | "green" | "blue" | "gray" | "red";
  shippingMethod: ShippingMethod;
  shippingMethodLabel: string;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingZip: string | null;
  shippingFeeFt: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  subtotalFt: number;
  discountAmountFt: number;
  totalFt: number;
  customerNote: string | null;
  itemCount: number;          // termékek száma (qty összes)
  items: OrderItemPublic[];
  createdAt: string;
  createdAtFormatted: string; // pl. "2026. január 15."
}

export interface OrderItemPublic {
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  qty: number;
  priceAtOrderFt: number;
  subtotalFt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPER FÜGGVÉNYEK
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, { label: string; color: OrderPublic["statusColor"] }> = {
  pending:    { label: "Fizetésre vár",    color: "amber" },
  paid:       { label: "Kifizetve",        color: "blue"  },
  preparing:  { label: "Csomagolás",       color: "blue"  },
  shipped:    { label: "Elküldve",         color: "blue"  },
  delivered:  { label: "Leszállítva",      color: "green" },
  cancelled:  { label: "Törölve",          color: "gray"  },
  refunded:   { label: "Visszafizetve",    color: "gray"  },
};

const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  foxpost:  "FoxPost csomagautomata",
  personal: "Személyes átvétel — Vác",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  transfer:    "Banki átutalás",
  on_delivery: "Utánvét",
  simplepay:   "Bankkártya (SimplePay)",
};

export function orderRowToPublic(
  order: OrderRow,
  items: OrderItemRow[]
): OrderPublic {
  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "gray" as const };

  const itemCount = items.reduce((acc, item) => acc + item.qty, 0);

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    statusLabel: statusInfo.label,
    statusColor: statusInfo.color,
    shippingMethod: order.shipping_method,
    shippingMethodLabel: SHIPPING_LABELS[order.shipping_method] || order.shipping_method,
    shippingAddress: order.shipping_address,
    shippingCity: order.shipping_city,
    shippingZip: order.shipping_zip,
    shippingFeeFt: order.shipping_fee_ft,
    paymentMethod: order.payment_method,
    paymentMethodLabel: PAYMENT_LABELS[order.payment_method] || order.payment_method,
    subtotalFt: order.subtotal_ft,
    discountAmountFt: order.discount_amount_ft || 0,
    totalFt: order.total_ft,
    customerNote: order.customer_note,
    itemCount,
    items: items.map(itemRowToPublic),
    createdAt: order.created_at,
    createdAtFormatted: formatDateHu(order.created_at),
  };
}

export function itemRowToPublic(item: OrderItemRow): OrderItemPublic {
  return {
    productSlug: item.product_slug,
    productName: item.product_name,
    productImageUrl: item.product_image_url,
    qty: item.qty,
    priceAtOrderFt: item.price_at_order_ft,
    subtotalFt: item.subtotal_ft,
  };
}

/**
 * Magyar nyelvű dátum formázás. Pl. "2026. január 15."
 */
function formatDateHu(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}
