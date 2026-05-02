// src/lib/utils/zip-city-lookup.ts
// Sprint 4.5.3.x v0.9.19 — Magyar ZIP → város (build-time JSON import)
//
// v0.9.18: fetch("/data/hu-zip-cities.json") csendben elhasalt, mert a fájl eleje
// nem volt érvényes JSON (JS-kommentek). Most a bundle részeként importáljuk.

import huZipData from "./hu-zip-cities.json";

interface ZipCityData {
  ranges: Array<{ from: number; to: number; city: string }>;
  exact: Record<string, string>;
}

const data = huZipData as ZipCityData;

let citiesListCache: string[] | null = null;

console.log("[zip-city] dataset loaded:", {
  exactCount: Object.keys(data.exact).length,
  rangesCount: data.ranges.length,
});

/**
 * Egy ZIP-hez városnevet ad vissza, vagy null-t ha nem találja.
 */
export function lookupCityByZip(zip: string): string | null {
  const trimmed = zip.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;

  if (data.exact[trimmed]) {
    return data.exact[trimmed];
  }

  const zipNum = parseInt(trimmed, 10);
  for (const range of data.ranges) {
    if (zipNum >= range.from && zipNum <= range.to) {
      return range.city;
    }
  }

  return null;
}

/** Az összes ismert város listája (datalist autocomplete-hez). */
export function getAllCities(): string[] {
  if (citiesListCache) return citiesListCache;

  const set = new Set<string>();
  for (const city of Object.values(data.exact)) {
    set.add(city);
  }
  for (const range of data.ranges) {
    set.add(range.city);
  }

  citiesListCache = Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  return citiesListCache;
}

export interface BindZipCityAutofillOptions {
  zipInput: HTMLInputElement | null;
  cityInput: HTMLInputElement | null;
  citiesDatalist?: HTMLDataListElement | null;
}

export function bindZipCityAutofill(options: BindZipCityAutofillOptions): void {
  const { zipInput, cityInput, citiesDatalist } = options;
  if (!zipInput || !cityInput) return;

  if (citiesDatalist) {
    const cities = getAllCities();
    citiesDatalist.innerHTML = cities
      .map((c) => `<option value="${escapeAttr(c)}"></option>`)
      .join("");
  }

  let cityManuallyEdited = false;
  cityInput.addEventListener("input", () => {
    cityManuallyEdited = true;
  });

  zipInput.addEventListener("blur", () => {
    const zip = zipInput.value.trim();
    if (!/^\d{4}$/.test(zip)) return;

    if (cityManuallyEdited && cityInput.value.trim().length > 0) return;

    const city = lookupCityByZip(zip);
    if (city) {
      cityInput.value = city;
      cityManuallyEdited = false;
    }
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
