// src/pages/api/auth/google.ts
// Sprint 4.3 — Google OAuth initiate endpoint
//
// Flow:
//   1. Kliens a /api/auth/google?from=/aktualis-oldal-re irányít (GET)
//   2. Mi generálunk egy state token-t (CSRF védelem) → cookie
//   3. A "from" query paramétert is cookie-ba mentjük (a callback-ben kell)
//   4. Redirect a Google authorization URL-re
//
// Példa hívás (a frontend AuthModal-ból):
//   window.location.href = "/api/auth/google?from=" + encodeURIComponent(location.pathname);

import type { APIRoute } from "astro";
import { generateSecureToken } from "@/lib/auth";
import { buildGoogleAuthUrl, buildOAuthStateCookies } from "@/lib/oauth-google";

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const env = (locals.runtime?.env || {}) as any;

  // 1. "from" query param — hova térjünk vissza sikeres login után
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from") || "/";

  // Biztonság: csak relatív path-okat fogadunk el (open redirect védelem)
  const safeFrom = fromParam.startsWith("/") && !fromParam.startsWith("//")
    ? fromParam
    : "/";

  // 2. State CSRF token generálás
  const state = generateSecureToken(16); // 32 hex karakter

  // 3. Callback URL — a request URL hostname-jét használjuk (production / preview / dev)
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  // 4. Google authorization URL építés
  const authUrl = buildGoogleAuthUrl(env, state, redirectUri);

  if (!authUrl) {
    // GOOGLE_CLIENT_ID nincs beállítva
    return new Response(
      JSON.stringify({
        success: false,
        error: "google_oauth_not_configured",
        message: "A Google bejelentkezés jelenleg nem elérhető. Próbáld az email + jelszó opciót.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 5. Set-Cookie + redirect
  const cookies = buildOAuthStateCookies(state, safeFrom);
  const headers = new Headers();
  cookies.forEach(c => headers.append("Set-Cookie", c));
  headers.set("Location", authUrl);

  return new Response(null, {
    status: 302,
    headers,
  });
};
