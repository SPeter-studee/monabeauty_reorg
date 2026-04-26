// src/content/config.ts
// Astro Content Collections — blog + services + promotions schema

import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    author: z.string().default("Szabó Mónika"),
    publishedAt: z.coerce.date(),
    readingMinutes: z.number().int().positive().default(5),
    coverImageUrl: z.string().optional(),
    coverImageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const services = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    shortDescription: z.string(),
    icon: z.string().optional(),
    heroImageUrl: z.string().optional(),
    heroImageAlt: z.string().optional(),
    duration: z.string().optional(),
    priceFrom: z.number().int().positive().optional(),
    priceNote: z.string().optional(),
    sortOrder: z.number().int().default(100),
    featured: z.boolean().default(false),
    bookingUrl: z.string().optional(),
  }),
});

const promotions = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),                  // rövid leírás kártyára
    badge: z.string().optional(),             // pl. "−20%", "1+1 INGYEN"
    serviceSlug: z.string().optional(),       // melyik szolgáltatáshoz tartozik
    productSlug: z.string().optional(),       // vagy melyik termékhez (Sprint 3-tól)
    discountPercent: z.number().int().min(1).max(99).optional(),
    discountFixed: z.number().int().positive().optional(), // Ft
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    showOnHomepage: z.boolean().default(false),
    heroImageUrl: z.string().optional(),
    heroImageAlt: z.string().optional(),
    ctaText: z.string().default("Időpontfoglalás"),
    ctaUrl: z.string().default("/idopontfoglalas"),
    sortOrder: z.number().int().default(100),
  }),
});

export const collections = { blog, services, promotions };

