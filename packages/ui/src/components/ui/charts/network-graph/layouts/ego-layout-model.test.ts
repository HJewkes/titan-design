import fc from 'fast-check'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fcAssert } from '../../../../../test/property'
import { hostileLayoutOptions, networkGraphFixtures } from '../fixtures'
import { cleanGraph } from '../network-graph-model'
import type { GraphEdge, GraphLayoutResult, GraphNode } from '../types'
import { egoLayout, type EgoDirection, type EgoLayoutOptions } from './ego-layout-model'
import { LAYOUT_DEFAULTS } from './layout-geometry'

const n = (id: string): GraphNode => ({ id, label: id })
const link = (source: string, target: string): GraphEdge => ({ source, target })
const viewport = { width: 800, height: 600 }
const run = (
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  options: EgoLayoutOptions,
  size = viewport
): GraphLayoutResult => {
  const clean = cleanGraph(nodes, edges)
  return egoLayout(options).compute({ nodes: clean.nodes, edges: clean.edges, ...size })
}
const fixtureRun = (name: keyof typeof networkGraphFixtures, options: Partial<EgoLayoutOptions>) => {
  const fixture = networkGraphFixtures[name]
  return run(fixture.nodes, fixture.edges, { focusId: fixture.focusId ?? null, ...options })
}
const placed = (result: GraphLayoutResult) => Object.keys(result.positions).sort()
const ringOf = (result: GraphLayoutResult, id: string) =>
  result.groups?.findIndex((group) => group.nodeIds.includes(id))
const allFinite = (result: GraphLayoutResult) =>
  [result.width, result.height, ...Object.values(result.positions).flatMap((p) => [p.x, p.y])].every(
    Number.isFinite
  )

/** The oracle: a plain breadth-first search, written independently of the layout. */
function within(
  edges: readonly GraphEdge[],
  focus: string,
  hops: number,
  direction: EgoDirection
): string[] {
  const steps = (id: string) =>
    edges.flatMap((e) => {
      const out = direction !== 'incoming' && e.source === id ? [e.target] : []
      const back = direction !== 'outgoing' && e.target === id ? [e.source] : []
      return [...out, ...back]
    })
  const distance = new Map([[focus, 0]])
  const queue = [focus]
  while (queue.length > 0) {
    const id = queue.shift() as string
    const d = distance.get(id) as number
    if (d === hops) continue
    for (const next of steps(id)) {
      if (distance.has(next)) continue
      distance.set(next, d + 1)
      queue.push(next)
    }
  }
  return [...distance.keys()].sort()
}

const names = fc.uniqueArray(fc.constantFrom(...'abcdefghij'.split('')), {
  minLength: 1,
  maxLength: 10,
})
const graph = names.chain((ids) =>
  fc.record({
    nodes: fc.constant(ids.map(n)),
    edges: fc
      .array(fc.tuple(fc.constantFrom(...ids), fc.constantFrom(...ids)), { maxLength: 15 })
      .map((pairs) => pairs.filter(([a, b]) => a !== b).map(([a, b]) => link(a, b))),
    focus: fc.constantFrom(...ids),
    hops: fc.integer({ min: 0, max: 4 }),
    direction: fc.constantFrom<EgoDirection>('both', 'outgoing', 'incoming'),
  })
)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('egoLayout placed set', () => {
  it('property: the placed set is exactly the nodes whose shortest distance is at most hops, for each direction', () => {
    fcAssert(
      fc.property(graph, ({ nodes, edges, focus, hops, direction }) => {
        const result = run(nodes, edges, { focusId: focus, hops, direction })
        expect(placed(result)).toEqual(within(edges, focus, hops, direction))
      })
    )
  })

  it("Directed chain: 'outgoing' places the nodes after the focus, 'incoming' the nodes before, 'both' all within hops", () => {
    const at = (direction: EgoDirection) => placed(fixtureRun('Directed chain', { direction }))
    expect(at('outgoing')).toEqual(['alpha-03', 'alpha-04', 'alpha-05'])
    expect(at('incoming')).toEqual(['alpha-01', 'alpha-02', 'alpha-03'])
    expect(at('both')).toEqual(['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05'])
  })

  it('by default a node that only points at the focus is on ring 1', () => {
    const result = run([n('a'), n('b')], [link('b', 'a')], { focusId: 'a' })
    expect(ringOf(result, 'b')).toBe(1)
  })

  it('a node reachable in 1 hop and in 3 hops is on ring 1', () => {
    const edges = [link('f', 'x'), link('x', 'y'), link('y', 't'), link('f', 't')]
    const result = run(['f', 'x', 'y', 't'].map(n), edges, { focusId: 'f', hops: 3 })
    expect(ringOf(result, 't')).toBe(1)
  })

  it('Two components places only the focus component', () => {
    const result = fixtureRun('Two components', { hops: 20 })
    expect(placed(result)).toEqual(Array.from({ length: 8 }, (_, i) => `alpha-0${i + 1}`))
  })

  it('a null or unknown focus places nothing and does not throw', () => {
    for (const focusId of hostileLayoutOptions.focusIds) {
      const result = fixtureRun('Small (5)', { focusId })
      expect([result.positions, result.order, result.groups]).toEqual([{}, [], []])
      expect(allFinite(result)).toBe(true)
    }
  })

  it('hops 0 places the focus only; NaN gives 2; 2.5 gives 2; -1 gives 0', () => {
    const count = (hops: number) => placed(fixtureRun('Directed chain', { hops })).length
    expect([0, ...hostileLayoutOptions.hops].map(count)).toEqual([1, 5, 1, 5])
    expect(egoLayout({ focusId: 'a', hops: Number.NaN }).key).toBe(egoLayout({ focusId: 'a' }).key)
  })
})

