import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import { HOSTILE_CASES, fixtures } from './fixtures'
import { ancestorsOf, indexNodes, nextFocus, typeaheadMatch, visibleRows } from './tree-model'
import type { TreeKey, TreeNode } from './types'

const KEYS: TreeKey[] = ['Down', 'Up', 'Left', 'Right', 'Home', 'End', '*']
const NONE: ReadonlySet<string> = new Set()

const node = (id: string, parentId: string | null, extra: Partial<TreeNode> = {}): TreeNode => ({
  id,
  parentId,
  label: id,
  ...extra,
})

const ids = (rows: readonly { id: string }[]) => rows.map((r) => r.id)
const rowsOf = (nodes: TreeNode[], expanded: string[] = []) =>
  visibleRows(indexNodes(nodes), new Set(expanded))
const press = (nodes: TreeNode[], expanded: string[], focus: string, key: TreeKey) =>
  nextFocus(rowsOf(nodes, expanded), focus, key)

const TREE: TreeNode[] = [
  node('a', null, { childCount: 2 }),
  node('a1', 'a', { childCount: 1 }),
  node('a1x', 'a1'),
  node('a2', 'a'),
  node('b', null, { childCount: 3 }),
  node('c', null),
]

const hostile = indexNodes(fixtures.hostile.nodes)
const allOpen = (index: ReturnType<typeof indexNodes>) => new Set(index.byId.keys())

describe('indexNodes', () => {
  it('keeps the first of a duplicated id and reports the rest', () => {
    const index = indexNodes(fixtures.hostile.nodes)
    expect(index.byId.get(HOSTILE_CASES.duplicateId[0])?.label).toBe('dup (first)')
    expect(index.problems).toContainEqual({ kind: 'duplicate-id', ids: ['hostile/dup'] })
  })

  it('drops an orphan and names it', () => {
    expect(hostile.byId.has('hostile/orphan')).toBe(false)
    expect(hostile.problems).toContainEqual({ kind: 'orphan', ids: ['hostile/orphan'] })
  })

  it('drops both members of a cycle and reports them together', () => {
    const [a, b] = HOSTILE_CASES.cycle
    expect(hostile.byId.has(a) || hostile.byId.has(b)).toBe(false)
    const cycle = hostile.problems.find((p) => p.kind === 'cycle')
    expect([...(cycle?.ids ?? [])].sort()).toEqual([a, b].sort())
  })

  it('breaks a self-parent and drops what hangs off a cycle', () => {
    const index = indexNodes([node('r', null), node('s', 's'), node('t', 's')])
    expect([...index.byId.keys()]).toEqual(['r'])
    expect(index.problems.map((p) => p.kind).sort()).toEqual(['cycle', 'orphan'])
  })

  it('reports nothing for a well-formed fixture', () => {
    for (const fx of Object.values(fixtures).filter((f) => !f.hostile)) {
      expect(indexNodes(fx.nodes).problems).toEqual([])
    }
  })

  it('accepts an empty list', () => {
    expect(indexNodes([]).byId.size).toBe(0)
  })
})

describe('ancestorsOf', () => {
  const index = indexNodes(TREE)

  it('lists ancestors from the top down', () => {
    expect(ancestorsOf(index, 'a1x')).toEqual(['a', 'a1'])
  })

  it('is empty for a root and for an unknown id', () => {
    expect(ancestorsOf(index, 'a')).toEqual([])
    expect(ancestorsOf(index, 'nope')).toEqual([])
  })
})

