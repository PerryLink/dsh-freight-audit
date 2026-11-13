import test from 'node:test'
import assert from 'node:assert/strict'
import { createTools } from '../lib/plugin/tools.js'
class T { map=new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }
test('recovery summary over/under', async () => {
  const tools = createTools({ rates: new T(), bills: new T(), baseDir: '/tmp/freight-recovery' })
  const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
  await by['freight_ratecard'].execute({ action: 'set', carrier: 'C', version: 'v1', base_cents: 1000, per_kg_cents: 100, fuel_pct: 10, effective_from: '2026-01-01' }, { callId: 'r' })
  await by['freight_audit'].execute({ carrier: 'C', version: 'v1', bills_csv: 'shipment_id,weight_kg,billed\nS1,10,23.00\nS2,10,22.00' }, { callId: 'r' })
  const result = await by['freight_recovery_summary'].execute({ carrier: 'C', version: 'v1' }, { callId: 'r' })
  assert.equal(result.shipments, 2)
  assert.equal(result.overcharge_cents, 100)
  assert.equal(result.net_cents, 100)
})