describe('egoLayout geometry', () => {
  it('the focus is at the centre, every ring node is at its ring radius, and radii strictly increase', () => {
    const result = fixtureRun('Grouped (40)', { hops: 3 })
    const rings = result.groups ?? []
    expect(rings.length).toBeGreaterThan(2)
    const focus = result.positions['alpha-01']
    for (const ring of rings) {
      expect([ring.cx, ring.cy]).toEqual([focus?.x, focus?.y])
      for (const id of ring.nodeIds) {
        const p = result.positions[id] ?? { x: Number.NaN, y: Number.NaN }
        expect(Math.hypot(p.x - ring.cx, p.y - ring.cy)).toBeCloseTo(ring.radius, 1)
      }
    }
    const radii = rings.map((ring) => ring.radius)
    expect(radii.every((r, i) => i === 0 || r > (radii[i - 1] as number))).toBe(true)
  })

  it('Hub and spokes: neighbours on a ring are at least MIN_ARC apart along the ring', () => {
    const result = fixtureRun('Hub and spokes', {})
    for (const ring of (result.groups ?? []).slice(1)) {
      const arc = (2 * Math.PI * ring.radius) / ring.nodeIds.length
      expect(arc).toBeGreaterThanOrEqual(LAYOUT_DEFAULTS.MIN_ARC - 0.01)
      expect(ring.radius).toBeGreaterThan(LAYOUT_DEFAULTS.RING_GAP)
    }
  })

  it('every ring guide fits inside the natural size', () => {
    const result = fixtureRun('Hub and spokes', {})
    for (const ring of result.groups ?? []) {
      expect(ring.cx - ring.radius).toBeGreaterThanOrEqual(0)
      expect(ring.cy - ring.radius).toBeGreaterThanOrEqual(0)
      expect(ring.cx + ring.radius).toBeLessThanOrEqual(result.width)
      expect(ring.cy + ring.radius).toBeLessThanOrEqual(result.height)
    }
  })
})

describe('egoLayout groups and order', () => {
  it('groups hold one ring per populated hop, labelled focus, 1 hop, 2 hops, and their nodeIds partition the placed set', () => {
    const result = fixtureRun('Directed chain', { hops: 4, direction: 'outgoing' })
    const rings = result.groups ?? []
    expect(rings.map((ring) => [ring.id, ring.label, ring.variant])).toEqual([
      ['hop-0', 'focus', 'ring'],
      ['hop-1', '1 hop', 'ring'],
      ['hop-2', '2 hops', 'ring'],
      ['hop-3', '3 hops', 'ring'],
    ])
    expect(rings[0]?.radius).toBe(0)
    expect(rings.flatMap((ring) => ring.nodeIds).sort()).toEqual(placed(result))
  })

  it('order starts with the focus and runs ring by ring', () => {
    const result = fixtureRun('Grouped (40)', {})
    expect(result.order[0]).toBe('alpha-01')
    expect(result.order).toEqual((result.groups ?? []).flatMap((ring) => ring.nodeIds))
    const rings = result.order.map((id) => ringOf(result, id) as number)
    expect(rings).toEqual([...rings].sort((a, b) => a - b))
  })

  it("the result sets edgeShape 'arc' and labelMode 'declutter'", () => {
    const result = fixtureRun('Small (5)', { focusId: 'lead-01' })
    expect([result.edgeShape, result.labelMode]).toEqual(['arc', 'declutter'])
  })
})

