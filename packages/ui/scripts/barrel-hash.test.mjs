import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { componentBarrelHash, writeBarrelHash } from './barrel-hash.mjs'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GRAPH = path.join(PKG_ROOT, 'src/arch/arch-graph.json')

describe('writeBarrelHash', () => {
  let dir
  let copy

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'barrel-hash-'))
    copy = path.join(dir, 'arch-graph.json')
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('replaces only the hash value and leaves every other byte unchanged', () => {
    const stale = fs
      .readFileSync(GRAPH, 'utf8')
      .replace(/sha256:[0-9a-f]{64}/, 'sha256:' + '0'.repeat(64))
    fs.writeFileSync(copy, stale)

    const hash = writeBarrelHash(PKG_ROOT, copy)

    expect(hash).toBe(componentBarrelHash(PKG_ROOT))
    expect(fs.readFileSync(copy, 'utf8')).toBe(
      stale.replace('0'.repeat(64), hash.slice('sha256:'.length))
    )
  })

  it('preserves a trailing newline', () => {
    fs.writeFileSync(copy, '{\n  "componentBarrelHash": "sha256:old",\n  "x": 1\n}\n')

    writeBarrelHash(PKG_ROOT, copy)

    expect(fs.readFileSync(copy, 'utf8')).toMatch(/"x": 1\n\}\n$/)
  })

  it('refuses a file with no hash field', () => {
    fs.writeFileSync(copy, '{}\n')

    expect(() => writeBarrelHash(PKG_ROOT, copy)).toThrow(/componentBarrelHash/)
  })
})
