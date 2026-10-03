import fc from 'fast-check'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fcAssert } from '../../../../../test/property'
import {
  hostileLayoutOptions,
  largeFixture,
  mediumFixture,
  networkGraphFixtures,
  smallFixture,
} from '../fixtures'
import { cleanGraph } from '../network-graph-model'
import type { GraphEdge, GraphLayoutResult, GraphNode } from '../types'
import { forceLayout } from './force-layout-model'
import { LAYOUT_DEFAULTS } from './layout-geometry'

const n = (id: string): GraphNode => ({ id, label: id })
const link = (source: string, target: string): GraphEdge => ({ source, target })
const run = (
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  options = {},
  viewport = { width: 800, height: 600 }
): GraphLayoutResult => {
  const clean = cleanGraph(nodes, edges)
  return forceLayout(options).compute({ nodes: clean.nodes, edges: clean.edges, ...viewport })
}
const runFixture = (fixture: typeof smallFixture, options = {}) =>
  run(fixture.nodes, fixture.edges, options)
const allFinite = (result: GraphLayoutResult) =>
  Object.values(result.positions).every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
const distance = (result: GraphLayoutResult, a: string, b: string) => {
  const [p, q] = [result.positions[a], result.positions[b]]
  return Math.hypot((p?.x ?? 0) - (q?.x ?? 0), (p?.y ?? 0) - (q?.y ?? 0))
}

