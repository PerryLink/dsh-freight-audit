#!/usr/bin/env node
/**
 * dsh-freight-audit quickstart — runs the built plugin tools over the bundled
 * synthetic carrier bill. The golden file `expected/result.json` is the stdout of
 * `node samples/quickstart/run.mjs --json`, so it is a real run, not hand-written.
 *
 *   node samples/quickstart/run.mjs            # human-readable summary
 *   node samples/quickstart/run.mjs --json     # the golden result on stdout
 *   node samples/quickstart/run.mjs --check    # recompute and diff against the golden file
 */
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTools } from '../../lib/plugin/tools.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const inputDir = path.join(here, 'input')
const expectedPath = path.join(here, 'expected', 'result.json')
const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--json') ? 'json' : 'summary'

class Table {
  map = new Map()
  get(key) { return this.map.get(key) }
  entries() { return this.map.entries() }
  get size() { return this.map.size }
  async put(key, value) { this.map.set(key, value) }
}

async function run() {
  const card = JSON.parse(await readFile(path.join(inputDir, 'ratecard.json'), 'utf8'))
  const billsCsv = await readFile(path.join(inputDir, 'bills.csv'), 'utf8')
  const zonesCsv = await readFile(path.join(inputDir, 'zones.csv'), 'utf8')
  const cards = JSON.parse(await readFile(path.join(inputDir, 'ratecards.json'), 'utf8'))
  const accessorials = JSON.parse(await readFile(path.join(inputDir, 'accessorials.json'), 'utf8'))

  const baseDir = await mkdtemp(path.join(os.tmpdir(), 'dsh-freight-quickstart-'))
  try {
    const tools = Object.fromEntries(createTools({ rates: new Table(), bills: new Table(), baseDir }).map((tool) => [tool.name, tool]))
    const call = { callId: 'quickstart' }

    await tools['freight.ratecard'].execute({ action: 'set', ...card }, call)
    const audit = await tools['freight.audit'].execute({ carrier: card.carrier, version: card.version, bills_csv: billsCsv }, call)
    const recovery = await tools['freight.recovery_summary'].execute({ carrier: card.carrier, version: card.version }, call)
    const workpaper = await tools['freight.export'].execute({ carrier: card.carrier, version: card.version }, call)
    const dispute = await tools['freight.dispute'].execute({ carrier: card.carrier, version: card.version }, call)
    const zone = await tools['freight.zone_lookup'].execute({ zone_csv: zonesCsv, zone: 3 }, call)
    const ratecard = await tools['freight.ratecard_validate'].execute({ cards }, call)
    const accessorial = await tools['freight.accessorial_check'].execute(accessorials, call)

    return {
      sample: 'samples/quickstart/input/bills.csv',
      ratecard: { carrier: card.carrier, version: card.version },
      audit: {
        bills: audit.bills,
        variance_total_cents: audit.variance_total_cents,
        outliers: audit.outliers,
      },
      recovery: {
        shipments: recovery.shipments,
        overcharge_cents: recovery.overcharge_cents,
        undercharge_cents: recovery.undercharge_cents,
        net_cents: recovery.net_cents,
      },
      export: {
        rows: workpaper.rows,
        files: [path.basename(workpaper.path), path.basename(dispute.path)],
      },
      dispute: { shipments: dispute.shipments, variance_cents: dispute.variance_cents },
      zone: { zone: zone.zone, list_rate_cents: zone.list_rate_cents, found: zone.found },
      ratecard_issues: ratecard.issues,
      accessorials: {
        items: accessorial.items,
        total_cents: accessorial.total_cents,
        issues: accessorial.issues,
      },
    }
  } finally {
    await rm(baseDir, { recursive: true, force: true })
  }
}

/** Short Chinese labels for the summary only; the golden keeps the raw tool issue text. */
const ISSUE_LABEL = {
  E_FREIGHT_RATE_INVALID: '费率卡字段不合法',
  E_FREIGHT_RATE_OVERLAP: '费率卡版本生效期重叠',
  E_FREIGHT_ACCESSORIAL_DUPLICATE: '附加费重复',
  E_FREIGHT_ACCESSORIAL_UNKNOWN: '未知的附加费类型',
  E_FREIGHT_ACCESSORIAL_NOT_ALLOWED: '不在约定清单里',
  E_FREIGHT_ACCESSORIAL_VALUE: '附加费金额不合法',
  E_FREIGHT_ACCESSORIAL_CAP: '超过总额上限',
}

function summary(result) {
  console.log('dsh-freight-audit quickstart - 合成运费账单（不是真实承运商数据）')
  console.log(`账单 ${result.audit.bills} 票，异常 ${result.audit.outliers.length} 票，差额合计 ${result.audit.variance_total_cents} 分`)
  console.log(`追回：多收 ${result.recovery.overcharge_cents} 分 / 少收 ${Math.abs(result.recovery.undercharge_cents)} 分 / 净额 ${result.recovery.net_cents} 分`)
  console.log(`争议单 ${result.dispute.shipments} 票，差额 ${result.dispute.variance_cents} 分；底稿 ${result.export.rows} 行`)
  console.log(`zone ${result.zone.zone} 公布价 ${result.zone.list_rate_cents} 分（找到：${result.zone.found}）`)
  console.log(`费率卡 ${result.ratecard_issues.length} 个问题`)
  for (const issue of result.ratecard_issues) console.log(`  ${issue.code} ${issue.version}：${ISSUE_LABEL[issue.code] ?? issue.code}`)
  console.log(`附加费 ${result.accessorials.items} 项合计 ${result.accessorials.total_cents} 分，${result.accessorials.issues.length} 个问题`)
  for (const issue of result.accessorials.issues) console.log(`  ${issue.code}：${ISSUE_LABEL[issue.code] ?? issue.code}`)
}

const result = await run()

if (mode === 'json') {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} else if (mode === 'check') {
  const expected = JSON.parse(await readFile(expectedPath, 'utf8'))
  assert.deepEqual(result, expected)
  summary(result)
  console.log('golden samples/quickstart/expected/result.json matches')
  console.log('quickstart ok')
} else {
  summary(result)
  console.log('run with --check to compare against expected/result.json')
}