describe('visibleRows', () => {
  it('shows only the roots when nothing is expanded', () => {
    expect(ids(rowsOf(TREE))).toEqual(['a', 'b', 'c'])
  })

  it('puts children after their parent and carries level, setsize and posinset', () => {
    const rows = rowsOf(TREE, ['a', 'a1'])
    expect(ids(rows)).toEqual(['a', 'a1', 'a1x', 'a2', 'b', 'c'])
    expect(rows.map((r) => [r.level, r.setsize, r.posinset])).toEqual([
      [1, 3, 1],
      [2, 2, 1],
      [3, 1, 1],
      [2, 2, 2],
      [1, 3, 2],
      [1, 3, 3],
    ])
  })

  it('counts an unloaded row with childCount as expandable and a plain leaf as not', () => {
    const rows = rowsOf(TREE)
    expect(rows.map((r) => r.hasChildren)).toEqual([true, true, false])
  })

  it('counts childCount 0 with loaded children as expandable', () => {
    const rows = visibleRows(hostile, new Set())
    expect(
      rows.find((r) => r.id === HOSTILE_CASES.childCountZeroWithChildren[0])?.hasChildren
    ).toBe(true)
  })

  it('emits nothing under an expanded row whose children are not loaded', () => {
    expect(ids(rowsOf(TREE, ['b']))).toEqual(['a', 'b', 'c'])
  })

  it('starts at rootId when given', () => {
    const rows = visibleRows(indexNodes(TREE), new Set(), 'a')
    expect(ids(rows)).toEqual(['a1', 'a2'])
    expect(rows[0].level).toBe(1)
  })

  it('shows the whole Hostile fixture without its dropped rows', () => {
    const rows = visibleRows(hostile, allOpen(hostile))
    expect(ids(rows).sort()).toEqual(
      ['hostile/a', 'hostile/a/leaf', 'hostile/a/odd', 'hostile/dup'].sort()
    )
  })
})

describe('nextFocus', () => {
  it('moves Down and Up one visible row and does not wrap', () => {
    expect(press(TREE, [], 'a', 'Down').focusId).toBe('b')
    expect(press(TREE, [], 'b', 'Up').focusId).toBe('a')
    expect(press(TREE, [], 'c', 'Down').focusId).toBe('c')
    expect(press(TREE, [], 'a', 'Up').focusId).toBe('a')
  })

  it('goes Home to the first and End to the last visible row', () => {
    expect(press(TREE, ['a'], 'b', 'Home').focusId).toBe('a')
    expect(press(TREE, ['a'], 'a', 'End').focusId).toBe('c')
  })

  it('opens a closed row on Right without moving focus', () => {
    expect(press(TREE, [], 'a', 'Right')).toEqual({
      focusId: 'a',
      intents: [{ type: 'expand', id: 'a' }],
    })
  })

  it('moves Right on an open row to its first child', () => {
    expect(press(TREE, ['a'], 'a', 'Right')).toEqual({ focusId: 'a1', intents: [] })
  })

  it('does nothing on Right at a leaf', () => {
    expect(press(TREE, [], 'c', 'Right')).toEqual({ focusId: 'c', intents: [] })
  })

  it('asks to load on Right at a row with childCount and no loaded children', () => {
    expect(press(TREE, [], 'b', 'Right').intents).toEqual([
      { type: 'expand', id: 'b' },
      { type: 'load', id: 'b' },
    ])
  })

  it('does not ask again for a row already loading', () => {
    const rows = rowsOf(TREE)
    const result = nextFocus(rows, 'b', 'Right', new Set(['b']))
    expect(result.intents).toEqual([{ type: 'expand', id: 'b' }])
  })

  it('stays put on Right at an open row whose children have not arrived', () => {
    expect(press(TREE, ['b'], 'b', 'Right')).toEqual({ focusId: 'b', intents: [] })
  })

  it('closes an open row on Left', () => {
    expect(press(TREE, ['a'], 'a', 'Left')).toEqual({
      focusId: 'a',
      intents: [{ type: 'collapse', id: 'a' }],
    })
  })

  it('moves Left on a closed row to its parent, not the root', () => {
    expect(press(TREE, ['a', 'a1'], 'a1x', 'Left').focusId).toBe('a1')
  })

  it('does nothing on Left at a closed root', () => {
    expect(press(TREE, [], 'a', 'Left')).toEqual({ focusId: 'a', intents: [] })
  })

  it('expands every expandable sibling on * without moving focus', () => {
    const result = press(TREE, ['a'], 'a1', '*')
    expect(result).toEqual({ focusId: 'a1', intents: [{ type: 'expand', id: 'a1' }] })
  })

  it('loads each unloaded sibling once on *', () => {
    const result = press(TREE, [], 'a', '*')
    expect(result.focusId).toBe('a')
    expect(result.intents).toEqual([
      { type: 'expand', id: 'a' },
      { type: 'expand', id: 'b' },
      { type: 'load', id: 'b' },
    ])
  })

  it('skips the load for a sibling already loading on *', () => {
    const result = nextFocus(rowsOf(TREE), 'a', '*', new Set(['b']))
    expect(result.intents).toEqual([
      { type: 'expand', id: 'a' },
      { type: 'expand', id: 'b' },
    ])
  })

  it('lands on the first row when focus is unknown, and on null when empty', () => {
    expect(nextFocus(rowsOf(TREE), 'gone', 'Down').focusId).toBe('a')
    expect(nextFocus([], null, 'Down')).toEqual({ focusId: null, intents: [] })
  })
})

