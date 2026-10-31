<div align="center">

# dsh-freight-audit

> **Official repository.** The only official repository of this package, maintained by PerryLink. Same-name repositories under other accounts are not affiliated. Apache-2.0.

[![npm](https://img.shields.io/npm/v/dsh-freight-audit)](https://www.npmjs.com/package/dsh-freight-audit)
[![CI](https://github.com/PerryLink/dsh-freight-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-freight-audit/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)
[![Gitee](https://img.shields.io/badge/Gitee-aggregate-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-plugins)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-freight-audit?metric=downloads)](https://dshfind.com/plugins/PerryLink/dsh-freight-audit?ref=badge)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-24.9%2B-brightgreen)](#)
[![npm downloads](https://img.shields.io/npm/dm/dsh-freight-audit)](https://www.npmjs.com/package/dsh-freight-audit)

**Freight ratecard versioning, carrier bill audit, recovery summary and variance export.**

> **Status: alpha / public-synthetic / partial / not counted / not GA.** No customer evidence, customer data, or production-readiness claim.

> 🧊 **FROZEN — 2026-10-31. No new features.** Installable; only genuine breakage is fixed.

## Maintenance status: 🧊 FROZEN

Frozen on 2026-10-31; the package stays installable, but feature work stops.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-freight-audit
```

</div>

> ⭐ If this helps, a star makes it easier for the next person to find it. Nothing is gated behind it.

![Workflow diagram for dsh-freight-audit: local input, plugin, local output.](docs/assets/dsh-freight-audit-flow.svg)

*Workflow: local input → plugin → local output. No model call is required.*

## Install

Install and verify:

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

Uninstall:

```sh
dsh plugin --profile <profile> remove dsh-freight-audit
```

## What it does

Freight ratecard versioning, carrier bill audit, recovery summary and variance export. Runs locally on DeepSeek Harness. The table below is the exact tool surface; the examples use the real command surface.

Input and output stay local; nothing is uploaded.

## Tools

Tool names and descriptions are kept in English to match the runtime output.

| Tool | Purpose | Risk |
|---|---|---|
| `freight.ratecard` | Register/version a freight ratecard | R1 local write |
| `freight.audit` | Audit carrier bills against the ratecard | R0 |
| `freight.zone_lookup` | Look up a public zone/rate table | R0 |
| `freight.recovery_summary` | Summarize over/under/net recovery | R0 |
| `freight.dispute` | Export a variance CSV for dispute review | R1 local write |
| `freight.export` | Export the audit workbook | R1 local write |

## Quick start

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

## Limits

- Public/synthetic only; no customer data or customer evidence.
- Alpha/partial, not counted, no GA or production-readiness claim.
- No model or network call unless a tool explicitly says so.
- The exact per-tool boundaries are in the table and `ACCEPTANCE.csv`.

## Public sample

Public/synthetic fixtures live in `test/fixtures/`; `ACCEPTANCE.csv` records the public checks with `counted=false`.

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## Compatibility

| Surface | Status |
|---|---|
| Harness | `dsh >=0.2.1-rc.3 <0.3.0` |
| Node | `>=24.9.0 <25` |
| Platforms | All; local files only |
| Data | No network, no model call, no upload |

## Permissions & data

- Runs locally; no network, no model call, no upload.
- Public/synthetic fixtures only; no customer data, no customer evidence.
- Alpha/partial; not counted, no GA or production-readiness claim.
- Frozen packages stay installable; no new features, only genuine breakage fixes.

## Related work

Sibling packages and family indexes: [dsh-hs-candidate](https://github.com/PerryLink/dsh-hs-candidate) · [dsh-pim-lint](https://github.com/PerryLink/dsh-pim-lint)

- [Domain index](https://perrylink.github.io/dsh-plugins/)
- [Checker family](https://perrylink.github.io/zh/checkers/)
- [Mainline family](https://github.com/PerryLink/dsh-kit)

## Family

<details>
<summary>DSH domain plugin family (15 packages + 2 suites)</summary>

| Package | npm |
|---|---|
| **[dsh-einvoice](https://github.com/PerryLink/dsh-einvoice)** | [npm](https://www.npmjs.com/package/dsh-einvoice) |
| **[dsh-docx-redline](https://github.com/PerryLink/dsh-docx-redline)** | [npm](https://www.npmjs.com/package/dsh-docx-redline) |
| **[dsh-policy-ledger](https://github.com/PerryLink/dsh-policy-ledger)** | [npm](https://www.npmjs.com/package/dsh-policy-ledger) |
| **[dsh-ghg](https://github.com/PerryLink/dsh-ghg)** | [npm](https://www.npmjs.com/package/dsh-ghg) |
| **[dsh-bankrec](https://github.com/PerryLink/dsh-bankrec)** | [npm](https://www.npmjs.com/package/dsh-bankrec) |
| **[dsh-ap-three-way](https://github.com/PerryLink/dsh-ap-three-way)** | [npm](https://www.npmjs.com/package/dsh-ap-three-way) |
| **[dsh-ifc-qto](https://github.com/PerryLink/dsh-ifc-qto)** | [npm](https://www.npmjs.com/package/dsh-ifc-qto) |
| **[dsh-qms-capa](https://github.com/PerryLink/dsh-qms-capa)** | [npm](https://www.npmjs.com/package/dsh-qms-capa) |
| **[dsh-legal-intake](https://github.com/PerryLink/dsh-legal-intake)** | [npm](https://www.npmjs.com/package/dsh-legal-intake) |
| **[dsh-legal-clause](https://github.com/PerryLink/dsh-legal-clause)** | [npm](https://www.npmjs.com/package/dsh-legal-clause) |
| **[dsh-freight-audit](https://github.com/PerryLink/dsh-freight-audit)** | [npm](https://www.npmjs.com/package/dsh-freight-audit) |
| **[dsh-hs-candidate](https://github.com/PerryLink/dsh-hs-candidate)** | [npm](https://www.npmjs.com/package/dsh-hs-candidate) |
| **[dsh-travel-recon](https://github.com/PerryLink/dsh-travel-recon)** | [npm](https://www.npmjs.com/package/dsh-travel-recon) |
| **[dsh-pim-lint](https://github.com/PerryLink/dsh-pim-lint)** | [npm](https://www.npmjs.com/package/dsh-pim-lint) |
| **[dsh-eval-pack](https://github.com/PerryLink/dsh-eval-pack)** | [npm](https://www.npmjs.com/package/dsh-eval-pack) |
| **[dsh-finops-suite](https://github.com/PerryLink/dsh-finops-suite)** | [npm](https://www.npmjs.com/package/dsh-finops-suite) |
| **[dsh-contract-suite](https://github.com/PerryLink/dsh-contract-suite)** | [npm](https://www.npmjs.com/package/dsh-contract-suite) |

</details>

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
