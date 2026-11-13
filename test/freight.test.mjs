import test from'node:test';import assert from'node:assert/strict';import{mkdtemp,rm}from'node:fs/promises';import os from'node:os';import path from'node:path';import{createTools}from'../lib/plugin/tools.js'
class T{map=new Map();get(k){return this.map.get(k)};entries(){return this.map.entries()};get size(){return this.map.size};async put(k,v){this.map.set(k,v)}}
test('ratecard audit overlap',async()=>{const d=await mkdtemp(path.join(os.tmpdir(),'fr-'));try{const ts=createTools({rates:new T(),bills:new T(),baseDir:d});const b=Object.fromEntries(ts.map(t=>[t.name,t]));const e={callId:'c'};await b['freight_ratecard'].execute({action:'set',carrier:'C',version:'v1',base_cents:1000,per_kg_cents:100,fuel_pct:10,effective_from:'2026-01-01'},e);const csv='shipment_id,weight_kg,billed\nS1,10,23.00\nS2,10,22.00';const a=await b['freight_audit'].execute({carrier:'C',version:'v1',bills_csv:csv},e);assert.equal(a.bills,2);assert.equal(a.outliers.length,1);assert.equal(a.variance_total_cents,100);await assert.rejects(()=>b['freight_ratecard'].execute({action:'set',carrier:'C',version:'v2',base_cents:1,per_kg_cents:1,fuel_pct:0,effective_from:'2026-02-01'},e),/E_FREIGHT_RATE_OVERLAP/)}finally{await rm(d,{recursive:true,force:true})}})
test('bad rate missing',async()=>{const ts=createTools({rates:new T(),bills:new T(),baseDir:'/tmp/f'});const b=Object.fromEntries(ts.map(t=>[t.name,t]));await assert.rejects(()=>b['freight_audit'].execute({carrier:'C',version:'x',bills_csv:'shipment_id,weight_kg,billed\nS,1,1'},{callId:'c'}),/E_FREIGHT_RATE_MISSING/)})

test('dispute CSV for variance shipments', async () => {
  const d = await mkdtemp(path.join(os.tmpdir(), 'fr-dispute-'))
  try {
    const ts = createTools({ rates: new T(), bills: new T(), baseDir: d })
    const b = Object.fromEntries(ts.map((t) => [t.name, t]))
    const e = { callId: 'c' }
    await b['freight_ratecard'].execute({ action: 'set', carrier: 'C', version: 'v1', base_cents: 1000, per_kg_cents: 100, fuel_pct: 10, effective_from: '2026-01-01' }, e)
    await b['freight_audit'].execute({ carrier: 'C', version: 'v1', bills_csv: 'shipment_id,weight_kg,billed\nS1,10,23.00\nS2,10,22.00' }, e)
    const result = await b['freight_dispute'].execute({ carrier: 'C', version: 'v1' }, e)
    assert.equal(result.shipments, 1)
    assert.equal(result.variance_cents, 100)
    assert.match(result.path, /freight-dispute-C-v1\.csv$/)
  } finally { await rm(d, { recursive: true, force: true }) }
})
