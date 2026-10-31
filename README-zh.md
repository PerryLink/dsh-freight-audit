<div align="center">

# dsh-freight-audit

[![npm](https://img.shields.io/npm/v/dsh-freight-audit)](https://www.npmjs.com/package/dsh-freight-audit)
[![CI](https://github.com/PerryLink/dsh-freight-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-freight-audit/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)

**运费 ratecard 版本、账单审计、recovery 汇总与差异导出。**

> **状态：alpha / 公开合成 / partial / not counted / 非 GA。** 不含客户证据、客户数据，也不作生产可用声明。

> 🧊 **已冻结 — 2026-10-31。不再加新功能。** 仍可安装；只修真实故障。

## 维护状态：🧊 已冻结

2026-10-31 冻结；包仍可安装，但不再加新功能。

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-freight-audit
```

</div>

![Workflow diagram for dsh-freight-audit: local input, plugin, local output.](docs/assets/dsh-freight-audit-flow.svg)

*工作流：本地输入 → 插件 → 本地输出；不需要调用模型。*

## 安装

安装并验证：

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

卸载：

```sh
dsh plugin --profile <profile> remove dsh-freight-audit
```

## 它做什么

运费 ratecard 版本、账单审计、recovery 汇总与差异导出。 在 DeepSeek Harness 本地运行；下表就是实际工具面，示例使用真实命令面。

输入和输出都留在本地，不上传。

## 工具

工具名和说明保留英文，以对应运行输出。

| 工具 | 用途（英文对应运行输出） | 风险 |
|---|---|---|
| `freight.ratecard` | Register/version a freight ratecard | R1 local write |
| `freight.audit` | Audit carrier bills against the ratecard | R0 |
| `freight.zone_lookup` | Look up a public zone/rate table | R0 |
| `freight.recovery_summary` | Summarize over/under/net recovery | R0 |
| `freight.dispute` | Export a variance CSV for dispute review | R1 local write |
| `freight.export` | Export the audit workbook | R1 local write |

## 快速开始

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

## 边界

- 仅公开/合成样例；不含客户数据或客户证据。
- alpha/partial、not counted，不作 GA 或生产可用声明。
- 除非工具明确说明，否则不调用模型、不联网。
- 每个工具的精确边界见工具表与 `ACCEPTANCE.csv`。

## 公开样例

公开/合成 fixture 在 `test/fixtures/`；`ACCEPTANCE.csv` 记录公开检查，全部 `counted=false`。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## 家族

<details>
<summary>DSH 领域插件家族（15 个包 + 2 个 suite）</summary>

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

## 许可证

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