describe('egoLayout determinism', () => {
  it('property: any permutation of nodes and edges gives the same result', () => {
    fcAssert(
      fc.property(
        graph.chain((g) =>
          fc.record({
            g: fc.constant(g),
            nodes: fc.shuffledSubarray(g.nodes, { minLength: g.nodes.length }),
            edges: fc.shuffledSubarray(g.edges, { minLength: g.edges.length }),
          })
        ),
        ({ g, nodes, edges }) => {
          const options = { focusId: g.focus, hops: g.hops, direction: g.direction }
          expect(run(nodes, edges, options)).toEqual(run(g.nodes, g.edges, options))
        }
      )
    )
  })

  it('shuffled raw input with duplicate nodes and edges gives bit-identical positions', () => {
    const { nodes, edges } = networkGraphFixtures['Grouped (40)']
    const layout = egoLayout({ focusId: 'alpha-01', hops: 3 })
    const raw = layout.compute({ nodes, edges, ...viewport })
    const noisy = layout.compute({
      nodes: [...nodes, ...nodes.slice(0, 5)].reverse(),
      edges: [...edges, ...edges.slice(0, 7), link('alpha-01', 'zz-01')].reverse(),
      ...viewport,
    })
    expect(Object.is(JSON.stringify(noisy), JSON.stringify(raw))).toBe(true)
  })

  it('compute calls no random source and no timer', () => {
    for (const name of ['setTimeout', 'setInterval', 'requestAnimationFrame'])
      vi.stubGlobal(name, () => {
        throw new Error(`${name} called`)
      })
    for (const [target, key] of [
      [Math, 'random'],
      [Date, 'now'],
      [performance, 'now'],
    ] as const)
      vi.spyOn(target, key).mockImplementation(() => {
        throw new Error(`${key} called`)
      })
    expect(() => fixtureRun('Grouped (40)', { hops: 4 })).not.toThrow()
  })

  it('the key differs by focusId, hops and direction, and a focusId holding ":" cannot collide', () => {
    const base = egoLayout({ focusId: 'a' }).key
    expect(egoLayout({ focusId: 'a', hops: 2, direction: 'both' }).key).toBe(base)
    expect(egoLayout({ focusId: 'b' }).key).not.toBe(base)
    expect(egoLayout({ focusId: 'a', hops: 3 }).key).not.toBe(base)
    expect(egoLayout({ focusId: 'a', direction: 'incoming' }).key).not.toBe(base)
    expect(egoLayout({ focusId: 'a:2', hops: 1 }).key).not.toBe(egoLayout({ focusId: 'a', hops: 21 }).key)
    expect(egoLayout({ focusId: 'a","b' }).key).not.toBe(egoLayout({ focusId: 'a' }).key)
  })
})

describe('egoLayout degenerate input', () => {
  it('stays finite for 0 nodes, 1 node, Infinity hops, an unknown direction and a NaN viewport', () => {
    const cases: GraphLayoutResult[] = [
      run([], [], { focusId: 'a' }),
      run([n('a')], [], { focusId: 'a' }),
      fixtureRun('Grouped (40)', { hops: Infinity }),
      fixtureRun('Small (5)', { focusId: 'lead-01', direction: 'sideways' as EgoDirection }),
      run([n('a'), n('b')], [link('a', 'b')], { focusId: 'a' }, { width: Number.NaN, height: -1 }),
    ]
    for (const result of cases) expect(allFinite(result)).toBe(true)
    expect(placed(cases[1] as GraphLayoutResult)).toEqual(['a'])
    const grouped = networkGraphFixtures['Grouped (40)']
    expect(placed(cases[2] as GraphLayoutResult)).toEqual(
      within(grouped.edges, 'alpha-01', Infinity, 'both')
    )
    expect(placed(cases[3] as GraphLayoutResult)).toHaveLength(5)
  })
})
