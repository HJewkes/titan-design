// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import componentCatalog from '../../arch/component-catalog.json'
import * as router from '../../visual-router'
// @ts-expect-error — plain-ESM build tooling, the digest `pnpm visual-router:digest` writes
import { DIGEST_PATH, renderVisualRouterDigest } from '../../../scripts/visual-router-digest.mjs'
import type { VisualType } from './types'

type CatalogEntry = { name: string; file: string; storyIds: string[] }

const ENTRIES = (componentCatalog as unknown as { entries: CatalogEntry[] }).entries
const ENTRY_BY_NAME = new Map(ENTRIES.map((entry) => [entry.name, entry]))
const COMPONENTS_DIR = 'packages/ui/src/components/'
const render = (r: typeof router): string => renderVisualRouterDigest(r) as string

/** The components/ directory a gap type's basis names (`ui/charts/sequence`), if any. */
function basisDir(entry: VisualType): string | null {
  const match = /^(ui\/[\w/-]+|charts\/[\w-]+)/.exec(entry.basis)
  if (!match) return null
  return match[1].startsWith('ui/') ? match[1] : `ui/${match[1]}`
}

/** Catalogue types whose status disagrees with component-catalog.json, with the reason. */
function statusDrift(catalogue: readonly VisualType[]): string[] {
  return catalogue.flatMap((entry) => {
    if (entry.status === 'have') {
      const found = entry.component ? ENTRY_BY_NAME.get(entry.component) : undefined
      if (!found) return [`${entry.id}: have, but ${entry.component} is not in the catalog`]
      if (entry.storyId && !found.storyIds.includes(entry.storyId)) {
        return [`${entry.id}: story ${entry.storyId} is not one of ${entry.component}'s stories`]
      }
      return []
    }
    const dir = basisDir(entry)
    const built = dir && ENTRIES.find((e) => e.file.startsWith(`${COMPONENTS_DIR}${dir}/`))
    return built ? [`${entry.id}: ${entry.status}, but ${built.name} is in ${dir}`] : []
  })
}

describe('visual router status against component-catalog.json', () => {
  it('marks a type have exactly when its component is in the catalog', () => {
    expect(statusDrift(router.CATALOGUE)).toEqual([])
  })

  it('flags a have type whose component is not in the catalog', () => {
    const [sequence] = router.CATALOGUE.filter((entry) => entry.id === 'sequence')
    const flipped = { ...sequence, status: 'have' as const, component: 'Sequence' }

    expect(statusDrift([flipped])).toEqual(['sequence: have, but Sequence is not in the catalog'])
  })

  it('flags a gap type whose basis directory already holds a component', () => {
    const [timeline] = router.CATALOGUE.filter((entry) => entry.id === 'timeline')
    const unflipped = { ...timeline, status: 'new' as const, component: null, storyId: null }

    expect(statusDrift([unflipped])).toEqual([
      'timeline: new, but Timeline is in ui/charts/timeline',
    ])
  })
})

describe('docs/visual-router.md', () => {
  it('matches the router source, byte for byte', () => {
    expect(
      readFileSync(DIGEST_PATH, 'utf8'),
      'Run `pnpm build && pnpm visual-router:digest`.'
    ).toBe(render(router))
  })

  it('lists every pattern and every type', () => {
    const digest = render(router)
    const ids = [...router.PATTERNS, ...router.CATALOGUE].map((entry) => `(\`${entry.id}\`)`)

    expect(ids.filter((id) => !digest.includes(id))).toEqual([])
  })

  it('changes when one type changes status', () => {
    const catalogue = router.CATALOGUE.map((entry) =>
      entry.id === 'radar' ? { ...entry, status: 'skip' as const } : entry
    )

    expect(render({ ...router, CATALOGUE: catalogue })).not.toBe(render(router))
  })
})
