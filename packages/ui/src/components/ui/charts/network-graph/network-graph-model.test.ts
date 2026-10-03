import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../../test/property'
import { networkGraphFixtures, smallFixture } from './fixtures'
import { layeredLayout } from './layouts/layered-layout-model'
import {
  binWeight,
  buildGraphModel,
  cleanGraph,
  edgePath,
  indexGraph,
  weightRange,
} from './network-graph-model'
import { nextFocus } from './network-graph-focus'
import { edgeLabel, nodeLabel, summarizeGraph } from './network-graph-text'
import type { GraphEdge, GraphFocus, GraphFocusKey, GraphIndex, GraphNode } from './types'

const n = (id: string, extra: Partial<GraphNode> = {}): GraphNode => ({ id, label: id, ...extra })
const e = (source: string, target: string, extra: Partial<GraphEdge> = {}): GraphEdge => ({
  source,
  target,
  ...extra,
})
const KEYS: GraphFocusKey[] = ['Down', 'Up', 'Right', 'Left', 'Home', 'End']
const ids = (...names: string[]) => names.map((id) => n(id))
const layered = layeredLayout()
const modelOf = (key: keyof typeof networkGraphFixtures) => {
  const { nodes, edges } = networkGraphFixtures[key]
  return buildGraphModel(nodes, edges, layered, { width: 800, height: 600 })
}

const walk = (index: GraphIndex, start: GraphFocus, key: GraphFocusKey): GraphFocus[] => {
  const visited = [start]
  const cap = index.order.length + index.edgesById.size
  for (let step = 0; step <= cap; step += 1) {
    const next = nextFocus(index, visited[visited.length - 1] as GraphFocus, key)
    if (next === null) return visited
    visited.push(next)
  }
  throw new Error(`${key} never stopped, so it wraps`)
}

describe('cleanGraph', () => {
  it('keeps the first of duplicate node ids and counts the rest', () => {
    const result = cleanGraph([n('a', { label: 'first' }), n('a', { label: 'second' }), n('b')], [])
    expect(result.nodes.map((x) => x.label)).toEqual(['first', 'b'])
    expect(result.report.duplicateNodes).toBe(1)
  })

  it('drops edges to unknown ids and self edges and counts them', () => {
    const result = cleanGraph(ids('a', 'b'), [e('a', 'b'), e('a', 'a'), e('a', 'zz'), e('zz', 'b')])
    expect(result.edges).toHaveLength(1)
    expect(result.report).toMatchObject({ selfEdges: 1, unknownEndpointEdges: 2 })
  })

  it('merges duplicate edges and sums their weights, null plus a number being the number', () => {
    const result = cleanGraph(ids('a', 'b', 'c'), [
      e('a', 'b', { kind: 'm', weight: 3 }),
      e('a', 'b', { kind: 'm', weight: 4 }),
      e('b', 'c', { weight: null }),
      e('b', 'c', { weight: 5 }),
      e('a', 'c', { weight: null }),
      e('a', 'c'),
    ])
    expect(result.edges.map((x) => x.weight)).toEqual([7, null, 5])
    expect(result.report.mergedEdges).toBe(3)
  })

  it('treats NaN and negative weights as unknown, and keeps the newest activity when merging', () => {
    const result = cleanGraph(ids('a', 'b', 'c'), [
      e('a', 'b', { weight: Number.NaN, activityAt: 5 }),
      e('a', 'b', { weight: -2, activityAt: 9 }),
      e('b', 'c', { weight: 0 }),
    ])
    expect(result.edges.map((x) => x.weight)).toEqual([null, 0])
    expect(result.edges[0]?.activityAt).toBe(9)
  })

  it('gives every edge a unique id, defaulting to source, target and kind', () => {
    const result = cleanGraph(ids('a', 'b', 'c'), [
      e('a', 'b', { kind: 'k' }),
      e('b', 'c', { id: 'same' }),
      e('a', 'c', { id: 'same' }),
    ])
    expect(result.edges.map((x) => x.id)).toEqual(['a->b:k', 'same', 'same#2'])
  })
})

