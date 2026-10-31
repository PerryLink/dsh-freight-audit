<div align="center">

# dsh-freight-audit

[![npm](https://img.shields.io/npm/v/dsh-freight-audit)](https://www.npmjs.com/package/dsh-freight-audit)
[![CI](https://github.com/PerryLink/dsh-freight-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-freight-audit/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)

**फ़्रेट रेटकार्ड वर्ज़निंग, कैरियर बिल ऑडिट, रिकवरी सारांश और वेरिएंस निर्यात।**

> **स्थिति: alpha / सार्वजनिक-सिंथेटिक / आंशिक / गिना नहीं गया / GA नहीं।** ग्राहक साक्ष्य, ग्राहक डेटा या उत्पादन-तैयारी का दावा नहीं।

> 🧊 **फ़्रीज़ — 2026-10-31। कोई नई सुविधा नहीं।** इंस्टॉल योग्य; केवल वास्तविक खराबी ठीक होगी।

## रखरखाव स्थिति: 🧊 फ़्रीज़

2026-10-31 को फ़्रीज़; पैकेज इंस्टॉल योग्य रहेगा, लेकिन नई सुविधाएँ नहीं मिलेंगी।

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-freight-audit
```

</div>

![Workflow diagram for dsh-freight-audit: local input, plugin, local output.](docs/assets/dsh-freight-audit-flow.svg)

*वर्कफ़्लो: स्थानीय इनपुट → प्लगइन → स्थानीय आउटपुट। मॉडल कॉल आवश्यक नहीं।*

## इंस्टॉल

इंस्टॉल और सत्यापन:

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

अनइंस्टॉल:

```sh
dsh plugin --profile <profile> remove dsh-freight-audit
```

## यह क्या करता है

फ़्रेट रेटकार्ड वर्ज़निंग, कैरियर बिल ऑडिट, रिकवरी सारांश और वेरिएंस निर्यात। DeepSeek Harness पर स्थानीय रूप से चलता है। नीचे दी गई तालिका ही सटीक टूल सतह है; उदाहरण वास्तविक कमांड का उपयोग करते हैं।

इनपुट और आउटपुट स्थानीय रहते हैं; कुछ अपलोड नहीं होता।

## टूल्स

टूल नाम और विवरण runtime आउटपुट से मेल खाने के लिए अंग्रेज़ी में रखे गए हैं।

| टूल | उद्देश्य (अंग्रेज़ी) | जोखिम |
|---|---|---|
| `freight.ratecard` | Register/version a freight ratecard | R1 local write |
| `freight.audit` | Audit carrier bills against the ratecard | R0 |
| `freight.zone_lookup` | Look up a public zone/rate table | R0 |
| `freight.recovery_summary` | Summarize over/under/net recovery | R0 |
| `freight.dispute` | Export a variance CSV for dispute review | R1 local write |
| `freight.export` | Export the audit workbook | R1 local write |

## त्वरित शुरुआत

```sh
dsh plugin --profile <profile> add dsh-freight-audit
dsh --profile <profile> --dump-config | grep dsh-freight-audit
```

## सीमाएँ

- केवल सार्वजनिक/सिंथेटिक; ग्राहक डेटा या साक्ष्य नहीं।
- alpha/आंशिक, गिना नहीं गया, GA या उत्पादन-तैयारी का दावा नहीं।
- जब तक टूल स्पष्ट न कहे, मॉडल या नेटवर्क कॉल नहीं।
- सटीक सीमाएँ तालिका और `ACCEPTANCE.csv` में हैं।

## सार्वजनिक नमूना

सार्वजनिक/सिंथेटिक fixtures `test/fixtures/` में हैं; `ACCEPTANCE.csv` सार्वजनिक जाँचों को `counted=false` के साथ दर्ज करता है।

## विकास

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## परिवार

<details>
<summary>DSH डोमेन प्लगइन परिवार (15 पैकेज + 2 suites)</summary>

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

## लाइसेंस

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