describe('typeaheadMatch', () => {
  const labelled: TreeNode[] = [
    node('1', null, { label: 'Alpha', childCount: 1 }),
    node('2', '1', { label: 'Beta' }),
    node('3', null, { label: 'beacon' }),
    node('4', null, { label: 'Gamma' }),
  ]

  it('matches the next label after focus, case-insensitively', () => {
    const rows = rowsOf(labelled, ['1'])
    expect(typeaheadMatch(rows, '1', 'BE')).toBe('2')
    expect(typeaheadMatch(rows, '2', 'be')).toBe('3')
  })

  it('does not search from the top', () => {
    const rows = rowsOf(labelled, ['1'])
    expect(typeaheadMatch(rows, '2', 'b')).toBe('3')
  })

  it('wraps past the end, and lands on the focused row when it is the only match', () => {
    const rows = rowsOf(labelled, ['1'])
    expect(typeaheadMatch(rows, '4', 'a')).toBe('1')
    expect(typeaheadMatch(rows, '4', 'g')).toBe('4')
  })

  it('skips a row under a collapsed ancestor', () => {
    expect(typeaheadMatch(rowsOf(labelled), '1', 'beta')).toBeNull()
    expect(typeaheadMatch(rowsOf(labelled), '1', 'be')).toBe('3')
  })

  it('returns null for an empty query or no match', () => {
    const rows = rowsOf(labelled)
    expect(typeaheadMatch(rows, '1', '')).toBeNull()
    expect(typeaheadMatch(rows, '1', 'zzz')).toBeNull()
  })
})

const nodeListArb = fc
  .array(
    fc.record({
      id: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g'),
      parentId: fc.option(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'x'), { nil: null }),
      label: fc.string({ maxLength: 4 }),
      childCount: fc.option(fc.nat(3), { nil: undefined }),
    }),
    { maxLength: 14 }
  )
  .map((list) => list.map((n) => ({ ...n })))
/** Well-formed trees: row `n<i>` hangs off an earlier row or is a root, so none is dropped. */
const treeArb = fc
  .array(fc.tuple(fc.nat(), fc.option(fc.nat(3), { nil: undefined })), { maxLength: 24 })
  .map((specs) =>
    specs.map(([parent, childCount], i) => ({
      id: `n${i}`,
      parentId: i === 0 || parent % (i + 1) === i ? null : `n${parent % i}`,
      label: `n${i}`,
      childCount,
    }))
  )
const treeExpandedArb = fc.uniqueArray(fc.nat(24).map((i) => `n${i}`))
const expandedArb = fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g'))
const fixtureArb = fc.constantFrom(...Object.values(fixtures).filter((f) => f.nodes.length < 600))

/** Independent of `visibleRows`: the ids shown under `id` when `open` is expanded, depth first. */
const visibleDescendants = (
  index: ReturnType<typeof indexNodes>,
  id: string,
  open: ReadonlySet<string>
): string[] =>
  (index.childrenOf.get(id) ?? []).flatMap((child) => [
    child.id,
    ...(open.has(child.id) ? visibleDescendants(index, child.id, open) : []),
  ])

