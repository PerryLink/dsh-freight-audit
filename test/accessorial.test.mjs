import test from 'node:test'
import assert from 'node:assert/strict'
import { ACCESSORIAL_TYPES, checkAccessorials } from '../lib/core/freight.js'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }
const tools = Object.fromEntries(createTools({ rates: new T(), bills: new T(), disputes: new T(), baseDir: '/tmp/freight-acc' }).map((t) => [t.name, t]))
const exec = { callId: 'acc' }

test('a clean accessorial list totals correctly', async () => {
  const r = await tools['freight.accessorial_check'].execute({ items: [{ type: 'fuel', amount_cents: 1200 }, { type: 'liftgate', amount_cents: 500 }] }, exec)
  assert.equal(r.items, 2)
  assert.equal(r.total_cents, 1700)
  assert.deepEqual(r.issues, [])
  assert.ok(ACCESSORIAL_TYPES.includes('fuel'))
})

test('unknown, duplicate and negative charges are reported', async () => {
  const r = await tools['freight.accessorial_check'].execute({ items: [
    { type: 'teleport', amount_cents: 100 },
    { type: 'detention', amount_cents: 100 },
    { type: 'detention', amount_cents: 200 },
    { type: 'fuel', amount_cents: -5 },
  ] }, exec)
  assert.ok(r.issues.some((i) => i.code === 'E_FREIGHT_ACCESSORIAL_UNKNOWN'))
  assert.ok(r.issues.some((i) => i.code === 'E_FREIGHT_ACCESSORIAL_DUPLICATE'))
  assert.ok(r.issues.some((i) => i.code === 'E_FREIGHT_ACCESSORIAL_VALUE'))
})

test('the agreed list and the cap are enforced', async () => {
  const r = await tools['freight.accessorial_check'].execute({ items: [{ type: 'detention', amount_cents: 900 }, { type: 'liftgate', amount_cents: 300 }], allowed: ['detention'], cap_cents: 1000 }, exec)
  assert.ok(r.issues.some((i) => i.code === 'E_FREIGHT_ACCESSORIAL_NOT_ALLOWED'))
  assert.ok(r.issues.some((i) => i.code === 'E_FREIGHT_ACCESSORIAL_CAP'))
})

test('the core function agrees with the tool', () => {
  const r = checkAccessorials({ items: [{ type: 'HAZMAT', amount_cents: 250 }] })
  assert.equal(r.total_cents, 250)
  assert.equal(r.issues.length, 0)
})