describe('cleanGraph input order', () => {
  const abc = ids('a', 'b', 'c')
  const place = (edges: GraphEdge[]) =>
    layeredLayout().compute({ ...cleanGraph(abc, edges), width: 800, height: 600 }).positions

  it('merges m1, m9 and m5 to the same edge id and positions in either input order', () => {
    const m1 = e('a', 'b', { id: 'm1' })
    const m9 = e('a', 'b', { id: 'm9' })
    const m5 = e('b', 'a', { id: 'm5' })
    const forward = cleanGraph(abc, [m1, m9, m5])
    const reversed = cleanGraph(abc, [m9, m1, m5])
    expect(forward.edges.map((x) => x.id)).toContain('m1')
    expect(reversed).toEqual(forward)
    expect(place([m9, m1, m5])).toEqual(place([m1, m9, m5]))
  })

  it('numbers edges that share an id the same way in either input order', () => {
    const ab = e('a', 'b', { id: 'x' })
    const bc = e('b', 'c', { id: 'x' })
    expect(cleanGraph(abc, [ab, bc]).edges.map((x) => `${x.source}${x.target}:${x.id}`)).toEqual([
      'ab:x',
      'bc:x#2',
    ])
    expect(cleanGraph(abc, [bc, ab])).toEqual(cleanGraph(abc, [ab, bc]))
    expect(place([bc, ab])).toEqual(place([ab, bc]))
  })

  it('emits nodes and edges in a canonical order and sums weights without order effects', () => {
    const edges = [0.3, 0.1, 0.2].map((weight) => e('a', 'b', { weight }))
    const merged = cleanGraph(ids('c', 'b', 'a'), edges)
    expect(merged.nodes.map((x) => x.id)).toEqual(['a', 'b', 'c'])
    expect(merged.edges[0]?.weight).toBe(
      cleanGraph(ids('a'.repeat(1), 'b'), [...edges].reverse()).edges[0]?.weight
    )
    const sorted = cleanGraph(abc, [e('c', 'a'), e('b', 'c'), e('a', 'c'), e('a', 'b')]).edges
    expect(sorted.map((x) => `${x.source}${x.target}`)).toEqual(['ab', 'ac', 'bc', 'ca'])
  })
})

describe('binWeight', () => {
  const range = weightRange([e('a', 'b', { weight: 1 }), e('b', 'c', { weight: 40 })])

  it('is monotonic across the range', () => {
    const steps = [1, 8, 14, 20, 27, 33, 40].map((w) => binWeight(w, range))
    expect(steps).toEqual([...steps].sort())
    expect(new Set(steps)).toEqual(new Set([0, 1, 2]))
  })

  it('gives all-equal weights one step without dividing by a zero range', () => {
    const equal = weightRange(Array.from({ length: 8 }, () => e('a', 'b', { weight: 5 })))
    expect(binWeight(5, equal)).toBe(0)
  })

  it('gives null, NaN, negative and a missing range the lowest step', () => {
    expect([null, undefined, Number.NaN, -3].map((w) => binWeight(w, range))).toEqual([0, 0, 0, 0])
    expect(binWeight(9, null)).toBe(0)
    expect(weightRange([e('a', 'b', { weight: null })])).toBeNull()
  })
})

describe('edgePath', () => {
  it('draws a horizontal link from the source point to the target point', () => {
    const path = edgePath({ x: 10, y: 20 }, { x: 110, y: 60 })
    expect(path.startsWith('M10,20')).toBe(true)
    expect(path.endsWith('110,60')).toBe(true)
  })
})

