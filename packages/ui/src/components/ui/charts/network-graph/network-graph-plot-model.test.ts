import { describe, expect, it } from 'vitest'
import { contrast } from '../../../../theme/color-checks'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { smallFixture } from './fixtures'
import { layeredLayout } from './layouts/layered-layout-model'
import { buildGraphModel } from './network-graph-model'
import {
  ARROW_LENGTH,
  EDGE_REST_COLOR,
  EDGE_STRONG_COLOR,
  LABEL_MAX_CHARS,
  NODE_RADIUS,
  PARALLEL_EDGE_GAP,
  edgeGeometries,
  emphasisFor,
  kindColors,
  truncateLabel,
  weightText,
} from './network-graph-plot-model'
import type { GraphEdge, GraphLayout, GraphNode } from './types'

const n = (id: string): GraphNode => ({ id, label: id })
const at = (positions: Record<string, { x: number; y: number }>): GraphLayout => ({
  key: 'fixed',
  compute: () => ({ positions, order: Object.keys(positions), width: 400, height: 400 }),
})
const build = (nodes: GraphNode[], edges: GraphEdge[], layout: GraphLayout) =>
  buildGraphModel(nodes, edges, layout, { width: 400, height: 400 })
const small = build(smallFixture.nodes, smallFixture.edges, layeredLayout())

const PLANES = ['surface-base', 'surface-raised', 'surface-elevated', 'surface-overlay'] as const

describe('edge colours', () => {
  const cases = (['dark', 'light'] as const).flatMap((theme) =>
    [EDGE_REST_COLOR, EDGE_STRONG_COLOR].flatMap((edge) =>
      PLANES.map((plane) => [theme, edge, plane] as const)
    )
  )

  it.each(cases)(
    '%s %s clears 3:1 against %s, as WCAG 1.4.11 asks of graphics',
    (theme, edge, plane) => {
      const colors = getSemanticColors(theme) as Record<string, string>
      expect(contrast(colors[edge], colors[plane])).toBeGreaterThanOrEqual(3)
    }
  )
})

describe('truncateLabel', () => {
  it('keeps a label at the limit and cuts a longer one to the limit plus an ellipsis', () => {
    expect(truncateLabel('x'.repeat(LABEL_MAX_CHARS))).toBe('x'.repeat(LABEL_MAX_CHARS))
    expect(truncateLabel('x'.repeat(LABEL_MAX_CHARS + 1))).toBe(`${'x'.repeat(LABEL_MAX_CHARS)}…`)
  })

  it('counts an emoji as one character and never splits it', () => {
    expect(truncateLabel('🚀🚀🚀', 2)).toBe('🚀🚀…')
  })
})

describe('kindColors', () => {
  it('follows nodeKinds order, repeats past six kinds and lets a kind name its own colour', () => {
    const kinds = Array.from({ length: 8 }, (_, i) => ({
      id: `k${String(i)}`,
      label: `K${String(i)}`,
    }))
    const colors = kindColors([...kinds, { id: 'own', label: 'Own', color: 'status-success' }])
    expect(colors.get('k0')).toBe('dataviz-categorical-0')
    expect(colors.get('k5')).toBe('dataviz-categorical-5')
    expect(colors.get('k6')).toBe('dataviz-categorical-0')
    expect(colors.get('own')).toBe('status-success')
    expect(kindColors().size).toBe(0)
  })
})

