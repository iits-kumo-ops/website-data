# @iits-kumo-ops/website-data

Monorepo for KumoOps website locale data packages.

## Packages

- `@iits-kumo-ops/data-addons` - Addon descriptions and translations
- `@iits-kumo-ops/data-offer-description` - Offer description locale files
- `@iits-kumo-ops/data-onepager-opentelekomcloud` - OpenTelekomCloud onepager locale files

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0

### Installation

```bash
bun install
```

### Build

Build all packages:

```bash
bun run build
```

Build with validation warnings ignored:

```bash
bun run build -- --ignore-warnings
```

### Generate (addons only)

Generate locale files from YAML source:

```bash
bun run generate
```

## Package Structure

Each package follows this structure:

```
packages/<name>/
├── src/           # Source locale files (JSON)
├── dist/          # Built output (generated)
├── scripts/       # Build scripts
├── package.json
└── tsconfig.json
```

The `addons` package uses YAML as source of truth:

```
packages/addons/
├── data/          # YAML source files
├── locales/       # Generated locale files
├── src/           # TypeScript types and exports
└── scripts/       # Generation scripts
```

## Validation

Builds validate that all locale files have the same keys as `en.json` (source of truth). Missing or extra keys will fail the build unless `--ignore-warnings` is passed.

## Publishing

Packages are published to GitHub Packages on push to `main`. Each build includes:

- `meta.version`: `{package-version}-{git-commit-hash}`
- `meta.lastUpdated`: Git commit date
