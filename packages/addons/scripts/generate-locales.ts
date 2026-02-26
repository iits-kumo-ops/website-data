#!/usr/bin/env bun
/**
 * Generate locale JSON files from YAML source data
 *
 * This script reads the addons.yaml file and generates separate JSON files
 * for each supported locale, maintaining the original JSON structure.
 * It also generates src/index.ts with exported constants and types.
 */

import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const PACKAGE_DIR = path.join(import.meta.dir, "..");
const DATA_DIR = path.join(PACKAGE_DIR, "data");
const OUTPUT_DIR = path.join(PACKAGE_DIR, "dist", "locales");
const SRC_DIR = path.join(PACKAGE_DIR, "src");

interface LocalizedString {
  [locale: string]: string;
}

interface AddonData {
  label: LocalizedString;
  pricing: LocalizedString;
  short_description: LocalizedString;
  detailed_description: LocalizedString;
}

interface CategoryData {
  label: LocalizedString;
  items: Record<string, AddonData>;
}

interface YamlData {
  description: string;
  supportedLocales: string[];
  categories: Record<string, CategoryData>;
}

interface LocaleAddon {
  label: string;
  pricing: string;
  short_description: string;
  detailed_description: string;
}

interface LocaleCategory {
  label: string;
  items: Record<string, LocaleAddon>;
}

interface LocaleOutput {
  meta: {
    version: string;
    lastUpdated: string;
    description: string;
  };
  categories: Record<string, LocaleCategory>;
}

interface MetaInfo {
  version: string;
  lastUpdated: string;
  description: string;
}

function getGitInfo(): { commitHash: string; commitDate: string } {
  try {
    const commitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      cwd: PACKAGE_DIR,
    }).trim();

    const commitDate = execSync("git log -1 --format=%cI", {
      encoding: "utf-8",
      cwd: PACKAGE_DIR,
    }).trim();

    // Format date as YYYY-MM-DD
    const formattedDate = commitDate.split("T")[0];

    return { commitHash, commitDate: formattedDate };
  } catch {
    console.warn("Warning: Could not get git info, using fallback values");
    return {
      commitHash: "dev",
      commitDate: new Date().toISOString().split("T")[0],
    };
  }
}

