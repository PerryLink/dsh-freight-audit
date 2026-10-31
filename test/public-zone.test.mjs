import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createTools } from '../lib/plugin/tools.js'

class T { map=new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }

test('public MIT UPS zone rate lookup', async () => {
  const csv = readFileSync('fixtures/public/mit/ground_40lb_list.csv', 'utf8')
  const tools = createTools({ rates: new T(), bills: new T(), baseDir: '/tmp/freight-zone' })
  const lookup = tools.find((tool) => tool.name === 'freight.zone_lookup')
  const result = await lookup.execute({ zone_csv: csv, zone: 3 }, { callId: 'zone' })
  assert.equal(result.found, true)
  assert.equal(result.list_rate_cents, 2327)
})
