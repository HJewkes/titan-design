import { describe, expect, it } from 'vitest'
import {
  FIXTURE_SHA,
  HOSTILE_CASES,
  VERY_LARGE_ROWS,
  fixtures,
  type HierarchyNode,
  type TreeFixture,
} from './fixtures'

/** Ids of rows whose `parentId` names no row in the same list. */
const unresolvedParents = (nodes: readonly HierarchyNode[]): string[] => {
  const ids = new Set(nodes.map((n) => n.id))
  return nodes.filter((n) => n.parentId !== null && !ids.has(n.parentId)).map((n) => n.id)
}

const childrenOf = (nodes: readonly HierarchyNode[], id: string): HierarchyNode[] =>
  nodes.filter((n) => n.parentId === id)

const levelOf = (nodes: readonly HierarchyNode[], id: string): number => {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  let level = 1
  for (let n = byId.get(id); n?.parentId; n = byId.get(n.parentId)) level++
  return level
}

const all: Array<[string, TreeFixture]> = Object.entries(fixtures)
const wellFormed = all.filter(([, fx]) => !fx.hostile)

describe('TreeView fixtures', () => {
  it('pins a full commit sha', () => {
    expect(FIXTURE_SHA).toMatch(/^[0-9a-f]{40}$/)
  })

  describe.each(wellFormed)('well-formed fixture %s', (_key, fx) => {
    it('resolves every parentId to a row in the same fixture', () => {
      expect(unresolvedParents(fx.nodes)).toEqual([])
    })

    it('has unique ids and lists every parent before its children', () => {
      const seen = new Set<string>()
      for (const node of fx.nodes) {
        expect(seen.has(node.id), node.id).toBe(false)
        if (node.parentId !== null) expect(seen.has(node.parentId), node.id).toBe(true)
        seen.add(node.id)
      }
    })

    it('never loads more children than childCount says exist', () => {
      for (const node of fx.nodes) {
        expect(childrenOf(fx.nodes, node.id).length, node.id).toBeLessThanOrEqual(
          node.childCount ?? 0
        )
      }
    })

    it('labels every synthetic row, and only fixtures that admit to synthetic rows have them', () => {
      const synthetic = fx.nodes.some((n) => n.data.synthetic)
      expect(synthetic).toBe(fx.source !== 'real')
      if (synthetic) expect(fx.label).toMatch(/synthetic/i)
    })
  })

  it('catches a broken copy of a fixture, so the parent check is not vacuous', () => {
    const broken = fixtures.deep.nodes.map((n) =>
      n.id === fixtures.deep.revealId ? { ...n, parentId: 'packages/code-graph/src/missing' } : n
    )
    expect(unresolvedParents(broken)).toEqual([fixtures.deep.revealId])
  })

  it('gives every Default package unloaded children', () => {
    const packages = fixtures.default.nodes.filter((n) => n.kind === 'package')
    expect(packages).toHaveLength(20)
    for (const pkg of packages) {
      expect(pkg.childCount).toBeGreaterThan(0)
      expect(childrenOf(fixtures.default.nodes, pkg.id)).toEqual([])
    }
  })

  it.each([
    ['packages/code-graph', fixtures.deep.nodes],
    ['packages/agent-lifecycle', fixtures.longLabel.nodes],
  ])('rolls the embedded files of %s up to its Default row', (pkg, nodes) => {
    const top = fixtures.default.nodes.find((n) => n.id === pkg)!
    const children = childrenOf(nodes, pkg)
    const loc = children.reduce((sum, n) => sum + (n.data.values.loc ?? 0), 0)
    expect(children).toHaveLength(top.childCount!)
    expect(loc).toBe(top.data.values.loc)
  })

  it('reveals the Deep target five levels down', () => {
    const { nodes, revealId } = fixtures.deep
    expect(levelOf(nodes, revealId)).toBe(5)
    expect(nodes.find((n) => n.id === revealId)?.data.depth).toBe(5)
  })

  it('gives the Wide root 46 children', () => {
    expect(childrenOf(fixtures.wide.nodes, fixtures.wide.rootId)).toHaveLength(46)
  })

  it('has a single leaf root in One item and no rows in Empty', () => {
    expect(fixtures.oneItem.nodes).toEqual([
      expect.objectContaining({
        parentId: null,
        childCount: 0,
        data: expect.objectContaining({ values: { loc: 3 } }),
      }),
    ])
    expect(fixtures.empty.nodes).toEqual([])
  })

  it('gives every null value in Null with reason a reason', () => {
    const reasons = new Set<string>()
    for (const { data } of fixtures.nullWithReason.nodes) {
      for (const [metric, value] of Object.entries(data.values)) {
        if (value === null) {
          expect(data.missing?.[metric], data.path).toBeDefined()
          reasons.add(data.missing![metric]!)
        }
      }
    }
    expect([...reasons].sort()).toEqual(['no-rollup', 'not-applicable'])
  })

  it('has no deltas in Missing baseline and incomparable deltas in Incomparable baseline', () => {
    expect(fixtures.missingBaseline.nodes.every((n) => n.data.deltas === undefined)).toBe(true)
    expect(fixtures.incomparableBaseline.nodes.every((n) => n.data.comparable === false)).toBe(true)
  })

  it('puts the long label at dense density in a narrow tree', () => {
    const { nodes, revealId, density, width } = fixtures.longLabel
    expect(nodes.find((n) => n.id === revealId)?.label).toBe('sqlite-execution-ledger.test.ts')
    expect(density).toBe('dense')
    expect(width).toBeLessThanOrEqual(320)
  })

  describe('Very large', () => {
    const { nodes, isTruncated } = fixtures.veryLarge

    it(`has exactly ${VERY_LARGE_ROWS} rows and is truncated`, () => {
      expect(nodes).toHaveLength(VERY_LARGE_ROWS)
      expect(isTruncated).toBe(true)
    })

    it('drops deep rows at the cap, so some directories have unloaded children', () => {
      const short = nodes.filter(
        (n) => n.kind === 'directory' && childrenOf(nodes, n.id).length < (n.childCount ?? 0)
      )
      expect(short.length).toBeGreaterThan(0)
    })
  })

  describe('Hostile', () => {
    const { nodes } = fixtures.hostile
    const byId = (id: string) => nodes.filter((n) => n.id === id)

    it('lists a child before its root', () => {
      const [rootId] = HOSTILE_CASES.rootNotFirst
      const rootIndex = nodes.findIndex((n) => n.id === rootId)
      expect(nodes.slice(0, rootIndex).some((n) => n.parentId === rootId)).toBe(true)
    })

    it('has an orphan and nothing else unresolved', () => {
      expect(unresolvedParents(nodes)).toEqual([...HOSTILE_CASES.orphan])
    })

    it('repeats an id', () => {
      expect(byId(HOSTILE_CASES.duplicateId[0])).toHaveLength(2)
    })

    it('closes a parentId cycle', () => {
      const [a, b] = HOSTILE_CASES.cycle
      expect(byId(a)[0]?.parentId).toBe(b)
      expect(byId(b)[0]?.parentId).toBe(a)
    })

    it('uses a kind outside the producer vocabulary', () => {
      const known = ['repo', 'package', 'directory', 'file', 'symbol']
      expect(known).not.toContain(byId(HOSTILE_CASES.unknownKind[0])[0]?.kind)
    })

    it('says childCount 0 on a row that has children', () => {
      const [id] = HOSTILE_CASES.childCountZeroWithChildren
      expect(byId(id)[0]?.childCount).toBe(0)
      expect(childrenOf(nodes, id).length).toBeGreaterThan(0)
    })
  })
})
