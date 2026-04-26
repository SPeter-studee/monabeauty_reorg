// src/content/config.ts
// Astro Content Collections — blog + services schema

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
    coverImageUrl: z.string().optional(),       // /images/blog/cover.webp
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
    heroImageUrl: z.string().optional(),         // /images/services/xyz-hero.webp
    heroImageAlt: z.string().optional(),
    duration: z.string().optional(),
    priceFrom: z.number().int().positive().optional(),
    priceNote: z.string().optional(),
    sortOrder: z.number().int().default(100),
    featured: z.boolean().default(false),
    bookingUrl: z.string().optional(),
  }),
});

export const collections = { blog, services };
