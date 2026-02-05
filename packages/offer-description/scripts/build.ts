#!/usr/bin/env bun
/**
 * Build script for offer-description package
 */

import * as path from "path";
import { buildLocalePackage } from "../../../scripts/build-utils.js";

const PACKAGE_DIR = path.join(import.meta.dir, "..");
const ignoreWarnings = Bun.argv.includes("--ignore-warnings");

buildLocalePackage({
  packageDir: PACKAGE_DIR,
  srcDir: path.join(PACKAGE_DIR, "src"),
  distDir: path.join(PACKAGE_DIR, "dist", "locales"),
  ignoreWarnings,
});
