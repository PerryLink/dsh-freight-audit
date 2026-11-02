import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { buildDisputeCsv, csvNumberField, csvTextField, DISPUTE_CSV_HEADER } from '../lib/core/freight.js'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k) { return this.map.get(k) }; entries() { return this.map.entries() }; get size() { return this.map.size }; async put(k, v) { this.map.set(k, v) } }

const bill = (over = {}) => ({ shipment_id: 'S1', carrier: 'C', version: 'v1', weight_kg: 10, billed_cents: 2300, expected_cents: 2200, variance_cents: 100, created_at: '2026-01-01T00:00:00.000Z', ...over })

test('a carrier name containing a comma is quoted', () => {
  assert.equal(csvTextField('ACME, Inc.'), '"ACME, Inc."')
})

test('a reference starting with = is neutralised as a formula', () => {
  assert.equal(csvTextField('=SUM(A1:A2)'), "'=SUM(A1:A2)")
  assert.equal(csvTextField('+cmd'), "'+cmd")
  assert.equal(csvTextField('-cmd'), "'-cmd")
  assert.equal(csvTextField('@cmd'), "'@cmd")
})

test('embedded quotes are doubled and newlines are quoted', () => {
  assert.equal(csvTextField('He said "pay, now"'), '"He said ""pay, now"""')
  assert.equal(csvTextField('line1\nline2'), '"line1\nline2"')
})

test('negative numeric fields stay numeric instead of being formula-prefixed', () => {
  assert.equal(csvNumberField(-100), '-100')
  const csv = buildDisputeCsv([bill({ variance_cents: -100 })])
  assert.equal(csv, `${DISPUTE_CSV_HEADER}\nS1,10,2300,2200,-100\n`)
})

test('the dispute tool escapes a formula reference taken from bill text', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-freight-csv-'))
  try {
    const by = Object.fromEntries(createTools({ rates: new T(), bills: new T(), baseDir: dir }).map((tool) => [tool.name, tool]))
    const exec = { callId: 'csv' }
    await by['freight.ratecard'].execute({ action: 'set', carrier: 'C', version: 'v1', base_cents: 1000, per_kg_cents: 100, fuel_pct: 10, effective_from: '2026-01-01' }, exec)
    await by['freight.audit'].execute({ carrier: 'C', version: 'v1', bills_csv: 'shipment_id,weight_kg,billed\n=SUM(A1:A2),10,23.00' }, exec)
    const result = await by['freight.dispute'].execute({ carrier: 'C', version: 'v1' }, exec)
    const csv = await readFile(result.path, 'utf8')
    assert.equal(csv, `${DISPUTE_CSV_HEADER}\n'=SUM(A1:A2),10,2300,2200,100\n`)
    assert.ok(!/(^|\n)=/.test(csv), 'no CSV field may start with a raw =')
  } finally { await rm(dir, { recursive: true, force: true }) }
})