describe('nextFocus', () => {
  const noEdges = modelOf('No edges')
  const small = modelOf('Small (5)')

  it('never returns an item outside the graph and never throws', () => {
    const models = Object.keys(networkGraphFixtures).map((k) =>
      modelOf(k as keyof typeof networkGraphFixtures)
    )
    fcAssert(
      fc.property(
        fc.nat(models.length - 1),
        fc.constantFrom(...KEYS),
        fc.array(fc.constantFrom(...KEYS), { maxLength: 12 }),
        fc.boolean(),
        (modelAt, first, rest, useGhost) => {
          const { index } = models[modelAt] as (typeof models)[number]
          let focus: GraphFocus | null = useGhost
            ? { type: 'edge', id: 'ghost', from: 'ghost' }
            : index.order[0] === undefined
              ? null
              : { type: 'node', id: index.order[0] }
          for (const key of [first, ...rest]) {
            if (!focus) return
            const next = nextFocus(index, focus, key)
            if (next === null) continue
            const inside =
              next.type === 'node' ? index.nodesById.has(next.id) : index.edgesById.has(next.id)
            expect(inside).toBe(true)
            focus = next
          }
        }
      )
    )
  })

  it('Down and Up visit every node of No edges in order and stop at the ends', () => {
    const { index } = noEdges
    const first: GraphFocus = { type: 'node', id: index.order[0] as string }
    expect(walk(index, first, 'Down').map((f) => f.id)).toEqual([...index.order])
    expect(nextFocus(index, first, 'Up')).toBeNull()
  })

  it('Home and End jump to the first and last node', () => {
    const { index } = small
    const mid: GraphFocus = { type: 'node', id: index.order[2] as string }
    expect(nextFocus(index, mid, 'Home')).toEqual({ type: 'node', id: index.order[0] })
    expect(nextFocus(index, mid, 'End')).toEqual({ type: 'node', id: index.order[4] })
  })

  it("Right from a node goes to its first outgoing edge, then to that edge's target; Left returns", () => {
    const { index } = small
    const lead: GraphFocus = { type: 'node', id: 'lead-01' }
    const outgoing = index.outgoing.get('lead-01')?.[0]
    const edgeFocus = nextFocus(index, lead, 'Right')
    expect(edgeFocus).toEqual({ type: 'edge', id: outgoing?.id, from: 'lead-01' })
    expect(nextFocus(index, edgeFocus as GraphFocus, 'Right')).toEqual({
      type: 'node',
      id: outgoing?.target,
    })
    expect(nextFocus(index, edgeFocus as GraphFocus, 'Left')).toEqual({
      type: 'node',
      id: 'lead-01',
    })
    const worker: GraphFocus = { type: 'node', id: 'worker-01' }
    const incoming = index.incoming.get('worker-01')?.[0]
    expect(nextFocus(index, worker, 'Left')).toEqual({
      type: 'edge',
      id: incoming?.id,
      from: 'worker-01',
    })
  })

  it('does nothing on a node with no edge in the requested direction', () => {
    const lonely = { type: 'node', id: noEdges.order[0] as string } as const
    expect(nextFocus(noEdges.index, lonely, 'Right')).toBeNull()
    expect(nextFocus(noEdges.index, lonely, 'Left')).toBeNull()
  })

  it('Down on an edge cycles the edges of the node it was entered from, not all edges', () => {
    const { index } = small
    const anchored = index.outgoing.get('worker-04') ?? []
    const around = [...anchored, ...(index.incoming.get('worker-04') ?? [])]
    expect(around.length).toBeLessThan(index.edgesById.size)
    const start: GraphFocus = { type: 'edge', id: around[0]?.id as string, from: 'worker-04' }
    const visited = walk(index, start, 'Down')
    expect(visited.every((f) => f.type === 'edge' && f.from === 'worker-04')).toBe(true)
    const seen = visited.map((f) => f.id)
    expect(seen).toEqual(around.map((x) => x.id))
    expect(
      nextFocus(index, { type: 'edge', id: seen[0] as string, from: 'worker-04' }, 'Up')
    ).toBeNull()
    expect(
      nextFocus(index, { type: 'edge', id: seen[0] as string, from: 'worker-04' }, 'End')
    ).toMatchObject({
      id: seen[seen.length - 1],
    })
  })

  it('does nothing for an unknown node or edge', () => {
    const { index } = small
    expect(nextFocus(index, { type: 'node', id: 'ghost' }, 'Down')).toBeNull()
    expect(nextFocus(index, { type: 'edge', id: 'ghost', from: 'lead-01' }, 'Right')).toBeNull()
  })
})

describe('indexGraph', () => {
  it('lists edges by the other endpoint in order, and leaves out edges to unplaced nodes', () => {
    const index = indexGraph(
      ids('a', 'b', 'c'),
      [e('a', 'c', { id: '1' }), e('a', 'b', { id: '2' }), e('a', 'b', { id: '0' })],
      ['a', 'b']
    )
    expect(index.outgoing.get('a')?.map((x) => x.id)).toEqual(['0', '2'])
    expect(index.incoming.get('b')?.map((x) => x.id)).toEqual(['0', '2'])
    expect(index.edgesById.has('1')).toBe(false)
  })
})

