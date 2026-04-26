// src/lib/products.ts
// D1 termék lekérdező függvények — Sprint 3
//
// Használat Astro oldalakon:
//   const env = Astro.locals.runtime.env;
//   const products = await listProducts(env.DB, { categorySlug: 'szerumok' });

import type {
  Product,
  ProductImage,
  Category,
  Brand,
  ProductFilter,
  ProductSort,
} from "./types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// SQL ROW → TYPED OBJECT mappers
// ─────────────────────────────────────────────────────────────────────────────

function mapCategory(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    heroImage: row.hero_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBrand(row: any): Brand {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    country: row.country,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapImage(row: any): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary === 1,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    ingredients: row.ingredients,
    usageInstructions: row.usage_instructions,
    monikaRecommends: row.monika_recommends,
    priceFt: row.price_ft,
    salePriceFt: row.sale_price_ft,
    saleStartsAt: row.sale_starts_at,
    saleEndsAt: row.sale_ends_at,
    stockQty: row.stock_qty,
    lowStockThreshold: row.low_stock_threshold,
    categoryId: row.category_id,
    brandId: row.brand_id,
    sizeValue: row.size_value,
    sizeUnit: row.size_unit,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured === 1,
    isActive: row.is_active === 1,
    isNew: row.is_new === 1,
    isRecommended: row.is_recommended === 1,
    skinTypes: row.skin_types ? JSON.parse(row.skin_types) : null,
    skinConcerns: row.skin_concerns ? JSON.parse(row.skin_concerns) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function listCategories(db: D1Database, options: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = options;
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const result = await db
    .prepare(`SELECT * FROM categories ${where} ORDER BY sort_order, name`)
    .all();
  return (result.results ?? []).map(mapCategory);
}

export async function getCategory(db: D1Database, slug: string): Promise<Category | null> {
  const result = await db
    .prepare("SELECT * FROM categories WHERE slug = ? AND is_active = 1")
    .bind(slug)
    .first();
  return result ? mapCategory(result) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────────────────────

export async function listBrands(db: D1Database, options: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = options;
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const result = await db
    .prepare(`SELECT * FROM brands ${where} ORDER BY sort_order, name`)
    .all();
  return (result.results ?? []).map(mapBrand);
}

export async function getBrand(db: D1Database, slug: string): Promise<Brand | null> {
  const result = await db
    .prepare("SELECT * FROM brands WHERE slug = ? AND is_active = 1")
    .bind(slug)
    .first();
  return result ? mapBrand(result) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

const SORT_SQL: Record<ProductSort, string> = {
  name_asc: "p.name ASC",
  name_desc: "p.name DESC",
  price_asc: "COALESCE(p.sale_price_ft, p.price_ft) ASC",
  price_desc: "COALESCE(p.sale_price_ft, p.price_ft) DESC",
  newest: "p.created_at DESC",
  popular: "p.created_at DESC",          // Sprint 5+: view_count
  recommended: "p.is_recommended DESC, p.is_featured DESC, p.name ASC",
};

/**
 * Termékek listázása szűrőkkel + (opcionálisan) elsődleges kép, kategória, márka.
 */
export async function listProducts(
  db: D1Database,
  filter: ProductFilter = {}
): Promise<{ products: Product[]; total: number }> {
  const {
    categorySlug,
    brandSlug,
    minPriceFt,
    maxPriceFt,
    isFeatured,
    isOnSale,
    search,
    sortBy = "recommended",
    page = 1,
    perPage = 24,
  } = filter;

  // WHERE feltételek építése
  const conditions: string[] = ["p.is_active = 1"];
  const bindings: any[] = [];

  if (categorySlug) {
    conditions.push("c.slug = ?");
    bindings.push(categorySlug);
  }

  if (brandSlug) {
    conditions.push("b.slug = ?");
    bindings.push(brandSlug);
  }

  if (typeof minPriceFt === "number") {
    conditions.push("COALESCE(p.sale_price_ft, p.price_ft) >= ?");
    bindings.push(minPriceFt);
  }

  if (typeof maxPriceFt === "number") {
    conditions.push("COALESCE(p.sale_price_ft, p.price_ft) <= ?");
    bindings.push(maxPriceFt);
  }

  if (isFeatured) {
    conditions.push("p.is_featured = 1");
  }

  if (isOnSale) {
    const now = new Date().toISOString();
    conditions.push("p.sale_price_ft IS NOT NULL");
    conditions.push("(p.sale_starts_at IS NULL OR p.sale_starts_at <= ?)");
    bindings.push(now);
    conditions.push("(p.sale_ends_at IS NULL OR p.sale_ends_at >= ?)");
    bindings.push(now);
  }

  if (search) {
    conditions.push("(p.name LIKE ? OR p.short_description LIKE ?)");
    bindings.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = conditions.join(" AND ");
  const orderSql = SORT_SQL[sortBy];
  const offset = (page - 1) * perPage;

  // Total count
  const countResult = await db
    .prepare(`
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${whereSql}
    `)
    .bind(...bindings)
    .first<{ total: number }>();

  const total = countResult?.total ?? 0;

  // Lista lekérdezés
  const result = await db
    .prepare(`
      SELECT p.*
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, perPage, offset)
    .all();

  const products = (result.results ?? []).map(mapProduct);

  // Bővítés képekkel + kategória + márka — egy kötegelt lekérdezésben
  if (products.length > 0) {
    await enrichProducts(db, products);
  }

  return { products, total };
}

/**
 * Egy termék lekérése slug alapján — minden kapcsolt adattal (képek, kategória, márka).
 */
export async function getProduct(db: D1Database, slug: string): Promise<Product | null> {
  const result = await db
    .prepare("SELECT * FROM products WHERE slug = ? AND is_active = 1")
    .bind(slug)
    .first();

  if (!result) return null;

  const product = mapProduct(result);
  await enrichProducts(db, [product]);
  return product;
}

/**
 * Termékek bővítése képekkel + kategória + márka adattal (bulk lekérdezések).
 */
async function enrichProducts(db: D1Database, products: Product[]) {
  const productIds = products.map(p => p.id);
  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(x => x !== null))];
  const brandIds = [...new Set(products.map(p => p.brandId).filter(x => x !== null))];

  // Képek
  const imagesResult = await db
    .prepare(`
      SELECT * FROM product_images
      WHERE product_id IN (${productIds.map(() => "?").join(",")})
      ORDER BY product_id, is_primary DESC, sort_order
    `)
    .bind(...productIds)
    .all();

  const imagesByProduct = new Map<number, ProductImage[]>();
  for (const row of imagesResult.results ?? []) {
    const img = mapImage(row);
    const arr = imagesByProduct.get(img.productId) ?? [];
    arr.push(img);
    imagesByProduct.set(img.productId, arr);
  }

  // Kategóriák
  let categoriesById = new Map<number, Category>();
  if (categoryIds.length > 0) {
    const catResult = await db
      .prepare(`SELECT * FROM categories WHERE id IN (${categoryIds.map(() => "?").join(",")})`)
      .bind(...categoryIds)
      .all();
    for (const row of catResult.results ?? []) {
      const cat = mapCategory(row);
      categoriesById.set(cat.id, cat);
    }
  }

  // Márkák
  let brandsById = new Map<number, Brand>();
  if (brandIds.length > 0) {
    const brandResult = await db
      .prepare(`SELECT * FROM brands WHERE id IN (${brandIds.map(() => "?").join(",")})`)
      .bind(...brandIds)
      .all();
    for (const row of brandResult.results ?? []) {
      const brand = mapBrand(row);
      brandsById.set(brand.id, brand);
    }
  }

  // Hozzárendelés
  for (const product of products) {
    product.images = imagesByProduct.get(product.id) ?? [];
    if (product.categoryId !== null) {
      product.category = categoriesById.get(product.categoryId);
    }
    if (product.brandId !== null) {
      product.brand = brandsById.get(product.brandId);
    }
  }
}

/**
 * Kiemelt termékek a főoldalra (vagy webshop hub-ra).
 */
export async function listFeaturedProducts(db: D1Database, limit = 4): Promise<Product[]> {
  const { products } = await listProducts(db, {
    isFeatured: true,
    sortBy: "recommended",
    perPage: limit,
  });
  return products;
}

/**
 * Akciós termékek listája (most aktív akcióval).
 */
export async function listOnSaleProducts(db: D1Database, limit = 8): Promise<Product[]> {
  const { products } = await listProducts(db, {
    isOnSale: true,
    sortBy: "newest",
    perPage: limit,
  });
  return products;
}

/**
 * Ár-tartomány lekérdezése a slider min/max értékéhez.
 */
export async function getPriceRange(
  db: D1Database,
  filter: { categorySlug?: string; brandSlug?: string } = {}
): Promise<{ min: number; max: number }> {
  const conditions: string[] = ["p.is_active = 1"];
  const bindings: any[] = [];

  if (filter.categorySlug) {
    conditions.push("c.slug = ?");
    bindings.push(filter.categorySlug);
  }
  if (filter.brandSlug) {
    conditions.push("b.slug = ?");
    bindings.push(filter.brandSlug);
  }

  const result = await db
    .prepare(`
      SELECT
        MIN(COALESCE(p.sale_price_ft, p.price_ft)) AS min_price,
        MAX(COALESCE(p.sale_price_ft, p.price_ft)) AS max_price
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${conditions.join(" AND ")}
    `)
    .bind(...bindings)
    .first<{ min_price: number | null; max_price: number | null }>();

  return {
    min: result?.min_price ?? 0,
    max: result?.max_price ?? 100000,
  };
}
