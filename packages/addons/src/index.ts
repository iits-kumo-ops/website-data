/**
 * @kumo-ops/addons
 *
 * KumoOps addons data and locale files
 */

export * from "./types.js";

import type { AddonsData, Locale } from "./types.js";
import { SUPPORTED_LOCALES } from "./types.js";

/**
 * Dynamically load locale data
 * @param locale - The locale to load
 * @returns Promise resolving to the locale data
 */
export async function loadLocale(locale: Locale): Promise<AddonsData> {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error(
      `Unsupported locale: ${locale}. Supported locales: ${SUPPORTED_LOCALES.join(", ")}`
    );
  }

  // Dynamic import for the locale file
  const data = await import(`../locales/${locale}.json`, {
    with: { type: "json" },
  });
  return data.default as AddonsData;
}

/**
 * Get the path to a locale file
 * @param locale - The locale
 * @returns The relative path to the locale JSON file
 */
export function getLocalePath(locale: Locale): string {
  return `@kumo-ops/addons/locales/${locale}.json`;
}

export { SUPPORTED_LOCALES };