describe('labels', () => {
  it('names a node by label, kind, incoming and outgoing counts, falling back to the id', () => {
    expect(
      nodeLabel(n('a', { label: 'Alpha' }), { kindLabel: 'Worker', incoming: 1, outgoing: 2 })
    ).toBe('Alpha, Worker, 1 incoming, 2 outgoing')
    expect(nodeLabel(n('a', { label: '' }), { incoming: 0, outgoing: 0 })).toBe(
      'a, 0 incoming, 0 outgoing'
    )
  })

  it('names an edge by source, target, kind and weight, or says the weight is unknown', () => {
    const [a, b] = [n('a', { label: 'Alpha' }), n('b')]
    expect(edgeLabel(e('a', 'b', { weight: 4 }), a, b, 'Messaged')).toBe(
      'Alpha to b, Messaged, weight 4'
    )
    expect(edgeLabel(e('a', 'b', { weight: null }), a, b)).toBe('Alpha to b, weight unknown')
  })
})

describe('buildGraphModel', () => {
  it('leaves out nodes the layout did not place and counts them with their edges', () => {
    const only = {
      key: 'only-a',
      compute: () => ({
        positions: { a: { x: 1, y: 1 }, b: { x: Number.NaN, y: 1 } },
        order: ['a', 'zz'],
        width: 5,
        height: 5,
      }),
    }
    const model = buildGraphModel(ids('a', 'b', 'c'), [e('a', 'b'), e('b', 'c')], only, {
      width: 9,
      height: 9,
    })
    expect(model.order).toEqual(['a'])
    expect(model.unplacedNodes).toBe(2)
    expect(model.unplacedEdges).toBe(2)
    expect(Object.keys(model.positions)).toEqual(['a'])
  })

  it('appends placed nodes the layout left out of its order, and falls back to the viewport for a bad size', () => {
    const odd = {
      key: 'odd',
      compute: () => ({
        positions: { b: { x: 1, y: 1 }, a: { x: 2, y: 2 } },
        order: ['b', 'b'],
        width: Number.NaN,
        height: 4,
      }),
    }
    const model = buildGraphModel(ids('a', 'b'), [], odd, { width: 9, height: 9 })
    expect(model.order).toEqual(['b', 'a'])
    expect([model.width, model.height]).toEqual([9, 4])
  })

  it('does not throw on the hostile fixture and reports what it dropped', () => {
    const model = modelOf('Hostile')
    expect(model.report).toEqual({
      duplicateNodes: 1,
      selfEdges: 1,
      unknownEndpointEdges: 1,
      mergedEdges: 1,
    })
  })
})

describe('summarizeGraph', () => {
  const summary = (key: keyof typeof networkGraphFixtures) =>
    summarizeGraph(modelOf(key), networkGraphFixtures[key])

  it('gives node and edge counts, counts per kind and the most connected node', () => {
    expect(summary('Small (5)')).toBe(
      'Network graph with 5 nodes and 7 edges. Nodes: 1 Lead, 4 Worker. Edges: 3 Messaged, 4 Spawned. Most connected: lead-01 with 6 edges.'
    )
  })

  it('lists kinds in sorted order whatever the input order', () => {
    const nodes = ['zeta', 'alpha', 'zeta'].map((kind, i) => n(`n${i}`, { kind }))
    const model = buildGraphModel(nodes, [], layered, { width: 1, height: 1 })
    expect(summarizeGraph(model)).toContain('Nodes: 1 alpha, 2 zeta.')
  })

  it('counts nodes and edges without a kind under "no kind"', () => {
    expect(summarizeGraph(modelOf('Missing values'))).toContain(
      'Nodes: 4 no kind. Edges: 1 message, 2 no kind.'
    )
  })

  it('claims no structure for One item, and has an empty sentence for Empty', () => {
    expect(summary('One item')).toBe('Network graph with 1 node and no edges.')
    expect(summary('Empty')).toBe('Network graph with no nodes.')
  })

  it('names every dropped count', () => {
    const text = summary('Hostile')
    expect(text).toContain('1 duplicate node')
    expect(text).toContain('1 edge to unknown nodes')
    expect(text).toContain('1 self edge')
    expect(text).toContain('1 duplicate edge merged')
  })

  it('names how many nodes and edges are shown when the layout leaves some unplaced', () => {
    const half = {
      key: 'half',
      compute: () => ({
        positions: { 'lead-01': { x: 0, y: 0 }, 'worker-01': { x: 9, y: 9 } },
        order: ['lead-01', 'worker-01'],
        width: 1,
        height: 1,
      }),
    }
    const model = buildGraphModel(smallFixture.nodes, smallFixture.edges, half, {
      width: 1,
      height: 1,
    })
    expect(summarizeGraph(model)).toContain('Showing 2 of 5 nodes and 2 of 7 edges.')
  })
})
