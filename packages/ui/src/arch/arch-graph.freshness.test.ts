import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — plain-ESM build tooling, shared with scripts/arch-graph.mjs
import { componentBarrelHash } from '../../scripts/barrel-hash.mjs'
import graph from './arch-graph.json'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPO_ROOT = path.resolve(PKG_ROOT, '../..')

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

  it('tallies every configured consumer, so none can be silently scored as zero usage', () => {
    const configured = graph.summary.consumers.map((c) => c.name)
    for (const component of graph.components) {
      expect(
        Object.keys(component.xproj)
          .filter((k) => k !== 'total')
          .sort(),
        `${component.name}.xproj is missing a configured consumer. A consumer absent from ` +
          'the tally scores 0 usage, which lands its components on the `dead` list.'
      ).toEqual([...configured].sort())
    }
  })

  // The consumer list is committed precisely so every machine computes the same
  // `dead` verdicts. Adding a consumer without regenerating leaves a graph that
  // looks authoritative and is wrong about the repo that was just added.
  it('was generated from the committed consumer list', () => {
    const shared = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'scripts/arch.config.json'), 'utf8')
    ) as { consumers: { name: string }[] }

    expect(
      graph.summary.consumers.map((c) => c.name).sort(),
      'arch-graph.json was generated from a different consumer set than ' +
        'scripts/arch.config.json. Run `pnpm arch:graph -- --reindex` and commit the result.'
    ).toEqual(shared.consumers.map((c) => c.name).sort())
  })
})