function getPackageVersion(): string {
  const packageJsonPath = path.join(PACKAGE_DIR, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

function buildMeta(description: string): MetaInfo {
  const packageVersion = getPackageVersion();
  const { commitHash, commitDate } = getGitInfo();

  return {
    version: `${packageVersion}-${commitHash}`,
    lastUpdated: commitDate,
    description,
  };
}

function extractLocale(
  data: YamlData,
  locale: string,
  meta: MetaInfo
): LocaleOutput {
  const output: LocaleOutput = {
    meta,
    categories: {},
  };

  for (const [categoryKey, category] of Object.entries(data.categories)) {
    const localeCategory: LocaleCategory = {
      label: category.label[locale] || category.label.en,
      items: {},
    };

    for (const [addonKey, addon] of Object.entries(category.items)) {
      localeCategory.items[addonKey] = {
        label: addon.label[locale] || addon.label.en,
        pricing: addon.pricing[locale] || addon.pricing.en,
        short_description:
          addon.short_description[locale] || addon.short_description.en,
        detailed_description:
          addon.detailed_description[locale] || addon.detailed_description.en,
      };
    }

    output.categories[categoryKey] = localeCategory;
  }

  return output;
}

function validateYamlData(data: YamlData): string[] {
  const errors: string[] = [];
  const locales = data.supportedLocales;

  // Validate categories
  for (const [categoryKey, category] of Object.entries(data.categories)) {
    for (const locale of locales) {
      if (!category.label[locale]) {
        errors.push(
          `Missing label for category "${categoryKey}" in locale: ${locale}`
        );
      }
    }

    // Validate addons
    for (const [addonKey, addon] of Object.entries(category.items)) {
      const fields = [
        "label",
        "pricing",
        "short_description",
        "detailed_description",
      ] as const;

      for (const field of fields) {
        for (const locale of locales) {
          if (!addon[field][locale]) {
            errors.push(
              `Missing ${field} for addon "${categoryKey}.${addonKey}" in locale: ${locale}`
            );
          }
        }
      }
    }
  }

  return errors;
}

function generateIndexTs(data: YamlData): void {
  const locales = data.supportedLocales;
  const categoryNames = Object.keys(data.categories);

  // Build addons grouped by category as array of {id, addons}
  const addonsByCategory: Array<{ id: string; addons: string[] }> = [];
  const allAddonNames: string[] = [];

  for (const [categoryKey, category] of Object.entries(data.categories)) {
    const addons = Object.keys(category.items);
    addonsByCategory.push({ id: categoryKey, addons });
    allAddonNames.push(...addons);
  }

  const content = `/**
 * Auto-generated by generate-locales.ts
 * Do not edit manually
 */

export const LOCALES = ${JSON.stringify(locales, null, 2)} as const;

export const CATEGORY_NAMES = ${JSON.stringify(categoryNames, null, 2)} as const;

export const ADDON_NAMES = ${JSON.stringify(allAddonNames, null, 2)} as const;

export const ADDONS_BY_CATEGORY = ${JSON.stringify(addonsByCategory, null, 2)} as const;

export type Locale = (typeof LOCALES)[number];
export type CategoryName = (typeof CATEGORY_NAMES)[number];
export type AddonName = (typeof ADDON_NAMES)[number];

export interface Addon {
  label: string;
  pricing: string;
  short_description: string;
  detailed_description: string;
}

export interface Category {
  label: string;
  items: Record<string, Addon>;
}

export interface AddonsData {
  meta: {
    version: string;
    lastUpdated: string;
    description: string;
  };
  categories: Record<string, Category>;
}
`;

  if (!fs.existsSync(SRC_DIR)) {
    fs.mkdirSync(SRC_DIR, { recursive: true });
  }

  fs.writeFileSync(path.join(SRC_DIR, "index.ts"), content);
  console.log("  - Generated src/index.ts");
}

function main() {
  console.log("Generating locale files from YAML source...\n");

  // Read YAML source
  const yamlPath = path.join(DATA_DIR, "addons.yaml");
  if (!fs.existsSync(yamlPath)) {
    console.error(`Error: YAML source file not found at ${yamlPath}`);
    process.exit(1);
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const data = yaml.load(yamlContent) as YamlData;

  // Build meta from package version and git info
  const meta = buildMeta(data.description);
  console.log(`Version: ${meta.version}`);
  console.log(`Last Updated: ${meta.lastUpdated}`);
  console.log("");

  // Validate data
  console.log("Validating YAML data...");
  const errors = validateYamlData(data);
  if (errors.length > 0) {
    console.warn("\nValidation warnings:");
    errors.forEach((err) => console.warn(`  - ${err}`));
    console.log("");
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate locale files
  const locales = data.supportedLocales;
  console.log(`Generating ${locales.length} locale files...`);

  for (const locale of locales) {
    const localeData = extractLocale(data, locale, meta);
    const outputPath = path.join(OUTPUT_DIR, `${locale}.json`);

    fs.writeFileSync(outputPath, JSON.stringify(localeData, null, 2) + "\n");
    console.log(`  - Generated ${locale}.json`);
  }

  // Generate index.ts with const exports
  generateIndexTs(data);

  // Generate summary
  const addonCount = Object.values(data.categories).reduce(
    (sum, cat) => sum + Object.keys(cat.items).length,
    0
  );
  const categoryCount = Object.keys(data.categories).length;

  console.log("\nGeneration complete!");
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Addons: ${addonCount}`);
  console.log(`  Locales: ${locales.join(", ")}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
}

main();
