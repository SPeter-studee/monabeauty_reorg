// src/content/config.ts
// Astro Content Collections — blog + services schema

import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),                 // pl. "Bőrápolás", "Bemutatkozás", "Kezelések"
      author: z.string().default("Szabó Mónika"),
      publishedAt: z.coerce.date(),         // ISO date
      readingMinutes: z.number().int().positive().default(5),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      featured: z.boolean().default(false), // főoldali kiemelés
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),    // ha true, nem publikálódik
    }),
});

const services = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),                  // SEO meta description
      shortDescription: z.string(),             // hub kártyára
      icon: z.string().optional(),              // Lucide icon név
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      duration: z.string().optional(),          // pl. "60-90 perc"
      priceFrom: z.number().int().positive().optional(),  // Ft-ban
      priceNote: z.string().optional(),         // pl. "az árak egyénre szabottak"
      sortOrder: z.number().int().default(100), // hub-on milyen sorrendben
      featured: z.boolean().default(false),     // főoldal kiemelt
      bookingUrl: z.string().optional(),        // ha külön Setmore link van
    }),
});

export const collections = { blog, services };
