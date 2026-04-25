// src/lib/consent.ts
// Cookie consent állapot kezelő — GDPR-konform 3 kategóriás megoldás

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export interface ConsentState {
  necessary: true;          // mindig true, nem kapcsolható ki
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;         // ISO timestamp
  version: number;           // ha változik a policy, újra kell kérdezni
}

const STORAGE_KEY = "mona_consent";
const CURRENT_VERSION = 1;

// ── Lekérés ──────────────────────────────────────────────────────────────
export function getConsent(): ConsentState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    // Ha verzió eltér, érvénytelen — újra kell kérdezni
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasDecided(): boolean {
  return getConsent() !== null;
}

export function isAllowed(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return getConsent()?.[category] === true;
}

// ── Mentés ───────────────────────────────────────────────────────────────
export function setConsent(analytics: boolean, marketing: boolean): void {
  const state: ConsentState = {
    necessary: true,
    analytics,
    marketing,
    decidedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // Ha tiltott — meglévő cookie-k törlése
  cleanupCookies(analytics, marketing);

  // Saját esemény — bárki feliratkozhat rá
  window.dispatchEvent(new CustomEvent("mona-consent-change", { detail: state }));
}

export function acceptAll(): void { setConsent(true, true); }
export function rejectAll(): void { setConsent(false, false); }

// ── Cookie törlés (ha a felhasználó visszavonja a hozzájárulást) ────────
function cleanupCookies(analytics: boolean, marketing: boolean): void {
  const cookiesToDelete: string[] = [];

  if (!analytics) {
    cookiesToDelete.push("_ga", "_gid", "_gat", "_clck", "_clsk");
    // GA cookies _ga_XXXXX prefix-szel jönnek
    document.cookie.split(";").forEach(c => {
      const name = c.split("=")[0].trim();
      if (name.startsWith("_ga_")) cookiesToDelete.push(name);
    });
  }
  if (!marketing) {
    cookiesToDelete.push("_fbp", "fr", "tr");
  }

  cookiesToDelete.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.monastudio.hu`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

// ── Banner megnyitás (footer linkről) ────────────────────────────────────
export function openConsentManager(): void {
  window.dispatchEvent(new CustomEvent("mona-consent-open"));
}
