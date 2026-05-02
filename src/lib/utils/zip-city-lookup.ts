// src/lib/utils/zip-city-lookup.ts
// Sprint 4.5.3.x v0.9.18 — Magyar ZIP → város auto-fill segédfüggvények
//
// Lazy-load + module-szintű cache (egyszer tölti be a JSON-t a session során)

interface ZipCityData {
  ranges: Array<{ from: number; to: number; city: string }>;
  exact: Record<string, string>;
}

let cachedData: ZipCityData | null = null;
let loadPromise: Promise<ZipCityData> | null = null;
let citiesListCache: string[] | null = null;

/**
 * Lazy load a JSON adatbázis.
 * Egyszer tölti be a session során, utána cache-elt.
 */
export async function loadZipCityData(): Promise<ZipCityData> {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  loadPromise = fetch("/data/hu-zip-cities.json")
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ZIP data: ${res.status}`);
      return res.json() as Promise<ZipCityData>;
    })
    .then(data => {
      cachedData = data;
      return data;
    })
    .catch(err => {
      console.warn("[zip-city] load failed:", err);
      // Fallback üres adat — nem törik el a flow
      cachedData = { ranges: [], exact: {} };
      return cachedData;
    });

  return loadPromise;
}

/**
 * Egy ZIP-hez városnevet ad vissza, vagy null-t ha nem találja.
 * Először az exact mapben keres, utána a ranges-ben.
 */
export async function lookupCityByZip(zip: string): Promise<string | null> {
  const trimmed = zip.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;

  const data = await loadZipCityData();

  // Exact match
  if (data.exact[trimmed]) {
    return data.exact[trimmed];
  }

  // Range match
  const zipNum = parseInt(trimmed, 10);
  for (const range of data.ranges) {
    if (zipNum >= range.from && zipNum <= range.to) {
      return range.city;
    }
  }

  return null;
}

/**
 * Az összes ismert város listája (datalist autocomplete-hez).
 * Cache-elt.
 */
export async function getAllCities(): Promise<string[]> {
  if (citiesListCache) return citiesListCache;

  const data = await loadZipCityData();
  const set = new Set<string>();

  // Exact mapból
  for (const city of Object.values(data.exact)) {
    set.add(city);
  }
  // Range-ből
  for (const range of data.ranges) {
    set.add(range.city);
  }

  citiesListCache = Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  return citiesListCache;
}

/**
 * Egy form-szerű mezőhöz: ZIP input change → város input auto-fill,
 * de csak akkor ha a város mező még üres vagy nem manuálisan módosítva.
 *
 * Használat:
 * ```typescript
 * import { bindZipCityAutofill } from "@/lib/utils/zip-city-lookup";
 * bindZipCityAutofill({
 *   zipInput: document.querySelector("[name='shippingZip']"),
 *   cityInput: document.querySelector("[name='shippingCity']"),
 *   citiesDatalist: document.querySelector("#cities-datalist"),
 * });
 * ```
 */
export interface BindZipCityAutofillOptions {
  zipInput: HTMLInputElement | null;
  cityInput: HTMLInputElement | null;
  citiesDatalist?: HTMLDataListElement | null;
}

export function bindZipCityAutofill(options: BindZipCityAutofillOptions): void {
  const { zipInput, cityInput, citiesDatalist } = options;
  if (!zipInput || !cityInput) return;

  // Datalist feltöltés (autocomplete a város mezőhöz)
  if (citiesDatalist) {
    getAllCities().then(cities => {
      citiesDatalist.innerHTML = cities
        .map(c => `<option value="${escapeAttr(c)}"></option>`)
        .join("");
    }).catch(() => { /* no-op, fallback üres */ });
  }

  // Track ha a vendég kézzel módosította a város mezőt
  let cityManuallyEdited = false;
  cityInput.addEventListener("input", () => {
    cityManuallyEdited = true;
  });

  // ZIP change → city auto-fill
  zipInput.addEventListener("blur", async () => {
    const zip = zipInput.value.trim();
    if (!/^\d{4}$/.test(zip)) return;

    // Ha a vendég már kézzel módosította a város mezőt → ne írjuk felül
    if (cityManuallyEdited && cityInput.value.trim().length > 0) return;

    const city = await lookupCityByZip(zip);
    if (city) {
      cityInput.value = city;
      // A "manuálisan módosította" flag-et NEM állítjuk be — a vendég 
      // még kézzel módosíthatja az auto-fill után
      cityManuallyEdited = false;
    }
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
