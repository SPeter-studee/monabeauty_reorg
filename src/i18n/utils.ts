// src/i18n/utils.ts

import hu from "./hu.json";
import en from "./en.json";

const dictionaries = { hu, en } as const;
export type Locale = keyof typeof dictionaries;

/**
 * Visszaadja a fordításokat a választott nyelvhez.
 * Ha kulcs hiányzik az angolban, fallback HU-ra (lásd astro.config.mjs).
 */
export function getTranslations(locale: Locale = "hu") {
  return dictionaries[locale] ?? dictionaries.hu;
}

/**
 * Locale meghatározása az URL alapján.
 * /en/... → "en", egyébként "hu"
 */
export function getLocaleFromUrl(url: URL): Locale {
  return url.pathname.startsWith("/en") ? "en" : "hu";
}

/**
 * Adott útvonalra a megfelelő locale-prefixet adja:
 *   pathFor("/webshop", "hu") → "/webshop"
 *   pathFor("/webshop", "en") → "/en/webshop"
 */
export function pathFor(path: string, locale: Locale): string {
  if (locale === "hu") return path;
  return `/en${path === "/" ? "" : path}`;
}
