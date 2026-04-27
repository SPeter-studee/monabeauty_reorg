// src/lib/auth-state.ts
// Sprint 4.2 — Kliens-oldali auth state
//
// Architektúra (analóg cart.ts-szel):
//   - Singleton in-memory state (page reload törli, mindig server check-eli)
//   - "mona-auth-update" custom event a state változásokhoz
//   - Komponensek (Header, AuthModal, profil oldalak) erre subscribe-olnak
//
// A *valódi* login state mindig a server-side cookie-ban van. Ez a kliens
// oldali state csak optimalizált cache: az első page load-on egy GET /api/auth/me
// hívás a tényleges állapotot lekéri, és ettől kezdve cache-ben van.
//
// Sosem küldjünk credentials-et ebből a fájlból — minden auth művelet a server API-n
// keresztül megy (POST /api/auth/login, /register, /logout).

import type { CustomerPublic } from "./types/auth";

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
  status: "loading" | "authenticated" | "anonymous";
  customer: CustomerPublic | null;
}

let state: AuthState = {
  status: "loading",
  customer: null,
};

const AUTH_EVENT = "mona-auth-update";

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function getAuthState(): Readonly<AuthState> {
  return state;
}

export function isAuthenticated(): boolean {
  return state.status === "authenticated";
}

export function getCurrentUser(): CustomerPublic | null {
  return state.customer;
}

/**
 * Initial fetch: GET /api/auth/me
 * Csak az első page load-on, vagy ha gyanús hogy a server kileptetett.
 */
export async function refreshAuthState(): Promise<AuthState> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      headers: { "Cache-Control": "no-cache" },
    });

    if (res.status === 200) {
      const data = await res.json() as { authenticated: true; customer: CustomerPublic };
      setState({ status: "authenticated", customer: data.customer });
    } else {
      setState({ status: "anonymous", customer: null });
    }
  } catch (err) {
    console.warn("[auth-state] refresh failed:", err);
    setState({ status: "anonymous", customer: null });
  }

  return state;
}

/**
 * Login után — vagy register után — a backend visszaadja a customer-t.
 * Ez az API hívás után setState-eli a kliens oldalt.
 */
export function setAuthenticated(customer: CustomerPublic): void {
  setState({ status: "authenticated", customer });
}

/**
 * Logout után — a backend törli a session-t, a kliens oldalt is törölni kell.
 */
export function setAnonymous(): void {
  setState({ status: "anonymous", customer: null });
}

// ─────────────────────────────────────────────────────────────────────────────
// State management + event dispatch
// ─────────────────────────────────────────────────────────────────────────────

function setState(newState: AuthState): void {
  state = newState;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: state }));
}

/**
 * Subscribe a state változásokra. Cleanup-ot ad vissza a felhasználónak.
 *
 * Használat:
 *   const unsubscribe = subscribeAuthState((state) => {
 *     console.log("Auth changed:", state);
 *   });
 *   // Később: unsubscribe();
 */
export function subscribeAuthState(handler: (state: AuthState) => void): () => void {
  const wrapped = (e: Event) => {
    const ce = e as CustomEvent<AuthState>;
    handler(ce.detail);
  };
  window.addEventListener(AUTH_EVENT, wrapped);
  // Azonnali invocation a current state-tel
  handler(state);
  return () => window.removeEventListener(AUTH_EVENT, wrapped);
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal open/close — events
// ─────────────────────────────────────────────────────────────────────────────

const MODAL_OPEN_EVENT = "mona-auth-modal-open";
const MODAL_CLOSE_EVENT = "mona-auth-modal-close";

export type AuthModalView = "login" | "register";

/**
 * Az AuthModal megnyitása valamelyik nézetben.
 * Bárki hívhatja: Header.astro "Belépés" gomb, ProductCard kívánságlista, stb.
 */
export function openAuthModal(view: AuthModalView = "login"): void {
  window.dispatchEvent(new CustomEvent(MODAL_OPEN_EVENT, { detail: { view } }));
}

export function closeAuthModal(): void {
  window.dispatchEvent(new Event(MODAL_CLOSE_EVENT));
}

export const AUTH_MODAL_OPEN_EVENT = MODAL_OPEN_EVENT;
export const AUTH_MODAL_CLOSE_EVENT = MODAL_CLOSE_EVENT;
