// src/pages/api/products/index.ts
// GET /api/products — termékek szűrésekkel + lapozással
//
// Query paraméterek:
//   ?kategoria=szerumok          (slug)
//   ?marka=krx                   (slug)
//   ?ar=5000-15000               (min-max forintban)
//   ?sort=price_asc | price_desc | name_asc | name_desc | newest | recommended
//   ?keres=hialuron              (kereső szöveg)
//   ?akcios=1                    (csak akciós termékek)
//   ?page=1                      (lapozás, 1-től)
//   ?per_page=24                 (max 100)
//
// Válasz:
//   {
//     products: Product[],
//     total: number,
//     page: number,
//     perPage: number,
//     totalPages: number
//   }

import type { APIRoute } from "astro";
import { listProducts } from "@/lib/products";
import type { ProductFilter, ProductSort } from "@/lib/types/shop";

const VALID_SORTS: ProductSort[] = [
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "newest",
  "popular",
  "recommended",
];

export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime.env;
  const params = url.searchParams;

  // Szűrők kiolvasása
  const filter: ProductFilter = {
    categorySlug: params.get("kategoria") ?? undefined,
    brandSlug: params.get("marka") ?? undefined,
    search: params.get("keres") ?? undefined,
    isOnSale: params.get("akcios") === "1" ? true : undefined,
  };

  // Ár szűrő — "5000-15000" formátum
  const arParam = params.get("ar");
  if (arParam) {
    const [minStr, maxStr] = arParam.split("-");
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    if (!isNaN(min) && !isNaN(max) && min < max) {
      filter.minPriceFt = min;
      filter.maxPriceFt = max;
    }
  }

  // Sort
  const sortParam = params.get("sort");
  if (sortParam && VALID_SORTS.includes(sortParam as ProductSort)) {
    filter.sortBy = sortParam as ProductSort;
  }

  // Lapozás
  const pageParam = parseInt(params.get("page") ?? "1", 10);
  filter.page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);

  const perPageParam = parseInt(params.get("per_page") ?? "24", 10);
  filter.perPage = Math.min(100, Math.max(1, isNaN(perPageParam) ? 24 : perPageParam));

  try {
    const { products, total } = await listProducts((env as any).DB, filter);

    return Response.json({
      products,
      total,
      page: filter.page,
      perPage: filter.perPage,
      totalPages: Math.ceil(total / filter.perPage!),
    });
  } catch (err) {
    console.error("[/api/products] error:", err);
    return Response.json(
      { error: "Hiba történt a termékek lekérése közben." },
      { status: 500 }
    );
  }
};
