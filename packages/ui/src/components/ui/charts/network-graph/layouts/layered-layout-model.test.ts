import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../../../test/property'
import { largeFixture, networkGraphFixtures } from '../fixtures'
import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING, cleanGraph } from '../network-graph-model'
import type { GraphEdge, GraphLayoutResult, GraphNode } from '../types'
import { LAYER_COLUMN_WIDTH, LAYER_ROW_HEIGHT, layeredLayout } from './layered-layout-model'

const n = (id: string): GraphNode => ({ id, label: id })
const e = (id: string, source: string, target: string, kind?: string): GraphEdge => ({
  id,
  source,
  target,
  kind,
})
const run = (nodes: GraphNode[], edges: GraphEdge[], options = {}): GraphLayoutResult =>
  layeredLayout(options).compute({ nodes, edges, width: 800, height: 600 })
const layerOf = (result: GraphLayoutResult, id: string) =>
  ((result.positions[id]?.x ?? 0) - GRAPH_NODE_PADDING) / LAYER_COLUMN_WIDTH
const rowOf = (result: GraphLayoutResult, id: string) =>
  ((result.positions[id]?.y ?? 0) - GRAPH_NODE_PADDING) / LAYER_ROW_HEIGHT

const names = fc.uniqueArray(fc.constantFrom(...'abcdefghijkl'.split('')), {
  minLength: 1,
  maxLength: 12,
})

/** A cleaned graph with random edges, plus shuffled copies of its nodes and edges. */
const graphWithShuffles = (acyclic: boolean) =>
  names.chain((ids) =>
    fc
      .array(
        fc.record({
          a: fc.nat(ids.length - 1),
          b: fc.nat(ids.length - 1),
          kind: fc.constantFrom('spawn', 'message'),
        }),
        { maxLength: 24 }
      )
      .chain((raw) => {
        const edges = raw
          .filter((r) => (acyclic ? r.a < r.b : r.a !== r.b))
          .map((r) => ({ source: ids[r.a] as string, target: ids[r.b] as string, kind: r.kind }))
        const cleaned = cleanGraph(ids.map(n), edges)
        return fc.record({
          nodes: fc.constant(cleaned.nodes),
          edges: fc.constant(cleaned.edges),
          shuffledNodes: fc.shuffledSubarray(cleaned.nodes, { minLength: cleaned.nodes.length }),
          shuffledEdges: fc.shuffledSubarray(cleaned.edges, { minLength: cleaned.edges.length }),
        })
      })
  )

