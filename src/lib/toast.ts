// src/lib/toast.ts
// Toast notification — kosárba tétel és más visszajelzések

export type ToastType = "success" | "info" | "error";

export interface ToastDetail {
  type?: ToastType;
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  duration?: number;     // ms, default 4000
}

export function showToast(detail: ToastDetail): void {
  window.dispatchEvent(new CustomEvent<ToastDetail>("mona-toast", { detail }));
}

// ── Praktikus shortcut-ok ────────────────────────────────────────────────
export function toastCartAdd(productName: string, price: number): void {
  showToast({
    type: "success",
    title: "Kosárba helyezve",
    message: `${productName} · ${price.toLocaleString("hu-HU")} Ft`,
    actionLabel: "Kosárhoz",
    actionHref: "/kosar",
  });
}

export function toastError(message: string): void {
  showToast({ type: "error", title: "Hiba történt", message });
}

export function toastSuccess(title: string, message?: string): void {
  showToast({ type: "success", title, message });
}
