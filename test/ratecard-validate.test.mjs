import test from 'node:test'
import assert from 'node:assert/strict'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }
const tools = Object.fromEntries(createTools({ rates: new T(), bills: new T(), disputes: new T(), baseDir: '/tmp/freight-rate' }).map((t) => [t.name, t]))
const exec = { callId: 'rate' }
const card = (over = {}) => ({ carrier: 'C1', version: 'v1', base_cents: 1000, per_kg_cents: 200, fuel_pct: 12.5, effective_from: '2026-01-01', effective_to: '2026-06-30', ...over })

test('a clean rate card has no issues', async () => {
  const r = await tools['freight.ratecard_validate'].execute({ cards: [card()] }, exec)
  assert.equal(r.cards, 1)
  assert.deepEqual(r.issues, [])
})

test('bad fuel share and inverted window are reported', async () => {
  const r = await tools['freight.ratecard_validate'].execute({ cards: [card({ fuel_pct: 150 }), card({ version: 'v2', effective_from: '2026-06-01', effective_to: '2026-01-01' })] }, exec)
  assert.equal(r.issues.filter((i) => i.code === 'E_FREIGHT_RATE_INVALID').length >= 2, true)
})

test('overlapping versions for one carrier are flagged, other carriers are not', async () => {
  const same = await tools['freight.ratecard_validate'].execute({ cards: [card(), card({ version: 'v2', effective_from: '2026-03-01', effective_to: '2026-12-31' })] }, exec)
  assert.equal(same.issues.filter((i) => i.code === 'E_FREIGHT_RATE_OVERLAP').length, 1)
  const other = await tools['freight.ratecard_validate'].execute({ cards: [card(), card({ carrier: 'C2', version: 'v2', effective_from: '2026-03-01', effective_to: '2026-12-31' })] }, exec)
  assert.equal(other.issues.filter((i) => i.code === 'E_FREIGHT_RATE_OVERLAP').length, 0)
})

test('missing carrier/version is reported', async () => {
  const r = await tools['freight.ratecard_validate'].execute({ cards: [card({ carrier: '', version: '' })] }, exec)
  assert.ok(r.issues.some((i) => i.code === 'E_FREIGHT_RATE_MISSING'))
})