describe('layeredLayout', () => {
  it('gives the same result for any permutation of nodes and edges', () => {
    fcAssert(
      fc.property(graphWithShuffles(false), (g) => {
        expect(run(g.shuffledNodes, g.shuffledEdges)).toEqual(run(g.nodes, g.edges))
      })
    )
  })

  it('gives every input node one finite position and no two nodes share one', () => {
    fcAssert(
      fc.property(graphWithShuffles(false), (g) => {
        const result = run(g.nodes, g.edges)
        const spots = g.nodes.map((node) => result.positions[node.id])
        expect(spots.every((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
        expect(new Set(spots.map((p) => `${p?.x},${p?.y}`)).size).toBe(g.nodes.length)
        expect([...result.order].sort()).toEqual(g.nodes.map((x) => x.id).sort())
      })
    )
  })

  it("puts every ranking edge's target in a later layer than its source", () => {
    fcAssert(
      fc.property(graphWithShuffles(true), (g) => {
        const result = run(g.nodes, g.edges)
        for (const edge of g.edges) {
          expect(layerOf(result, edge.target)).toBeGreaterThan(layerOf(result, edge.source))
        }
      })
    )
  })

  it('takes the longest path as the layer when a shortcut edge exists', () => {
    const nodes = ['a', 'b', 'c'].map(n)
    const result = run(nodes, [e('1', 'a', 'b'), e('2', 'b', 'c'), e('3', 'a', 'c')])
    expect(['a', 'b', 'c'].map((id) => layerOf(result, id))).toEqual([0, 1, 2])
  })

  it('terminates on a cycle in the ranking edges and drops exactly the closing edge', () => {
    const nodes = ['a', 'b', 'c'].map(n)
    const closesLast = run(nodes, [e('e1', 'a', 'b'), e('e2', 'b', 'c'), e('e3', 'c', 'a')])
    expect(['a', 'b', 'c'].map((id) => layerOf(closesLast, id))).toEqual([0, 1, 2])
    const closesFirst = run(nodes, [e('e3', 'a', 'b'), e('e1', 'b', 'c'), e('e2', 'c', 'a')])
    expect(['b', 'c', 'a'].map((id) => layerOf(closesFirst, id))).toEqual([0, 1, 2])
  })

  it('centres a parent on the midpoint of its first and last child', () => {
    const nodes = ['p', 'c1', 'c2', 'c3', 'g1', 'g2'].map(n)
    const edges = [
      e('1', 'p', 'c1'),
      e('2', 'p', 'c2'),
      e('3', 'p', 'c3'),
      e('4', 'c1', 'g1'),
      e('5', 'c1', 'g2'),
    ]
    const result = run(nodes, edges)
    expect(rowOf(result, 'c1')).toBe(0.5)
    expect(rowOf(result, 'p')).toBe(1.75)
  })

  it('takes the first predecessor by id as the primary parent', () => {
    const result = run(['a', 'b', 'c'].map(n), [e('1', 'b', 'c'), e('2', 'a', 'c')])
    expect(rowOf(result, 'c')).toBe(rowOf(result, 'a'))
  })

  it('leaves layers unchanged by message edges when only spawn edges rank', () => {
    const { nodes, edges } = networkGraphFixtures['Medium (30)']
    const cleaned = cleanGraph(nodes, edges)
    const spawnOnly = cleaned.edges.filter((x) => x.kind === 'spawn')
    expect(cleaned.edges.length).toBeGreaterThan(spawnOnly.length)
    const ranked = run(cleaned.nodes, cleaned.edges, { rankEdgeKinds: ['spawn'] })
    expect(ranked).toEqual(run(cleaned.nodes, spawnOnly, { rankEdgeKinds: ['spawn'] }))
    expect(run(cleaned.nodes, cleaned.edges)).not.toEqual(ranked)
  })

  it('contains every position and its label room in the natural size', () => {
    for (const fixture of Object.values(networkGraphFixtures)) {
      const cleaned = cleanGraph(fixture.nodes, fixture.edges)
      const result = run(cleaned.nodes, cleaned.edges)
      for (const p of Object.values(result.positions)) {
        expect(p.x + GRAPH_LABEL_ROOM).toBeLessThanOrEqual(result.width)
        expect(p.y + GRAPH_NODE_PADDING).toBeLessThanOrEqual(result.height)
      }
    }
  })

  it('keys by its options, so equal options share a key', () => {
    expect(layeredLayout().key).toBe(layeredLayout({}).key)
    const ab = layeredLayout({ rankEdgeKinds: ['a', 'b'] })
    expect(layeredLayout({ rankEdgeKinds: ['b', 'a'] }).key).toBe(ab.key)
    expect(layeredLayout({ rankEdgeKinds: ['a'] }).key).not.toBe(layeredLayout().key)
    expect(layeredLayout({ rankEdgeKinds: [] }).key).not.toBe(layeredLayout().key)
  })

  it('lays out an empty graph and a single node', () => {
    expect(run([], [])).toMatchObject({ order: [], positions: {} })
    expect(run([n('a')], []).order).toEqual(['a'])
  })

  it('Large (150) lays out under the time budget', () => {
    const cleaned = cleanGraph(largeFixture.nodes, largeFixture.edges)
    const start = performance.now()
    const result = run(cleaned.nodes, cleaned.edges)
    expect(performance.now() - start).toBeLessThan(200)
    expect(result.order).toHaveLength(150)
  })
})
