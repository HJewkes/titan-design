// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — plain-ESM build tooling, run here to record what it reads
import { buildCatalog } from '../../scripts/catalog.mjs'
import {
  catalogInputsHash,
  inputFiles,
  readInput,
  // @ts-expect-error — plain-ESM build tooling, shared with scripts/catalog.mjs
} from '../../scripts/catalog/inputs-hash.mjs'
// @ts-expect-error — plain-ESM build tooling, shared with scripts/catalog.mjs
import { maturityStatuses, resolveStatuses } from '../../scripts/catalog/stories.mjs'
import graph from './arch-graph.json'
import catalog from './component-catalog.json'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPO_ROOT = path.resolve(PKG_ROOT, '../..')
const FIX = 'Run `pnpm catalog` and commit src/arch/component-catalog.json.'

const vocabulary = (): string[] =>
  maturityStatuses(readFileSync(path.join(PKG_ROOT, 'MATURITY.md'), 'utf8')) as string[]

describe('component-catalog.json freshness', () => {
  it('records the inputs hash it was generated from', () => {
    expect(catalog.inputsHash).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it('matches the current arch-graph.json, MATURITY.md, entry files and story files', () => {
    expect(
      catalog.inputsHash,
      'component-catalog.json is stale: an input changed since it was generated. ' + FIX
    ).toBe(catalogInputsHash(REPO_ROOT))
  })

  it('hashes every file the generator reads', () => {
    const read = new Set<string>()
    buildCatalog(REPO_ROOT, (root: string, rel: string): string => {
      read.add(rel)
      return readInput(root, rel) as string
    })
    const hashed = inputFiles(REPO_ROOT, graph) as string[]
    expect(
      [...read].filter((file) => !hashed.includes(file)),
      'scripts/catalog.mjs reads a file that inputFiles() in scripts/catalog/inputs-hash.mjs ' +
        'does not hash. Add it there, then run `pnpm catalog`.'
    ).toEqual([])
  })

  it('hashes the generator source, so a generator edit stales the catalog', () => {
    expect(inputFiles(REPO_ROOT, graph)).toEqual(
      expect.arrayContaining([
        'packages/ui/scripts/catalog.mjs',
        'packages/ui/scripts/catalog/entries.mjs',
        'packages/ui/scripts/catalog/inputs-hash.mjs',
        'packages/ui/scripts/catalog/stories.mjs',
      ])
    )
  })

  it('accounts for every arch-graph component exactly once', () => {
    const listed = [...catalog.entries, ...catalog.excluded].map((item) => item.file).sort()
    expect(listed, 'component-catalog.json lists a different component set. ' + FIX).toEqual(
      graph.components.map((component) => component.file).sort()
    )
  })

  it('gives every entry a status from the MATURITY.md vocabulary', () => {
    const allowed = vocabulary()
    for (const entry of catalog.entries) {
      expect(
        allowed,
        `${entry.name} has status "${entry.status}", which MATURITY.md does not define. ` +
          'Fix the status:* tag on its story meta. ' +
          FIX
      ).toContain(entry.status)
    }
  })
})

describe('catalog status resolution', () => {
  it('reads the four statuses from the MATURITY.md table', () => {
    expect(vocabulary()).toEqual(['candidate', 'lab', 'review', 'stable'])
  })

  it('inherits the project default when the meta declares no status', () => {
    expect(resolveStatuses(['status:review'], ['autodocs'])).toEqual(['review'])
  })

  it('takes the meta status over the default, with or without the negation', () => {
    expect(resolveStatuses(['status:review'], ['status:stable', '!status:review'])).toEqual([
      'stable',
    ])
    expect(resolveStatuses(['status:review'], ['status:candidate'])).toEqual(['candidate'])
  })

  it('resolves to no status when the meta only negates the default', () => {
    expect(resolveStatuses(['status:review'], ['!status:review'])).toEqual([])
  })
})
