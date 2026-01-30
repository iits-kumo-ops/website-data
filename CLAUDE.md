# CLAUDE.md

Context for AI assistants working on this codebase.

## Project Overview

This is a Bun monorepo containing locale data packages for KumoOps websites. Packages are published to GitHub Packages as private npm packages.

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Package Manager**: Bun workspaces
- **CI/CD**: GitHub Actions

## Key Commands

```bash
bun install          # Install dependencies
bun run build        # Build all packages
bun run generate     # Generate addons locales from YAML
```

## Architecture

### Shared Build Utilities

`scripts/build-utils.ts` contains shared logic for locale packages:
- `buildLocalePackage()` - Main build function
- `buildMeta()` - Creates meta with version and lastUpdated
- `extractKeys()` - Recursively extracts keys for validation
- `compareLocaleKeys()` - Validates locale keys against en.json

### Package Types

1. **YAML-based** (`addons`): Source in `data/addons.yaml`, generates JSON locales
2. **JSON-based** (`offer-description`, `onepager-opentelekomcloud`): Source JSON in `src/`, copies to `dist/` with meta

### Validation

- `en.json` is the source of truth for keys
- Other locales must have exactly the same keys
- Build fails on validation errors unless `--ignore-warnings` is passed

### Meta Field

Every locale file includes:
```json
{
  "meta": {
    "version": "{package-version}-{git-short-hash}",
    "lastUpdated": "YYYY-MM-DD"
  }
}
```

## File Locations

- `/scripts/` - Shared build utilities
- `/packages/addons/data/` - YAML source for addons
- `/packages/*/src/` - Source locale JSON files
- `/packages/*/dist/` - Built output (gitignored)

## Common Tasks

### Adding a new locale

1. Copy `en.json` to `{locale}.json` in the package's `src/` folder
2. Translate all values
3. Run `bun run build` to validate

### Adding a new addon (addons package)

1. Edit `packages/addons/data/addons.yaml`
2. Add translations for all supported locales
3. Run `bun run generate` to regenerate locale files

### Adding a new locale package

1. Create folder in `packages/`
2. Add `package.json` with build script
3. Add `tsconfig.json` extending base
4. Create `scripts/build.ts` using `buildLocalePackage()`
5. Add source locales to `src/`
6. Update `.github/workflows/publish.yml`
