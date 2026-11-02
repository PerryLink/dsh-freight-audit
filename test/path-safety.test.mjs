import test from 'node:test'
import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { safeExportPath } from '../lib/core/safe-path.js'
import { FreightError } from '../lib/core/freight.js'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k) { return this.map.get(k) }; entries() { return this.map.entries() }; get size() { return this.map.size }; async put(k, v) { this.map.set(k, v) } }

const temp = () => mkdtemp(path.join(os.tmpdir(), 'dsh-freight-path-'))
const code = (expected) => (error) => {
  assert.ok(error instanceof FreightError)
  assert.equal(error.code, expected)
  return true
}

test('a normal export filename resolves inside the base directory and is writable', async () => {
  const dir = await temp()
  try {
    const file = await safeExportPath(dir, 'freight-C-v1.xlsx')
    assert.equal(file, path.join(await realpath(dir), 'freight-C-v1.xlsx'))
    await writeFile(file, 'ok')
    assert.equal(await readFile(file, 'utf8'), 'ok')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('parent traversal is rejected with E_FREIGHT_PATH_INVALID', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, '../evil.xlsx'), code('E_FREIGHT_PATH_INVALID'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a separator in the filename is rejected with E_FREIGHT_PATH_INVALID', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, 'a/b.xlsx'), code('E_FREIGHT_PATH_INVALID'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('an overlong filename is rejected with E_FREIGHT_PATH_INVALID', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, `${'a'.repeat(121)}.xlsx`), code('E_FREIGHT_PATH_INVALID'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a dot-only filename is rejected by the resolved-prefix check', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, '..'), code('E_FREIGHT_PATH_NOT_ALLOWED'))
    await assert.rejects(() => safeExportPath(dir, '.'), code('E_FREIGHT_PATH_NOT_ALLOWED'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a symlinked export directory is re-anchored on its realpath', async () => {
  const dir = await temp()
  try {
    const real = path.join(dir, 'real')
    const link = path.join(dir, 'link')
    await mkdir(real)
    await symlink(real, link, 'dir')
    const file = await safeExportPath(link, 'ok.xlsx')
    assert.ok(file.startsWith((await realpath(real)) + path.sep), file)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('the export tool writes the xlsx inside the exports directory', async () => {
  const dir = await temp()
  try {
    const baseDir = path.join(dir, 'store')
    const by = Object.fromEntries(createTools({ rates: new T(), bills: new T(), baseDir }).map((tool) => [tool.name, tool]))
    const exec = { callId: 'path' }
    await by['freight.ratecard'].execute({ action: 'set', carrier: 'C', version: 'v1', base_cents: 1000, per_kg_cents: 100, fuel_pct: 10, effective_from: '2026-01-01' }, exec)
    await by['freight.audit'].execute({ carrier: 'C', version: 'v1', bills_csv: 'shipment_id,weight_kg,billed\nS1,10,23.00\nS2,10,22.00' }, exec)
    const result = await by['freight.export'].execute({ carrier: 'C', version: 'v1' }, exec)
    assert.equal(result.path, path.join(await realpath(path.join(baseDir, 'exports')), 'freight-C-v1.xlsx'))
    assert.equal(result.rows, 2)
    assert.ok((await stat(result.path)).isFile())
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('the export and dispute tools refuse a traversal carrier', async () => {
  const dir = await temp()
  try {
    const baseDir = path.join(dir, 'store')
    const by = Object.fromEntries(createTools({ rates: new T(), bills: new T(), baseDir }).map((tool) => [tool.name, tool]))
    const exec = { callId: 'path' }
    const carrier = 'x/../../evil'
    await by['freight.ratecard'].execute({ action: 'set', carrier, version: 'v1', base_cents: 1000, per_kg_cents: 100, fuel_pct: 10, effective_from: '2026-01-01' }, exec)
    await by['freight.audit'].execute({ carrier, version: 'v1', bills_csv: 'shipment_id,weight_kg,billed\nS1,10,23.00' }, exec)
    await assert.rejects(() => by['freight.export'].execute({ carrier, version: 'v1' }, exec), code('E_FREIGHT_PATH_INVALID'))
    await assert.rejects(() => by['freight.dispute'].execute({ carrier, version: 'v1' }, exec), code('E_FREIGHT_PATH_INVALID'))
    await assert.rejects(() => access(path.join(baseDir, 'evil-v1.xlsx')))
    await assert.rejects(() => access(path.join(baseDir, 'evil-v1.csv')))
  } finally { await rm(dir, { recursive: true, force: true }) }
})
