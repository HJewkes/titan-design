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

type Prop = { name: string; default: string | null }
type Item = { file: string; name?: string; props?: Prop[] }
type Catalog = { entries: Item[]; excluded: Item[] }

const STORY = 'packages/ui/src/components/ui/date-time/DateTime.stories.tsx'
const ALERT = 'packages/ui/src/components/ui/alert/Alert.tsx'
const DATE_TIME = 'packages/ui/src/components/ui/date-time/DateTime.tsx'
/** The components the sensitivity cases edit; their rebuilds run docgen over these alone. */
const SWEEP = new Set([ALERT, DATE_TIME])
const DOCGEN_TIMEOUT = 60_000

/** Names of the entries (or files, for excluded ones) whose block differs between two catalogs. */
function differingEntries(committed: Catalog, fresh: Catalog): string[] {
  const label = (item: Item) => item.name ?? item.file
  const blocks = (c: Catalog) =>
    new Map([...c.entries, ...c.excluded].map((item) => [label(item), JSON.stringify(item)]))
  const [a, b] = [blocks(committed), blocks(fresh)]
  return [...new Set([...a.keys(), ...b.keys()])].filter((key) => a.get(key) !== b.get(key)).sort()
}

type Read = (repoRoot: string, rel: string) => string

const build = (
  read?: Read,
  overlay?: Record<string, string>,
  include?: (component: Item) => boolean
): Catalog => JSON.parse(serializeCatalog(buildCatalog(REPO_ROOT, read, overlay, include)))

/** `full` with the SWEEP components rebuilt from the edited sources; every other block is kept. */
function rebuild(full: Catalog, read?: Read, overlay?: Record<string, string>): Catalog {
  const swept = build(read, overlay, (component) => SWEEP.has(component.file))
  const kept = (items: Item[]) => items.filter((item) => !SWEEP.has(item.file))
  expect(
    swept.entries.map((entry) => entry.file).sort(),
    'the sweep rebuilt the wrong set'
  ).toEqual([...SWEEP].sort())
  return {
    entries: [...kept(full.entries), ...swept.entries],
    excluded: [...kept(full.excluded), ...swept.excluded],
  }
}

/** `full` rebuilt with Alert.tsx read as `edit` returns it; fails if the edit is a no-op. */
function buildWithAlert(full: Catalog, edit: (text: string) => string): Catalog {
  const source = readInput(REPO_ROOT, ALERT) as string
  const edited = edit(source)
  expect(edited, 'the Alert.tsx overlay did not change the source').not.toEqual(source)
  return rebuild(full, undefined, { [ALERT]: edited })
}

const readWith =
  (edit: (text: string) => string): Read =>
  (repoRoot, rel) => {
    const text = readInput(repoRoot, rel) as string
    return rel === STORY ? edit(text) : text
  }

describe('component-catalog.json freshness', () => {
  let fresh: Catalog

  beforeAll(() => {
    fresh = build()
  }, DOCGEN_TIMEOUT)

  it('matches a fresh build, entry by entry', () => {
    const differing = differingEntries(catalog as Catalog, fresh)
    expect(
      differing,
      `component-catalog.json differs from the sources for: ${differing.join(', ')}. Run \`pnpm catalog\`.`
    ).toEqual([])
  })

  it(
    'names the entry whose story status tag changed',
    () => {
      const changed = rebuild(
        fresh,
        readWith((t) => t.replace('status:candidate', 'status:stable'))
      )
      expect(differingEntries(catalog as Catalog, changed)).toEqual(['DateTime'])
    },
    DOCGEN_TIMEOUT
  )

  it(
    'ignores a story args change',
    () => {
      const changed = rebuild(
        fresh,
        readWith((t) => t.replace("format: 'datetime'", "format: 'date'"))
      )
      expect(differingEntries(catalog as Catalog, changed)).toEqual([])
    },
    DOCGEN_TIMEOUT
  )

  it('fails when a committed entry lost its storyIds', () => {
    const emptied: Catalog = {
      ...(catalog as Catalog),
      entries: (catalog as Catalog).entries.map((entry) =>
        entry.name === 'DateTime' ? { ...entry, storyIds: [] } : entry
      ),
    }
    expect(differingEntries(emptied, fresh)).toEqual(['DateTime'])
  })

  it(
    'ignores an edit inside the Alert function body',
    () => {
      const changed = buildWithAlert(fresh, (t) =>
        t.replace("const isSolid = variant === 'solid'", "const isSolid = 'solid' === variant")
      )
      expect(differingEntries(catalog as Catalog, changed)).toEqual([])
    },
    DOCGEN_TIMEOUT
  )

  it(
    'names Alert when the first sentence of its JSDoc changes',
    () => {
      const changed = buildWithAlert(fresh, (t) =>
        t.replace(
          'Alert component for displaying status messages.',
          'Alert component for status callouts.'
        )
      )
      expect(differingEntries(catalog as Catalog, changed)).toEqual(['Alert'])
    },
    DOCGEN_TIMEOUT
  )

  it(
    'names Alert when AlertProps gains a prop',
    () => {
      const changed = buildWithAlert(fresh, (t) =>
        t.replace(
          '  /** Visual variant */',
          '  /** Whether the alert is dismissed. */\n  isDismissed?: boolean\n  /** Visual variant */'
        )
      )
      expect(differingEntries(catalog as Catalog, changed)).toEqual(['Alert'])
    },
    DOCGEN_TIMEOUT
  )

  it('records Alert props with their defaults', () => {
    const alert = (catalog as Catalog).entries.find((entry) => entry.name === 'Alert')
    expect(alert?.props?.length).toBeGreaterThan(0)
    expect(alert?.props?.find((prop) => prop.name === 'status')?.default).toBe('info')
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
