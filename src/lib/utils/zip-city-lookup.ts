// src/lib/utils/zip-city-lookup.ts
// Sprint 4.5.3.x v0.9.20 — Magyar ZIP → város + megye auto-fill
//
// Adatbázis (3074 unique ZIP, 20 megye):
// - Friss alapja: Magyar Posta Iranyitoszam-Internet_uj.xlsx (2024-es lista)
// - Megye-mapping: 2003-as iranyitoszamok.xls (város → megye lookup)
// - Budapest hozzáadás (a friss listában nem volt)
// - Hiánypótlás: Szeged kerületei (6720-6729), Pécs (7621-7636), Miskolc, stb.
// - 2020 utáni Csongrád-Csanád megye név
//
// Struktúra optimalizálva:
//   {
//     "counties": ["Baranya", "Borsod-Abaúj-Zemplén", "Budapest", ..., "Zala"],
//     "zips": {
//       "1011": ["Budapest", 2],
//       "2600": ["Vác", 13],
//       "6720": ["Szeged", 5]
//     }
//   }
//
// Az értékben a 2. elem a counties array indexe.
// Ha nincs megye-info, csak a város: ["VárosNév"] (rövid forma)
//
// JSON-t IMPORT-tal töltjük be, NEM fetch-cseljük (build-time inline,
// nincs HTTP request, nincs 404 kockázat — Astro/Vite a JS bundle-be teszi).

import zipCityData from "./hu-zip-cities.json";

interface ZipCityRawData {
  counties: string[];
  zips: Record<string, [string] | [string, number]>;
}

const data: ZipCityRawData = zipCityData as ZipCityRawData;

let citiesListCache: string[] | null = null;
let countiesListCache: string[] | null = null;

/**
 * Egy ZIP-hez teljes információ (város + megye), vagy null ha ismeretlen.
 * Szinkrón! (build-time importálva)
 */
export interface ZipLookupResult {
  city: string;
  county: string;  // üres string ha ismeretlen
}

export function lookupZipInfo(zip: string): ZipLookupResult | null {
  const trimmed = zip.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;

  const entry = data.zips[trimmed];
  if (!entry) return null;

  const city = entry[0];
  const countyId = entry.length > 1 ? entry[1] : -1;
  const county = countyId >= 0 ? (data.counties[countyId] || "") : "";

  return { city, county };
}

/**
 * Backwards-compat: csak város.
 */
export function lookupCityByZip(zip: string): string | null {
  return lookupZipInfo(zip)?.city ?? null;
}

/**
 * Az összes ismert város listája (datalist autocomplete-hez).
 */
export function getAllCities(): string[] {
  if (citiesListCache) return citiesListCache;

  const set = new Set<string>();
  for (const entry of Object.values(data.zips)) {
    set.add(entry[0]);
  }

  citiesListCache = Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  return citiesListCache;
}

/**
 * Az összes megye listája (dropdown-hez, B2B cégszékhely választó stb.).
 */
export function getAllCounties(): string[] {
  if (countiesListCache) return countiesListCache;
  countiesListCache = [...data.counties].sort((a, b) => a.localeCompare(b, "hu"));
  return countiesListCache;
}

/**
 * Backwards-compat.
 */
export async function loadZipCityData(): Promise<ZipCityRawData> {
  return data;
}

/**
 * Form-szerű mezőkhöz: ZIP input change → város + megye auto-fill.
 *
 * Használat:
 * ```typescript
 * bindZipCityAutofill({
 *   zipInput: document.querySelector("[name='shippingZip']"),
 *   cityInput: document.querySelector("[name='shippingCity']"),
 *   countyInput: document.querySelector("[name='shippingCounty']"),  // opcionális
 *   citiesDatalist: document.querySelector("#cities-datalist"),
 *   countiesDatalist: document.querySelector("#counties-datalist"),  // opcionális
 * });
 * ```
 *
 * Viselkedés:
 * - ZIP blur → város + megye auto-fill (ha van match)
 * - Manual edit tracking: ha a vendég kézzel módosította a város/megye mezőt,
 *   nem írjuk felül
 * - Datalist-ek azonnal feltöltődnek (sync)
 */
export interface BindZipCityAutofillOptions {
  zipInput: HTMLInputElement | null;
  cityInput: HTMLInputElement | null;
  countyInput?: HTMLInputElement | null;
  citiesDatalist?: HTMLDataListElement | null;
  countiesDatalist?: HTMLDataListElement | null;
}

export function bindZipCityAutofill(options: BindZipCityAutofillOptions): void {
  const { zipInput, cityInput, countyInput, citiesDatalist, countiesDatalist } = options;

  if (!zipInput || !cityInput) {
    console.warn("[zip-city] bind failed: missing zipInput or cityInput");
    return;
  }

  // Datalist-ek feltöltése
  if (citiesDatalist) {
    const cities = getAllCities();
    citiesDatalist.innerHTML = cities
      .map(c => `<option value="${escapeAttr(c)}"></option>`)
      .join("");
    console.log(`[zip-city] cities datalist filled: ${cities.length}`);
  }

  if (countiesDatalist) {
    const counties = getAllCounties();
    countiesDatalist.innerHTML = counties
      .map(c => `<option value="${escapeAttr(c)}"></option>`)
      .join("");
    console.log(`[zip-city] counties datalist filled: ${counties.length}`);
  }

  // Manual edit tracking
  let cityManuallyEdited = false;
  let countyManuallyEdited = false;
  cityInput.addEventListener("input", () => { cityManuallyEdited = true; });
  countyInput?.addEventListener("input", () => { countyManuallyEdited = true; });

  // ZIP change → city + county auto-fill
  zipInput.addEventListener("blur", () => {
    const zip = zipInput.value.trim();
    if (!/^\d{4}$/.test(zip)) return;

    const info = lookupZipInfo(zip);
    if (!info) {
      console.log(`[zip-city] ${zip} not found`);
      return;
    }

    // Város auto-fill (ha még nincs manuálisan szerkesztve)
    if (!cityManuallyEdited || !cityInput.value.trim()) {
      cityInput.value = info.city;
      cityInput.dispatchEvent(new Event("input", { bubbles: true }));
      cityManuallyEdited = false;
    }

    // Megye auto-fill (ha van countyInput és van megye-info)
    if (countyInput && info.county && (!countyManuallyEdited || !countyInput.value.trim())) {
      countyInput.value = info.county;
      countyInput.dispatchEvent(new Event("input", { bubbles: true }));
      countyManuallyEdited = false;
    }

    console.log(`[zip-city] ${zip} → ${info.city}, ${info.county || "(no county)"}`);
  });

  console.log("[zip-city] bind successful");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
