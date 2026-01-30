/**
 * Shared build utilities for locale packages
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface Meta {
  version: string;
  lastUpdated: string;
}

export interface GitInfo {
  commitHash: string;
  commitDate: string;
}

export function getGitInfo(cwd: string): GitInfo {
  try {
    const commitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      cwd,
    }).trim();

    const commitDate = execSync("git log -1 --format=%cI", {
      encoding: "utf-8",
      cwd,
    }).trim();

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

export function getPackageVersion(packageDir: string): string {
  const packageJsonPath = path.join(packageDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

export function buildMeta(packageDir: string): Meta {
  const packageVersion = getPackageVersion(packageDir);
  const { commitHash, commitDate } = getGitInfo(packageDir);

  return {
    version: `${packageVersion}-${commitHash}`,
    lastUpdated: commitDate,
  };
}

export interface BuildOptions {
  packageDir: string;
  srcDir: string;
  distDir: string;
  ignoreWarnings?: boolean;
}

export interface LocaleFile {
  meta?: Meta;
  [key: string]: unknown;
}

/**
 * Recursively extract all keys from an object as dot-notation paths
 */
function extractKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }

  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recurse into nested objects
      keys.push(...extractKeys(value, fullKey));
    } else {
      // Leaf value (string, number, array, null)
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Compare locale keys against the source of truth (en)
 */
function compareLocaleKeys(
  fileName: string,
  localeKeys: Set<string>,
  sourceKeys: Set<string>
): string[] {
  const errors: string[] = [];

  // Find missing keys (in source but not in locale)
  for (const key of sourceKeys) {
    if (!localeKeys.has(key)) {
      errors.push(`${fileName}: Missing key '${key}'`);
    }
  }

  // Find extra keys (in locale but not in source)
  for (const key of localeKeys) {
    if (!sourceKeys.has(key)) {
      errors.push(`${fileName}: Extra key '${key}' (not in en.json)`);
    }
  }

  return errors;
}

export function buildLocalePackage(options: BuildOptions): void {
  const { packageDir, srcDir, distDir, ignoreWarnings = false } = options;

  console.log(`Building package from ${path.basename(packageDir)}...\n`);

  // Check src directory exists
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: Source directory not found at ${srcDir}`);
    process.exit(1);
  }

  // Get meta info
  const packageVersion = getPackageVersion(packageDir);
  const { commitHash, commitDate } = getGitInfo(packageDir);
  console.log(`Version: ${packageVersion}-${commitHash}`);
  console.log(`Last Updated: ${commitDate}`);
  console.log("");

  // Ensure dist directory exists
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Get all JSON files from src
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.error("Error: No JSON files found in src/");
    process.exit(1);
  }

  // Load English locale as source of truth
  const enPath = path.join(srcDir, "en.json");
  if (!fs.existsSync(enPath)) {
    console.error("Error: en.json not found - required as source of truth");
    process.exit(1);
  }

  const enData: LocaleFile = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  // Extract keys from English locale (excluding meta since we regenerate it)
  const { meta: _enMeta, ...enContent } = enData;
  const sourceKeys = new Set(extractKeys(enContent));

  console.log(`Source of truth: en.json (${sourceKeys.size} keys)`);
  console.log(`Processing ${files.length} locale files...`);

  const allErrors: string[] = [];
  const localeDataMap = new Map<string, LocaleFile>();

  // First pass: read and validate all files
  for (const file of files) {
    const srcPath = path.join(srcDir, file);

    let data: LocaleFile;
    try {
      data = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
    } catch (e) {
      allErrors.push(`${file}: Invalid JSON - ${e}`);
      continue;
    }

    localeDataMap.set(file, data);

    // Key comparison (skip en.json)
    if (file !== "en.json") {
      const { meta: _localeMeta, ...localeContent } = data;
      const localeKeys = new Set(extractKeys(localeContent));
      const keyErrors = compareLocaleKeys(file, localeKeys, sourceKeys);
      allErrors.push(...keyErrors);
    }
  }

  // Second pass: build output files
  for (const file of files) {
    const data = localeDataMap.get(file);
    if (!data) continue;

    const distPath = path.join(distDir, file);

    // Build new meta
    const newMeta = buildMeta(packageDir);

    // Rebuild object with meta first (remove old meta if exists)
    const { meta: _oldMeta, ...rest } = data;
    const output = { meta: newMeta, ...rest };

    // Write to dist
    fs.writeFileSync(distPath, JSON.stringify(output, null, 2) + "\n");
    console.log(`  - Built ${file}`);
  }

  // Report validation errors
  if (allErrors.length > 0) {
    console.warn("\nValidation errors:");
    allErrors.forEach((err) => console.warn(`  - ${err}`));

    if (!ignoreWarnings) {
      console.error("\nBuild failed due to validation errors.");
      console.error("Use --ignore-warnings to build anyway.");
      process.exit(1);
    }

    console.warn("\nWarnings ignored, continuing build...");
  }

  console.log("\nBuild complete!");
  console.log(`  Files: ${files.length}`);
  console.log(`  Output: ${distDir}`);
}
