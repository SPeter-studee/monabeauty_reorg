// src/pages/api/products/[slug].ts
// GET /api/products/{slug} — egy termék lekérése slug alapján
//
// A termékoldal "Kosárba teszem" gombja ezt használja, hogy friss adatokat
// kapjon (ár, készlet) — így a localStorage-ben tárolt kosár értékek
// mindig a legfrissebb szerver-oldali állapotot tükrözik.

import type { APIRoute } from "astro";
import { getProduct } from "@/lib/products";

export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime.env;
  const slug = params.slug;

  if (!slug || typeof slug !== "string") {
    return Response.json({ error: "Hiányzó vagy érvénytelen slug." }, { status: 400 });
  }

  try {
    const product = await getProduct((env as any).DB, slug);
    if (!product) {
      return Response.json({ error: "Termék nem található." }, { status: 404 });
    }
    return Response.json(product);
  } catch (err) {
    console.error("[/api/products/[slug]] error:", err);
    return Response.json(
      { error: "Hiba történt a termék lekérése közben." },
      { status: 500 }
    );
  }
};
