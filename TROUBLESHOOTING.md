# 故障排查 — dsh-freight-audit

每条按「症状 / 原因 / 动作」写。报错原文都是 `<一句人话>（E_XXX）｜下一步：<动作>`，
把 `E_XXX` 和这句话一起发到 issue 即可定位；不要把真实承运商账单贴进 issue。

## 1. 账单 CSV 读不出来（E_FREIGHT_CSV_INVALID）

- **症状**：`这张运费账单读不出来（E_FREIGHT_CSV_INVALID）｜下一步：确保表头有 shipment_id,weight_kg,billed 三列，金额写成 23.00 这样的两位小数`
- **原因**：表头被换成中文、金额带 `¥` 或三位小数、重量为空 / 为 0。
- **动作**：把表头改成三列原名；金额改成两位小数（`23.00`）；重量填正数，再跑 `freight.audit`。

## 2. 找不到费率卡或字段不全（E_FREIGHT_RATE_MISSING）

- **症状**：`找不到这张费率卡，或费率卡字段不全（E_FREIGHT_RATE_MISSING）｜下一步：先用 freight.ratecard 的 set 动作建好 carrier 和 version，再跑审计`
- **原因**：审计时给的 `carrier/version` 和已建的卡不一致，或建卡时漏了 base/per_kg/fuel/effective_from。
- **动作**：先 `freight.ratecard` 用 `action:"list"` 看已有哪些卡；再按返回的 `carrier|version` 原样传给 `freight.audit`。

## 3. 费率卡版本生效期重叠（E_FREIGHT_RATE_OVERLAP）

- **症状**：`这张费率卡和同承运商的另一个版本生效期重叠（E_FREIGHT_RATE_OVERLAP）｜下一步：改 effective_from/effective_to，让同一承运商的版本区间不重叠`
- **原因**：新旧版本都写到 12-31，或旧版本没填 `effective_to`（默认到 9999-12-31）。
- **动作**：给旧版本补 `effective_to`（例如 `2026-12-31`），新版本从次日开始；再重设一次。

## 4. 导出被拒（E_FREIGHT_PATH_INVALID / E_FREIGHT_PATH_NOT_ALLOWED）

- **症状**：`导出文件名不合法（E_FREIGHT_PATH_INVALID）｜下一步：承运商和版本号只用字母、数字、点、下划线和连字符`
- **原因**：承运商或版本号里带 `/`、空格、中文，或 `..`。
- **动作**：把 `carrier` / `version` 改成 `SYN-LTL`、`v2026` 这类安全写法再导出；导出只会落在 `exports/` 下。

## 还不行

```sh
node samples/quickstart/run.mjs --check   # 自带样例必须通过
node --test test/*.test.mjs               # 28 项测试
```

仍失败时请在 <https://github.com/PerryLink/dsh-freight-audit/issues> 附上：包版本、最小合成输入、完整报错那一行。
