# Changelog

## [0.2.0] — 2026-11-13

### Breaking

- **Tool names no longer contain a dot.** All eight tools are now
  `freight_ratecard`, `freight_audit`, `freight_export`, `freight_dispute`,
  `freight_zone_lookup`, `freight_recovery_summary`, `freight_ratecard_validate`
  and `freight_accessorial_check`. Providers validate `tools[].name` against
  `^[a-zA-Z0-9_-]+$`; the old dotted spelling invalidated the whole `tools`
  array, so the plugin registered but every request carrying its tools was
  rejected with `Invalid 'tools[N].name'`. Minor bump because tool names are
  part of the 0.1.0 compatibility promise.
- Migration: update prompts, saved calls, scripts and permission rules that
  still use the old dotted spelling to the underscore names above. Tool
  arguments, output shapes and the R0/R1 boundaries are unchanged.
- `test/tool-name-wire.test.mjs` pins the wire pattern, so a new tool cannot
  reintroduce a dot, drop the `freight_` namespace or duplicate an existing name.
- Earlier changelog entries, the five-language READMEs, docs, diagrams and the
  quickstart sample use the underscore spelling, so a repository-wide search no
  longer finds dotted tool names.

## [0.1.0] — 2026-11-03

### Stable

- First non-alpha release: tool names and the CLI surface are covered by a
  compatibility promise (breaking changes require a minor bump).
- Ships a quickstart sample, a one-line prompt, a permission block and real captures.

## [0.1.0] — 2026-11-01

### Security / Fixes

- Path-traversal guard, CSV quoting and spreadsheet-formula neutralisation in the dispute export.


### Added

- `freight_accessorial_check`: accessorial charge validation — known charge types, non-negative integer amounts, duplicates, agreed-list membership and an optional total cap. Verified by `node --test test/*.test.mjs` (13/13).

## [Unreleased]

### Added

- `freight_ratecard_validate`: rate-card hygiene — non-negative money fields, fuel share 0-100, valid effective window and overlapping versions per carrier. Read-only. Verified by `node --test test/*.test.mjs` (9/9).

## [0.1.0-alpha.9] — 2026-11-01

### Changed

- Documentation: five-language fixture/acceptance links now resolve on npm; added specific related-checker/tool links.
- Marketplace metadata: taxonomy category, archetype, domains and status; docs page now shows the same.

All notable changes to `dsh-freight-audit` are documented here. The format follows Keep a Changelog; this project uses alpha versions.

## [0.1.0-alpha.8] — 2026-11-01

### Added

- Five-language READMEs: English, 简体中文, Español, Português, हिन्दी.
- Local workflow SVG at `docs/assets/dsh-freight-audit-flow.svg`.
- Family cross-links (domain index, checker family, `dsh-kit`), compatibility, permissions, and related-work sections.
- Standard repository files: `SECURITY.md`, `PRIVACY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, and `icon.svg`.

### Changed

- README aligned with the PerryLink DSH checker/plugin family style; package remains public/synthetic, alpha, not GA.

### Maintenance

- 2026-11-01: active again — feature work, hardening and fresh evidence resumed.

## [Earlier]

Earlier alpha builds are available from npm and GitHub Releases; this file starts at the family-standard documentation wave.