const ids = fc.uniqueArray(fc.constantFrom(...'abcdefghij'.split('')), {
  minLength: 1,
  maxLength: 10,
})
const graph = ids.chain((names) =>
  fc
    .array(fc.tuple(fc.constantFrom(...names), fc.constantFrom(...names)), { maxLength: 15 })
    .map((pairs) => ({
      nodes: names.map(n),
      edges: pairs.filter(([a, b]) => a !== b).map(([a, b]) => link(a, b)),
    }))
)

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('forceLayout determinism', () => {
  it('two runs with the same input and seed are deep-equal', () => {
    expect(runFixture(mediumFixture, { seed: 7 })).toEqual(runFixture(mediumFixture, { seed: 7 }))
  })

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
          const clean = cleanGraph(g.nodes, g.edges)
          const shuffled = cleanGraph(nodes, edges)
          const input = { width: 800, height: 600 }
          const layout = forceLayout({ iterations: 40 })
          expect(layout.compute({ ...shuffled, ...input })).toEqual(
            layout.compute({ ...clean, ...input })
          )
        }
      )
    )
  })

  it('gives the same positions for shuffled raw input without cleaning in between', () => {
    const layout = forceLayout({ seed: 3, iterations: 60 })
    const input = { width: 800, height: 600 }
    const reversed = layout.compute({
      nodes: [...smallFixture.nodes].reverse(),
      edges: [...smallFixture.edges].reverse(),
      ...input,
    })
    expect(reversed).toEqual(
      layout.compute({ nodes: smallFixture.nodes, edges: smallFixture.edges, ...input })
    )
  })

  it('a different seed gives different positions for Medium (30)', () => {
    expect(runFixture(mediumFixture, { seed: 1 }).positions).not.toEqual(
      runFixture(mediumFixture, { seed: 2 }).positions
    )
  })

  it('Small (5) with seed 1 matches the pinned positions', () => {
    const result = runFixture(smallFixture, { seed: 1 })
    expect(result.positions).toMatchInlineSnapshot(`
      {
        "lead-01": {
          "x": 331.86,
          "y": 264.78,
        },
        "worker-01": {
          "x": 325.07,
          "y": 335.22,
        },
        "worker-02": {
          "x": 289.89,
          "y": 301.99,
        },
        "worker-03": {
          "x": 350.11,
          "y": 318.5,
        },
        "worker-04": {
          "x": 302.42,
          "y": 326.87,
        },
      }
    `)
    expect(result.order).toMatchInlineSnapshot(`
      [
        "lead-01",
        "worker-02",
        "worker-04",
        "worker-03",
        "worker-01",
      ]
    `)
  })

  it('compute reads no clock or random source and schedules nothing', () => {
    const banned = ['setTimeout', 'setInterval', 'requestAnimationFrame'] as const
    for (const name of banned)
      vi.stubGlobal(name, () => {
        throw new Error(`${name} called`)
      })
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called')
    })
    vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Date.now called')
    })
    vi.spyOn(performance, 'now').mockImplementation(() => {
      throw new Error('performance.now called')
    })
    expect(() => runFixture(mediumFixture)).not.toThrow()
    vi.unstubAllGlobals()
  })

  it('leaves no pending timer after compute', () => {
    vi.useFakeTimers()
    runFixture(largeFixture)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('forceLayout positions', () => {
  it('property: every node has one finite position and no two nodes share one', () => {
    fcAssert(
      fc.property(graph, ({ nodes, edges }) => {
        const result = run(nodes, edges, { iterations: 40 })
        const placed = Object.values(result.positions)
        expect(Object.keys(result.positions).sort()).toEqual(nodes.map((x) => x.id).sort())
        expect([...result.order].sort()).toEqual(nodes.map((x) => x.id).sort())
        expect(allFinite(result)).toBe(true)
        expect(new Set(placed.map((p) => `${p.x},${p.y}`)).size).toBe(placed.length)
      })
    )
  })

  it('places every node of the 5, 30 and 150 fixtures at a finite point', () => {
    for (const fixture of [smallFixture, mediumFixture, largeFixture]) {
      const result = runFixture(fixture)
      expect(Object.keys(result.positions)).toHaveLength(fixture.nodes.length)
      expect(
        allFinite(result) && Number.isFinite(result.width) && Number.isFinite(result.height)
      ).toBe(true)
    }
  })

  it('handles 0 nodes, 1 node, disconnected nodes and a self-loop', () => {
    expect(run([], []).positions).toEqual({})
    expect(Object.keys(run([n('a')], []).positions)).toEqual(['a'])
    const disconnected = run([n('a'), n('b'), n('c')], [])
    expect(Object.keys(disconnected.positions)).toHaveLength(3)
    const loop = forceLayout().compute({
      nodes: [n('a'), n('b')],
      edges: [link('a', 'a'), link('a', 'b')],
      width: 800,
      height: 600,
    })
    expect(allFinite(loop) && allFinite(disconnected)).toBe(true)
  })

  it('iterations of 0, NaN and 1e9 clamp to 1..1000', () => {
    const keys = hostileLayoutOptions.iterations.map(
      (iterations) => forceLayout({ iterations }).key
    )
    expect(keys).toEqual([
      JSON.stringify(['force', 1, 1]),
      JSON.stringify(['force', 1, 300]),
      JSON.stringify(['force', 1, 1000]),
    ])
    for (const iterations of hostileLayoutOptions.iterations) {
      expect(allFinite(runFixture(smallFixture, { iterations }))).toBe(true)
    }
  })

  it('stays finite for hostile seeds and a zero-width viewport', () => {
    for (const seed of hostileLayoutOptions.seeds) {
      expect(
        allFinite(run(smallFixture.nodes, smallFixture.edges, { seed }, { width: 0, height: 0 }))
      ).toBe(true)
    }
  })

  it('an edge to an unknown id does not throw', () => {
    const layout = forceLayout()
    expect(() =>
      layout.compute({ nodes: [n('a'), n('b')], edges: [link('a', 'zz')], width: 400, height: 300 })
    ).not.toThrow()
  })

  it('deep-frozen input is accepted', () => {
    const freeze = <T extends object>(value: T): T => {
      Object.values(value).forEach((v) => typeof v === 'object' && v !== null && freeze(v))
      return Object.freeze(value)
    }
    const nodes = freeze([n('a'), n('b'), n('c')])
    const edges = freeze([link('a', 'b'), link('b', 'c')])
    expect(() => forceLayout().compute({ nodes, edges, width: 400, height: 300 })).not.toThrow()
  })

  it('two nodes joined by an edge end nearer the link distance than the same two nodes without it', () => {
    const joined = distance(run([n('a'), n('b')], [link('a', 'b')]), 'a', 'b')
    const apart = distance(run([n('a'), n('b')], []), 'a', 'b')
    const gap = (value: number) => Math.abs(value - LAYOUT_DEFAULTS.LINK_DISTANCE)
    expect(gap(joined)).toBeLessThan(gap(apart))
    expect(gap(joined)).toBeLessThan(20)
  })

  it('No edges keeps all 12 nodes within a span of 200 px', () => {
    const fixture = networkGraphFixtures['No edges']
    const points = Object.values(runFixture(fixture).positions)
    const span = (values: number[]) => Math.max(...values) - Math.min(...values)
    expect(points).toHaveLength(12)
    expect(span(points.map((p) => p.x))).toBeLessThan(200)
    expect(span(points.map((p) => p.y))).toBeLessThan(200)
  })

  it('a repeated node id adds no second body', () => {
    const layout = forceLayout({ seed: 4 })
    const nodes = [n('a'), n('b'), n('c')]
    const edges = [link('a', 'b'), link('b', 'c')]
    const once = layout.compute({ nodes, edges, width: 400, height: 300 })
    const twice = layout.compute({ nodes: [...nodes, n('b'), n('a')], edges, width: 400, height: 300 })
    expect(twice).toEqual(once)
  })

  it('One item is centred in the viewport; Empty returns no positions', () => {
    const one = run([n('a')], [], {}, { width: 1000, height: 600 })
    expect(one.positions.a).toEqual({ x: (1000 - 208) / 2 + 24, y: (600 - 48) / 2 + 24 })
    expect(run([], []).positions).toEqual({})
  })
})

describe('forceLayout seam', () => {
  it('the key is equal for equal sanitised options and differs by seed and by iterations', () => {
    const base = forceLayout().key
    expect(forceLayout({ seed: 1, iterations: 300 }).key).toBe(base)
    expect(forceLayout({ seed: Number.NaN }).key).toBe(base)
    expect(forceLayout({ seed: 2 }).key).not.toBe(base)
    expect(forceLayout({ iterations: 200 }).key).not.toBe(base)
  })

  it("the result sets edgeShape 'arc' and labelMode 'declutter'", () => {
    const result = runFixture(smallFixture)
    expect([result.edgeShape, result.labelMode]).toEqual(['arc', 'declutter'])
  })

  it('Large (150) costs less than 14 times Medium (30), so a quadratic repulsion fails', () => {
    const bestOf5 = (fixture: typeof smallFixture) =>
      Math.min(
        ...Array.from({ length: 5 }, () => {
          const started = performance.now()
          runFixture(fixture)
          return performance.now() - started
        })
      )
    bestOf5(mediumFixture)
    expect(bestOf5(largeFixture) / bestOf5(mediumFixture)).toBeLessThan(14)
  })
})
