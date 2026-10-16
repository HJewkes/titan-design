import fc from 'fast-check'
import { describe, expect, it, vi } from 'vitest'
import { fcAssert } from '../../../../test/property'
import { groupedGroups, networkGraphFixtures, smallFixture } from './fixtures'
import { clusteredLayout } from './layouts/clustered-layout-model'
import { egoLayout } from './layouts/ego-layout-model'
import { forceLayout } from './layouts/force-layout-model'
import { layeredLayout } from './layouts/layered-layout-model'
import {
  binWeight,
  buildGraphModel,
  cleanGraph,
  edgePath,
  edgeSlots,
  GRAPH_NODE_RADIUS,
  indexGraph,
  weightRange,
} from './network-graph-model'
import { nextFocus } from './network-graph-focus'
import {
  groupLabelsByNode,
  labelBox,
  pinnedNodeIds,
  placeLabels,
  type LabelBox,
} from './network-graph-labels'
import { edgeLabel, nodeLabel, summarizeGraph } from './network-graph-text'
import type {
  GraphEdge,
  GraphLayout,
  GraphFocus,
  GraphFocusKey,
  GraphIndex,
  GraphNode,
  GraphPoint,
} from './types'

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
    // 0.1 + 0.2 + 0.3 and 0.3 + 0.2 + 0.1 differ in floating point; the ascending sum is the total.
    const ascending = [0.1, 0.2, 0.3].map((weight) => e('a', 'b', { weight }))
    const merged = cleanGraph(ids('c', 'b', 'a'), ascending)
    expect(merged.nodes.map((x) => x.id)).toEqual(['a', 'b', 'c'])
    expect(merged.edges[0]?.weight).toBe(0.1 + 0.2 + 0.3)
    expect(cleanGraph(ids('a', 'b'), [...ascending].reverse()).edges[0]?.weight).toBe(
      merged.edges[0]?.weight
    )
    const sorted = cleanGraph(abc, [e('c', 'a'), e('b', 'c'), e('a', 'c'), e('a', 'b')]).edges
    expect(sorted.map((x) => `${x.source}${x.target}`)).toEqual(['ab', 'ac', 'bc', 'ca'])
  })

  it("merges kind '' with no kind, and the merged edge has no kind whichever arrived first", () => {
    const blank = e('a', 'b', { kind: '', weight: 1 })
    const none = e('a', 'b', { weight: 2 })
    const forward = cleanGraph(ids('a', 'b'), [blank, none])
    expect(forward.edges).toStrictEqual([{ id: 'a->b:', source: 'a', target: 'b', weight: 3 }])
    expect(forward.report.mergedEdges).toBe(1)
    expect(cleanGraph(ids('a', 'b'), [none, blank])).toStrictEqual(forward)
    expect(cleanGraph(ids('a', 'b'), [blank]).edges[0]).not.toHaveProperty('kind')
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

const fnv = (text: string) => {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16)
}

describe('edgePath', () => {
  it("'horizontal' returns the same path as before", () => {
    const hashes = Object.fromEntries(
      Object.keys(networkGraphFixtures).map((key) => {
        const model = modelOf(key as keyof typeof networkGraphFixtures)
        const paths = model.drawnEdges.map((edge) =>
          edgePath(
            model.positions[edge.source] as GraphPoint,
            model.positions[edge.target] as GraphPoint
          )
        )
        return [key, `${paths.length}:${fnv(paths.join('\n'))}`]
      })
    )
    expect(hashes).toMatchInlineSnapshot(`
      {
        "All equal": "8:852e277c",
        "Deep chain": "11:d86c6b9a",
        "Directed chain": "5:7eb8c9b7",
        "Empty": "0:811c9dc5",
        "Grouped (40)": "53:2b349dfa",
        "Hostile": "5:f5ce052",
        "Hub and spokes": "51:f75ff33e",
        "Large (150)": "295:d2ba57ad",
        "Long label": "3:a9dc3874",
        "Many groups": "13:7c0c6890",
        "Many kinds": "7:324e6001",
        "Medium (30)": "44:b15f1f6c",
        "Missing values": "3:2c6ba0e8",
        "Mutual pair": "3:2116dad2",
        "No edges": "0:811c9dc5",
        "One group": "9:9d092f29",
        "One item": "0:811c9dc5",
        "Pulse": "7:e77ac5ad",
        "Small (5)": "7:e77ac5ad",
        "Supplied": "7:e77ac5ad",
        "Two components": "12:30a45071",
        "Wide fan-out": "60:5d4d50d5",
      }
    `)
  })

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

const viewport = { width: 800, height: 600 }
const fixtureModel = (key: keyof typeof networkGraphFixtures, layout: GraphLayout) => {
  const { nodes, edges } = networkGraphFixtures[key]
  return buildGraphModel(nodes, edges, layout, viewport)
}
const at = (x: number, y: number) => ({ x, y })
const parseArc = (path: string) => {
  const [sx, sy, cx, cy, ex, ey] = (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number) as number[]
  return { start: at(sx, sy), control: at(cx, cy), end: at(ex, ey) }
}
const side = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  p: { x: number; y: number }
) => Math.sign((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x))
const curveMid = (path: string) => {
  const { start, control, end } = parseArc(path)
  return at((start.x + 2 * control.x + end.x) / 4, (start.y + 2 * control.y + end.y) / 4)
}

describe('edgePath arc', () => {
  const [from, to] = [at(0, 0), at(100, 0)]

  it('starts and ends one mark radius from the node centres', () => {
    const { start, end } = parseArc(edgePath(from, to, 'arc'))
    expect(start).toEqual(at(GRAPH_NODE_RADIUS, 0))
    expect(end).toEqual(at(100 - GRAPH_NODE_RADIUS, 0))
    const diagonal = parseArc(edgePath(at(0, 0), at(60, 80), 'arc'))
    expect(Math.hypot(diagonal.start.x, diagonal.start.y)).toBeCloseTo(GRAPH_NODE_RADIUS, 1)
  })

  it('bows the two directions of a mutual pair to opposite sides, and a second edge the same way bows further', () => {
    const there = edgePath(from, to, 'arc', 0)
    const back = edgePath(to, from, 'arc', 0)
    const second = edgePath(from, to, 'arc', 1)
    expect(there).not.toBe(back)
    expect(side(from, to, parseArc(there).control)).toBe(-side(from, to, parseArc(back).control))
    expect(side(from, to, curveMid(there))).not.toBe(side(from, to, curveMid(back)))
    expect(Math.abs(parseArc(second).control.y)).toBeGreaterThan(
      Math.abs(parseArc(there).control.y)
    )
    expect(side(from, to, parseArc(second).control)).toBe(side(from, to, parseArc(there).control))
  })

  it('gives each edge of Mutual pair its own slot and its own path', () => {
    const model = fixtureModel('Mutual pair', forceLayout())
    const slots = edgeSlots(model.drawnEdges)
    const paths = model.drawnEdges.map((edge) =>
      edgePath(
        model.positions[edge.source] as GraphPoint,
        model.positions[edge.target] as GraphPoint,
        model.edgeShape,
        slots.get(edge.id as string)
      )
    )
    expect(new Set(paths).size).toBe(paths.length)
    expect([...slots.values()].sort()).toEqual([0, 0, 1])
  })

  it('gives no path and no NaN for coincident, overlapping or non-finite ends', () => {
    for (const [a, b] of [
      [at(5, 5), at(5, 5)],
      [at(0, 0), at(2 * GRAPH_NODE_RADIUS, 0)],
      [at(Number.NaN, 0), at(3, 3)],
      [at(0, 0), at(Number.POSITIVE_INFINITY, 1)],
    ] as const) {
      const path = edgePath(a, b, 'arc', 0)
      expect(path).toBe('')
      expect(path).not.toContain('NaN')
    }
    expect(edgePath(at(0, 0), at(50, 0), 'arc', Number.NaN)).toMatch(/^M/)
  })
})

const placed = (...points: [string, number, number, Partial<GraphNode>?][]) => {
  const positions = Object.fromEntries(points.map(([id, x, y]) => [id, at(x, y)]))
  const layout: GraphLayout = {
    key: 'fixed',
    compute: () => ({
      positions,
      order: points.map(([id]) => id),
      width: 400,
      height: 400,
      labelMode: 'declutter',
    }),
  }
  return layout
}
const crowded = (edges: GraphEdge[] = [], row = false) =>
  buildGraphModel(
    ids('aa', 'bb', 'cc', 'dd'),
    edges,
    row
      ? placed(['aa', 10, 10], ['bb', 20, 10], ['cc', 30, 10], ['dd', 300, 300])
      : placed(['aa', 10, 10], ['bb', 10, 22], ['cc', 10, 34], ['dd', 300, 300]),
    viewport
  )
const meets = (a: LabelBox, b: LabelBox) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const keptPairs = (kept: Map<string, LabelBox>) => {
  const entries = [...kept]
  return entries.flatMap(([ida, a], i) =>
    entries.slice(i + 1).map(([idb, b]) => ({ ida, idb, hit: meets(a, b) }))
  )
}

describe('placeLabels', () => {
  it("'all' keeps every label", () => {
    const model = modelOf('Medium (30)')
    expect(model.labelMode).toBe('all')
    expect([...placeLabels(model).keys()].sort()).toEqual([...model.order].sort())
  })

  it("'all' keeps every label even where labels and marks meet", () => {
    const layout = placed(['aa', 10, 10], ['bb', 20, 10], ['cc', 30, 10])
    const all: GraphLayout = {
      key: 'all',
      compute: (input) => ({ ...layout.compute(input), labelMode: 'all' }),
    }
    const model = buildGraphModel(ids('aa', 'bb', 'cc'), [], all, viewport)
    expect([...placeLabels(model).keys()]).toEqual(['aa', 'bb', 'cc'])
  })

  it('under declutter, no two kept label rectangles meet unless both are pinned', () => {
    const point = fc.record({
      x: fc.integer({ min: 0, max: 120 }),
      y: fc.integer({ min: 0, max: 60 }),
    })
    fcAssert(
      fc.property(
        fc.array(point, { minLength: 0, maxLength: 24 }),
        fc.array(fc.nat(30), { maxLength: 8 }),
        fc.array(fc.tuple(fc.nat(23), fc.nat(23)), { maxLength: 20 }),
        (points, pinnedAt, links) => {
          const names = points.map((_, i) => `n${String(i).padStart(2, '0')}`)
          const model = buildGraphModel(
            ids(...names),
            links.map(([a, b]) =>
              e(`n${String(a).padStart(2, '0')}`, `n${String(b).padStart(2, '0')}`)
            ),
            placed(
              ...points.map((p, i) => [names[i] as string, p.x, p.y] as [string, number, number])
            ),
            viewport
          )
          const pinned = new Set(pinnedAt.map((i) => names[i]).filter((id): id is string => !!id))
          const kept = placeLabels(model, pinned)
          for (const id of pinned) expect(kept.has(id)).toBe(true)
          for (const { ida, idb, hit } of keptPairs(kept)) {
            if (hit) expect(pinned.has(ida) && pinned.has(idb)).toBe(true)
          }
        }
      )
    )
  })

  it('returns no two overlapping kept label boxes over Large (150)', () => {
    const model = fixtureModel('Large (150)', forceLayout())
    const kept = placeLabels(model)
    expect(kept.size).toBeGreaterThan(0)
    expect(kept.size).toBeLessThan(model.order.length)
    expect(keptPairs(kept).filter((pair) => pair.hit)).toEqual([])
  })

  it('keeps the selected node, the active node and its neighbours even when they overlap, and a higher-degree node wins a conflict', () => {
    const model = crowded([e('bb', 'aa'), e('bb', 'cc'), e('cc', 'dd')])
    const pinned = pinnedNodeIds(model.index, 'aa', 'bb')
    expect([...pinned].sort()).toEqual(['aa', 'bb', 'cc'])
    expect([...placeLabels(model, pinned).keys()].sort()).toEqual(['aa', 'bb', 'cc', 'dd'])
    const unpinned = placeLabels(model)
    expect(unpinned.has('bb')).toBe(true)
    expect(unpinned.has('cc')).toBe(false)
    expect(unpinned.has('aa')).toBe(false)
    expect(unpinned.has('dd')).toBe(true)
  })

  it('never drops a pinned label that sits on another node', () => {
    const model = crowded([], true)
    expect(placeLabels(model, new Set(['aa'])).has('aa')).toBe(true)
    expect(placeLabels(model, new Set(['aa'])).has('bb')).toBe(false)
  })

  it('is independent of the order nodes and edges arrive in', () => {
    const { nodes, edges } = networkGraphFixtures['Grouped (40)']
    const layout = forceLayout({ seed: 3 })
    const forward = buildGraphModel(nodes, edges, layout, viewport)
    const reversed = buildGraphModel([...nodes].reverse(), [...edges].reverse(), layout, viewport)
    const pinned = new Set(['alpha-01'])
    expect([...placeLabels(forward, pinned)]).toEqual([...placeLabels(reversed, pinned)])
    const shuffled = { ...forward, order: [...forward.order].reverse() }
    expect([...placeLabels(shuffled, pinned).keys()].sort()).toEqual(
      [...placeLabels(forward, pinned).keys()].sort()
    )
  })

  it('estimates a box from the truncated label length', () => {
    const model = crowded()
    const long = {
      ...model,
      index: { ...model.index, nodesById: new Map([['aa', n('aa', { label: 'x'.repeat(200) })]]) },
    }
    expect(labelBox(long, 'aa')?.width).toBe((labelBox(model, 'aa')?.width ?? 0) * 10)
    expect(labelBox(model, 'missing')).toBeNull()
  })
})

describe('group labels', () => {
  const clustered = () => fixtureModel('Grouped (40)', clusteredLayout({ groups: groupedGroups }))
  const ego = () => fixtureModel('Hub and spokes', egoLayout({ focusId: 'hub-01', hops: 2 }))

  it("a node's name holds its group label; with no groups the name is unchanged", () => {
    const model = clustered()
    const labels = groupLabelsByNode(model)
    const node = model.nodes.find((x) => x.group === 'beta') as GraphNode
    const context = {
      incoming: 1,
      outgoing: 2,
      kindLabel: 'Worker',
      groupLabels: labels.get(node.id),
    }
    expect(nodeLabel(node, context)).toBe(`${node.id}, Worker, Beta, 1 incoming, 2 outgoing`)
    const bare = { incoming: 1, outgoing: 2, kindLabel: 'Worker' }
    expect(nodeLabel(node, { ...bare, groupLabels: [] })).toBe(nodeLabel(node, bare))
    expect(groupLabelsByNode(modelOf('Small (5)')).size).toBe(0)
  })

  it('names the hop for an ego node', () => {
    const model = ego()
    const labels = groupLabelsByNode(model)
    expect(labels.get('hub-01')).toEqual(['focus'])
    const hop = model.groups.find((group) => group.label === '1 hop')
    expect(labels.get(hop?.nodeIds[0] as string)).toEqual(['1 hop'])
  })

  it('the summary states region counts, or the focus and ring counts, and still states the unplaced count', () => {
    const regions = summarizeGraph(clustered())
    expect(regions).toMatch(/5 groups: Alpha \d+, Beta \d+, Gamma \d+, Delta \d+, Ungrouped 5\./)
    const model = ego()
    const rings = model.groups.filter((group) => group.variant === 'ring')
    const text = summarizeGraph(model)
    expect(text).toContain(
      `Focus hub-01: ${rings
        .slice(1)
        .map((ring) => `${ring.label} ${ring.nodeIds.length}`)
        .join(', ')}.`
    )
    const unplaced = fixtureModel('Two components', egoLayout({ focusId: 'alpha-01', hops: 1 }))
    expect(unplaced.unplacedNodes).toBeGreaterThan(0)
    expect(summarizeGraph(unplaced)).toMatch(
      /Focus alpha-01: 1 hop \d+\..*Showing \d+ of \d+ nodes/
    )
    expect(summarizeGraph(modelOf('Small (5)'))).not.toMatch(/group|Focus/)
  })

  it('counts only placed nodes in each group', () => {
    const model = fixtureModel('Two components', egoLayout({ focusId: 'alpha-01', hops: 1 }))
    const members = model.groups.flatMap((group) => group.nodeIds)
    expect(members.sort()).toEqual([...model.order].sort())
  })
})

describe('model hints', () => {
  it('reads edgeShape, labelMode and groups from the layout, defaulting to horizontal, all and none', () => {
    const plain = modelOf('Small (5)')
    expect([plain.edgeShape, plain.labelMode, plain.groups]).toEqual(['horizontal', 'all', []])
    const free = fixtureModel('Small (5)', forceLayout())
    expect([free.edgeShape, free.labelMode]).toEqual(['arc', 'declutter'])
  })
})

describe('purity and degenerate input', () => {
  it('calls no random source, clock or timer', () => {
    const fail = () => {
      throw new Error('impure call')
    }
    const spies = [
      vi.spyOn(Math, 'random').mockImplementation(fail),
      vi.spyOn(Date, 'now').mockImplementation(fail),
      vi.spyOn(globalThis, 'setTimeout').mockImplementation(fail),
      vi.spyOn(globalThis, 'setInterval').mockImplementation(fail),
    ]
    try {
      const model = fixtureModel('Grouped (40)', egoLayout({ focusId: 'alpha-01' }))
      const pinned = pinnedNodeIds(model.index, 'alpha-01', 'alpha-02')
      placeLabels(model, pinned)
      groupLabelsByNode(model)
      summarizeGraph(model)
      edgeSlots(model.drawnEdges)
      edgePath(at(0, 0), at(50, 50), 'arc', 1)
    } finally {
      for (const spy of spies) spy.mockRestore()
    }
  })

  it('stays finite and does not throw for 0 nodes, 1 node, a self-loop and NaN coordinates', () => {
    const nan = placed(['aa', Number.NaN, 1], ['bb', 5, 5])
    const inputs: [GraphNode[], GraphEdge[], GraphLayout][] = [
      [[], [], forceLayout()],
      [ids('aa'), [], forceLayout()],
      [ids('aa'), [e('aa', 'aa')], egoLayout({ focusId: 'aa' })],
      [ids('aa', 'bb'), [e('aa', 'bb'), e('bb', 'aa')], nan],
    ]
    for (const [nodes, edges, layout] of inputs) {
      const model = buildGraphModel(nodes, edges, layout, viewport)
      const kept = placeLabels(model, pinnedNodeIds(model.index, 'aa', 'aa'))
      const slots = edgeSlots(model.drawnEdges)
      const paths = model.drawnEdges.map((edge) =>
        edgePath(
          model.positions[edge.source] as GraphPoint,
          model.positions[edge.target] as GraphPoint,
          'arc',
          slots.get(edge.id as string)
        )
      )
      expect(JSON.stringify([...kept.values(), paths, summarizeGraph(model)])).not.toMatch(
        /NaN|Infinity|null/
      )
    }
  })
})
