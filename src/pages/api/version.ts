// src/pages/api/version.ts
// GET /api/version — alkalmazás verzió + build dátum JSON formátumban
//
// Hasznos monitoring, deploy verifikáció, vagy egyszerű egészség-ellenőrzéshez.

import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return Response.json({
    name: "Mona Studio",
    version: import.meta.env.PUBLIC_APP_VERSION ?? "0.0.0",
    buildDate: import.meta.env.PUBLIC_BUILD_DATE ?? null,
    runtime: "cloudflare-pages",
    framework: "astro",
  }, {
    headers: {
      "Cache-Control": "public, max-age=60", // 1 perc cache
    },
  });
};
