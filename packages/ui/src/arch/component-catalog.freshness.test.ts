// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error — plain-ESM build tooling, run here to compare against the committed file
import { buildCatalog, serializeCatalog } from '../../scripts/catalog.mjs'
// @ts-expect-error — plain-ESM build tooling, the generator's injectable file reader
import { readInput } from '../../scripts/catalog/inputs.mjs'
// @ts-expect-error — plain-ESM build tooling, shared with scripts/catalog.mjs
import { maturityStatuses, resolveStatuses } from '../../scripts/catalog/stories.mjs'
import graph from './arch-graph.json'
import catalog from './component-catalog.json'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPO_ROOT = path.resolve(PKG_ROOT, '../..')
const FIX = 'Run `pnpm catalog` and commit src/arch/component-catalog.json.'

const vocabulary = (): string[] =>
  maturityStatuses(readFileSync(path.join(PKG_ROOT, 'MATURITY.md'), 'utf8')) as string[]

type Item = { file: string; name?: string }
type Catalog = { entries: Item[]; excluded: Item[] }

const STORY = 'packages/ui/src/components/ui/date-time/DateTime.stories.tsx'

/** Names of the entries (or files, for excluded ones) whose block differs between two catalogs. */
function differingEntries(committed: Catalog, fresh: Catalog): string[] {
  const label = (item: Item) => item.name ?? item.file
  const blocks = (c: Catalog) =>
    new Map([...c.entries, ...c.excluded].map((item) => [label(item), JSON.stringify(item)]))
  const [a, b] = [blocks(committed), blocks(fresh)]
  return [...new Set([...a.keys(), ...b.keys()])].filter((key) => a.get(key) !== b.get(key)).sort()
}

const build = (read?: (repoRoot: string, rel: string) => string): Catalog =>
  JSON.parse(serializeCatalog(buildCatalog(REPO_ROOT, read)))

const readWith =
  (edit: (text: string) => string) =>
  (repoRoot: string, rel: string): string => {
    const text = readInput(repoRoot, rel) as string
    return rel === STORY ? edit(text) : text
  }

describe('component-catalog.json freshness', () => {
  let fresh: Catalog

  beforeAll(() => {
    fresh = build()
  })

  it('matches a fresh build, entry by entry', () => {
    const differing = differingEntries(catalog as Catalog, fresh)
    expect(
      differing,
      `component-catalog.json differs from the sources for: ${differing.join(', ')}. Run \`pnpm catalog\`.`
    ).toEqual([])
  })

  it('names the entry whose story status tag changed', () => {
    const changed = build(readWith((t) => t.replace('status:candidate', 'status:stable')))
    expect(differingEntries(catalog as Catalog, changed)).toEqual(['DateTime'])
  })

  it('ignores a story args change', () => {
    const changed = build(readWith((t) => t.replace("format: 'datetime'", "format: 'date'")))
    expect(differingEntries(catalog as Catalog, changed)).toEqual([])
  })

  it('fails when a committed entry lost its storyIds', () => {
    const emptied: Catalog = {
      ...(catalog as Catalog),
      entries: (catalog as Catalog).entries.map((entry) =>
        entry.name === 'DateTime' ? { ...entry, storyIds: [] } : entry
      ),
    }
    expect(differingEntries(emptied, fresh)).toEqual(['DateTime'])
  })

  it('carries no global hash, so two PRs that touch different components do not conflict', () => {
    expect(Object.keys(catalog).sort()).toEqual(['entries', 'excluded', 'schema'])
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
