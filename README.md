# dsh-freight-audit

> 🧊 **FROZEN — 2026-10-31. No new features.** This public/synthetic S1 demo is not GA; it stays installable and only genuine breakage is fixed.

## Maintenance status: 🧊 FROZEN

Frozen on 2026-10-31. This repository is a public/synthetic S1 demo, not a validated product. The npm package stays installable; no new features are planned.


Freight ratecard versioning, carrier bill audit, recovery summary and variance export for DeepSeek Harness.

> **Status: alpha / public-synthetic / partial / not counted / not GA.** No customer evidence, customer data, or production-readiness claim. All acceptance rows are `counted=false`.

## Install

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

Requires DSH `>=0.2.1-rc.3 <0.3.0` and Node `>=24.9 <25`.

<details>
<summary>中文摘要</summary>

运费 ratecard 版本、账单审计、recovery 汇总与差异导出。 安装：`dsh plugin --profile <profile> add dsh-freight-audit`。公开/合成、alpha、非 GA。

</details>

## Tools

| Tool | What it does | Risk |
|---|---|---|
| `freight.ratecard` | Register/version a freight ratecard | R1 local write |
| `freight.audit` | Audit carrier bills against the ratecard | R0 |
| `freight.zone_lookup` | Look up a public zone/rate table | R0 |
| `freight.recovery_summary` | Summarize over/under/net recovery | R0 |
| `freight.dispute` | Export a variance CSV for dispute review | R1 local write |
| `freight.export` | Export the audit workbook | R1 local write |

## Input / output

**Input:** a versioned ratecard and carrier bills. **Output:** variance rows, a recovery summary, a dispute CSV, and an audit workbook. Public zone tables are reference data, not a carrier contract.

## Configuration

| Env | Default | Meaning |
|---|---|---|
| `DSH_FREIGHT_HOME` | `$DSH_HOME/storages/dsh-freight-audit` | local domain and exports |

## Limits / non-claims

- No three-carrier format adapters, PDF bill OCR, dispute letters, or Client surface.
- No carrier API, payment, or automatic claim submission.
- MIT UPS zone sample only; no customer ratecard or bill.
- No customer evidence, customer data, or production-readiness claim; all fixtures are public/synthetic.

## Public sample

MIT UPS 40 lb zone sample; `ACCEPTANCE.csv` lists 6 public checks.

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm gate:sku12
```

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
