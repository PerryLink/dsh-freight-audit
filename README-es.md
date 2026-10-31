<div align="center">

# dsh-freight-audit

[![npm](https://img.shields.io/npm/v/dsh-freight-audit)](https://www.npmjs.com/package/dsh-freight-audit)
[![CI](https://github.com/PerryLink/dsh-freight-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-freight-audit/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)

**Versionado de tarifas, auditoría de facturas de transporte, resumen de recuperación y varianzas.**

> **Estado: alpha / synthetic público / parcial / no contabilizado / no GA.** Sin evidencia de clientes, datos de clientes ni promesa de producción.

> 🧊 **CONGELADO — 2026-10-31. Sin nuevas funciones.** Instalable; solo se corrigen fallos reales.

## Estado de mantenimiento: 🧊 CONGELADO

Congelado el 2026-10-31; el paquete sigue instalable, pero no recibe nuevas funciones.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-freight-audit
```

</div>

![Workflow diagram for dsh-freight-audit: local input, plugin, local output.](docs/assets/dsh-freight-audit-flow.svg)

*Flujo: entrada local → plugin → salida local. No requiere llamada a un modelo.*

## Instalación

Instalar y verificar:

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

Desinstalar:

```sh
dsh plugin --profile <profile> remove dsh-freight-audit
```

## Qué hace

Versionado de tarifas, auditoría de facturas de transporte, resumen de recuperación y varianzas. Se ejecuta localmente en DeepSeek Harness. La tabla siguiente es la superficie exacta de herramientas; los ejemplos usan la interfaz real.

La entrada y la salida permanecen locales; no se sube nada.

## Herramientas

Los nombres y descripciones de herramientas se mantienen en inglés para coincidir con la salida runtime.

| Herramienta | Propósito (en inglés) | Riesgo |
|---|---|---|
| `freight.ratecard` | Register/version a freight ratecard | R1 local write |
| `freight.audit` | Audit carrier bills against the ratecard | R0 |
| `freight.zone_lookup` | Look up a public zone/rate table | R0 |
| `freight.recovery_summary` | Summarize over/under/net recovery | R0 |
| `freight.dispute` | Export a variance CSV for dispute review | R1 local write |
| `freight.export` | Export the audit workbook | R1 local write |

## Inicio rápido

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

## Límites

- Solo público/sintético; sin datos ni evidencia de clientes.
- Alpha/parcial, no contabilizado, sin GA ni promesa de producción.
- Sin modelo ni red salvo que una herramienta lo indique.
- Los límites exactos están en la tabla y en `ACCEPTANCE.csv`.

## Muestra pública

Las fixtures públicas/sintéticas están en `test/fixtures/`; `ACCEPTANCE.csv` registra las comprobaciones con `counted=false`.

## Desarrollo

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## Familia

<details>
<summary>Familia de plugins DSH (15 paquetes + 2 suites)</summary>

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

## Licencia

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
