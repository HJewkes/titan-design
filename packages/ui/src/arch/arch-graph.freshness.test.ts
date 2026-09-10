import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — plain-ESM build tooling, shared with scripts/arch-graph.mjs
import { componentBarrelHash } from '../../scripts/barrel-hash.mjs'
import graph from './arch-graph.json'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('arch-graph.json freshness', () => {
  it('records the barrel hash it was generated from', () => {
    expect(graph.componentBarrelHash).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it('matches the current component barrels', () => {
    expect(
      graph.componentBarrelHash,
      'arch-graph.json is stale: a component barrel changed since it was generated. ' +
        'Run `pnpm arch:graph -- --reindex` from the repo root and commit the result.'
    ).toBe(componentBarrelHash(PKG_ROOT))
  })
})