describe('edgeGeometries', () => {
  it('gives one geometry per drawn edge, with the weight step and the dash of its kind', () => {
    const geometries = edgeGeometries(small, smallFixture.edgeKinds)
    expect(geometries.map((g) => g.id)).toEqual(small.drawnEdges.map((e) => e.id))
    const byId = new Map(geometries.map((g) => [g.id, g]))
    expect(byId.get('lead-01->worker-01:spawn')).toMatchObject({ isDashed: false, step: 0 })
    expect(byId.get('worker-02->worker-03:message')).toMatchObject({ isDashed: true, step: 0 })
    expect(byId.get('worker-04->lead-01:message')).toMatchObject({ isDashed: true, step: 2 })
  })

  it('draws every edge solid when no edge kind says dashed', () => {
    expect(edgeGeometries(small).every((g) => !g.isDashed)).toBe(true)
  })

  it('starts at the source rim and stops short of the target by the arrowhead', () => {
    const model = build(
      [n('a'), n('b')],
      [{ source: 'a', target: 'b' }],
      at({
        a: { x: 100, y: 50 },
        b: { x: 300, y: 50 },
      })
    )
    const [forward] = edgeGeometries(model)
    expect(forward?.path.startsWith(`M${String(100 + NODE_RADIUS)},50`)).toBe(true)
    expect(forward?.path.endsWith(`${String(300 - NODE_RADIUS - ARROW_LENGTH)},50`)).toBe(true)
    expect(forward?.mid).toEqual({ x: (106 + 287) / 2, y: 50 })
  })

  it('leaves a leftward edge on the side of the target it arrives from', () => {
    const model = build(
      [n('a'), n('b')],
      [{ source: 'b', target: 'a' }],
      at({
        a: { x: 100, y: 50 },
        b: { x: 300, y: 50 },
      })
    )
    const [back] = edgeGeometries(model)
    expect(back?.path.startsWith(`M${String(300 - NODE_RADIUS)},50`)).toBe(true)
    expect(back?.path.endsWith(`${String(100 + NODE_RADIUS + ARROW_LENGTH)},50`)).toBe(true)
  })

  it('runs an edge between two nodes of one column along the column', () => {
    const model = build(
      [n('a'), n('b')],
      [{ source: 'a', target: 'b' }],
      at({
        a: { x: 100, y: 50 },
        b: { x: 100, y: 200 },
      })
    )
    const [down] = edgeGeometries(model)
    expect(down?.path.startsWith(`M100,${String(50 + NODE_RADIUS)}`)).toBe(true)
    expect(down?.path.endsWith(`100,${String(200 - NODE_RADIUS - ARROW_LENGTH)}`)).toBe(true)
  })

  it('separates the edges that join one pair of nodes, in either direction', () => {
    const edges = [
      { source: 'a', target: 'b', kind: 'spawn' },
      { source: 'a', target: 'b', kind: 'message' },
      { source: 'b', target: 'a', kind: 'message' },
    ]
    const model = build([n('a'), n('b')], edges, at({ a: { x: 100, y: 50 }, b: { x: 300, y: 50 } }))
    const mids = edgeGeometries(model).map((g) => g.mid.y)
    expect(mids).toEqual([50 - PARALLEL_EDGE_GAP, 50, 50 + PARALLEL_EDGE_GAP])
    expect(new Set(edgeGeometries(model).map((g) => g.path)).size).toBe(3)
  })

  it('gives finite paths for two nodes at the same point', () => {
    const model = build(
      [n('a'), n('b')],
      [{ source: 'a', target: 'b' }],
      at({
        a: { x: 100, y: 50 },
        b: { x: 100, y: 50 },
      })
    )
    expect(edgeGeometries(model)[0]?.path).not.toMatch(/NaN|Infinity/)
  })
})

describe('emphasisFor', () => {
  it('is null when nothing is active', () => {
    expect(emphasisFor(small.index, null)).toBeNull()
  })

  it('keeps an active node, its edges and its neighbours', () => {
    const emphasis = emphasisFor(small.index, { type: 'node', id: 'worker-02' })
    expect([...(emphasis?.nodes ?? [])].sort()).toEqual(['lead-01', 'worker-02', 'worker-03'])
    expect([...(emphasis?.edges ?? [])].sort()).toEqual([
      'lead-01->worker-02:spawn',
      'worker-02->worker-03:message',
    ])
  })

  it('keeps an active edge and its two ends, and nothing for an edge that is not drawn', () => {
    const id = 'worker-04->lead-01:message'
    const emphasis = emphasisFor(small.index, { type: 'edge', id, from: 'lead-01' })
    expect([...(emphasis?.nodes ?? [])].sort()).toEqual(['lead-01', 'worker-04'])
    expect([...(emphasis?.edges ?? [])]).toEqual([id])
    expect(emphasisFor(small.index, { type: 'edge', id: 'ghost', from: 'lead-01' })).toBeNull()
  })
})

describe('weightText', () => {
  it('names a valid weight and calls every other value unknown', () => {
    const edge = { source: 'a', target: 'b' }
    expect(weightText({ ...edge, weight: 0 })).toBe('weight 0')
    expect(weightText({ ...edge, weight: 12 })).toBe('weight 12')
    expect(
      [null, undefined, Number.NaN, -1].map((weight) => weightText({ ...edge, weight }))
    ).toEqual(Array(4).fill('weight unknown'))
  })
})