describe('tree-model properties', () => {
  it('never emits a child before its parent or under a collapsed ancestor', () => {
    fcAssert(
      fc.property(nodeListArb, expandedArb, (nodes, expanded) => {
        const open = new Set(expanded)
        const rows = visibleRows(indexNodes(nodes), open)
        const seen = new Set<string>()
        for (const row of rows) {
          const parent = row.node.parentId
          if (parent !== null) expect(seen.has(parent) && open.has(parent)).toBe(true)
          seen.add(row.id)
        }
      })
    )
  })

  it('inserts exactly the descendants on expand and restores the list on collapse', () => {
    fcAssert(
      fc.property(nodeListArb, expandedArb, fc.nat(20), (nodes, expanded, pick) => {
        const index = indexNodes(nodes)
        const open = new Set(expanded)
        const rows = visibleRows(index, open)
        const closed = rows.filter((r) => r.hasChildren && !r.isExpanded)
        if (closed.length === 0) return
        const target = closed[pick % closed.length]
        const at = rows.findIndex((r) => r.id === target.id)

        const opened = new Set(open).add(target.id)
        const inserted = visibleDescendants(index, target.id, opened)
        const after = visibleRows(index, opened)

        expect(after.slice(at + 1, at + 1 + inserted.length).map((r) => r.id)).toEqual(inserted)
        const others = [...after.slice(0, at), ...after.slice(at + 1 + inserted.length)]
        const before = [...rows.slice(0, at), ...rows.slice(at + 1)]
        expect(others.slice(0, at)).toEqual(before.slice(0, at))
        expect(others.slice(at)).toEqual(before.slice(at))
        expect(after[at]).toEqual({ ...target, isExpanded: true })

        const collapsed = new Set(opened)
        collapsed.delete(target.id)
        expect(visibleRows(index, collapsed)).toEqual(rows)
      })
    )
  })

  it('keeps expansion from leaking to siblings', () => {
    fcAssert(
      fc.property(nodeListArb, expandedArb, (nodes, expanded) => {
        const index = indexNodes(nodes)
        const open = new Set(expanded)
        const withExtra = new Set(open).add('zz')
        expect(ids(visibleRows(index, withExtra))).toEqual(ids(visibleRows(index, open)))
      })
    )
  })

  it('keeps posinset within 1..setsize', () => {
    fcAssert(
      fc.property(nodeListArb, expandedArb, (nodes, expanded) => {
        const rows = visibleRows(indexNodes(nodes), new Set(expanded))
        for (const r of rows) {
          expect(r.posinset).toBeGreaterThanOrEqual(1)
          expect(r.posinset).toBeLessThanOrEqual(r.setsize)
        }
      })
    )
  })

  it('always returns a visible id from nextFocus', () => {
    fcAssert(
      fc.property(
        nodeListArb,
        expandedArb,
        fc.constantFrom(...KEYS),
        fc.constantFrom('a', 'b', 'c', 'zz', null),
        (nodes, expanded, key, focus) => {
          const rows = visibleRows(indexNodes(nodes), new Set(expanded))
          const { focusId } = nextFocus(rows, focus, key)
          if (rows.length === 0) expect(focusId).toBeNull()
          else expect(ids(rows)).toContain(focusId)
        }
      )
    )
  })

  it('never throws over any fixture, Hostile included', () => {
    fcAssert(
      fc.property(fixtureArb, fc.constantFrom(...KEYS), fc.nat(50), (fx, key, pick) => {
        const index = indexNodes(fx.nodes)
        const rows = visibleRows(index, allOpen(index))
        const focus = rows[pick % Math.max(rows.length, 1)]?.id ?? null
        expect(() => {
          nextFocus(rows, focus, key, NONE)
          typeaheadMatch(rows, focus, 'a')
          if (focus) ancestorsOf(index, focus)
        }).not.toThrow()
      })
    )
  })
})

describe('Very large fixture', () => {
  it('indexes and flattens 5,000 rows with no problems', () => {
    const index = indexNodes(fixtures.veryLarge.nodes)
    expect(index.problems).toEqual([])
    expect(visibleRows(index, allOpen(index))).toHaveLength(5000)
  })
})
