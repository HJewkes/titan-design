import { describe, expect, it } from 'vitest'
import { mapLayoutFixture, mapTimelineFixture, straightMapFixture } from './fixtures'
import type { MapLayout, MapNode } from './types'
import { validateMapLayout, validateMapTimeline } from './validate'

const withNode = (id: string, change: (node: MapNode) => MapNode): MapLayout => ({
  ...mapLayoutFixture,
  nodes: mapLayoutFixture.nodes.map((node) => (node.id === id ? change(node) : node)),
})

describe('map fixtures', () => {
  it('the layout fixture is valid', () => {
    expect(validateMapLayout(mapLayoutFixture)).toEqual([])
  })

  it('the straight fixture is valid and has no routes', () => {
    expect(validateMapLayout(straightMapFixture)).toEqual([])
    expect(straightMapFixture.edges.some((edge) => edge.route)).toBe(false)
  })

  it('the timeline fixture is valid against the layout', () => {
    expect(validateMapTimeline(mapTimelineFixture, mapLayoutFixture)).toEqual([])
  })

  it('every edge, L0 and L1 included, carries a pipeline route', () => {
    const levels = new Set(mapLayoutFixture.edges.map((edge) => edge.level))
    expect([...levels].sort()).toEqual([0, 1, 3])
    expect(mapLayoutFixture.edges.every((edge) => (edge.route?.length ?? 0) >= 2)).toBe(true)
  })
})

describe('validateMapLayout', () => {
  it('rejects a child moved outside its parent', () => {
    const moved = withNode('pkg/api/+more', (node) => ({
      ...node,
      box: { ...node.box, x: 1200 },
    }))
    expect(validateMapLayout(moved)).toEqual(['node pkg/api/+more: box outside its parent'])
  })

  it('rejects a duplicate node id', () => {
    const doubled = {
      ...mapLayoutFixture,
      nodes: [...mapLayoutFixture.nodes, mapLayoutFixture.nodes[0] as MapNode],
    }
    expect(validateMapLayout(doubled)).toEqual(['duplicate node id actor:user'])
  })

  it('rejects a child no deeper than its parent', () => {
    const shallow = withNode('pkg/api/routes', (node) => ({ ...node, level: 1 }))
    expect(validateMapLayout(shallow)).toEqual(['node pkg/api/routes: not deeper than its parent'])
  })

  it('rejects an edge whose end does not exist', () => {
    const edges = mapLayoutFixture.edges.map((edge) =>
      edge.id === 'e:api->store' ? { ...edge, target: 'pkg/gone' } : edge
    )
    expect(validateMapLayout({ ...mapLayoutFixture, edges })).toEqual([
      'edge e:api->store: target pkg/gone does not exist',
    ])
  })

  it('rejects a route that does not start on its source box', () => {
    const off = mapLayoutFixture.edges.map((edge) =>
      edge.id === 'e:web->api'
        ? {
            ...edge,
            route: [
              [810, 700],
              [810, 680],
            ] as const,
          }
        : edge
    )
    expect(validateMapLayout({ ...mapLayoutFixture, edges: off })).toEqual([
      'edge e:web->api: route does not start on its source',
    ])
  })

  it('rejects a flow hop and a card that point at nothing', () => {
    const broken: MapLayout = {
      ...mapLayoutFixture,
      flows: [
        { id: 'f', hops: [{ step: 1, edgeId: 'e:none', from: 'a', to: 'b', edgeSource: 'call' }] },
      ],
      cards: [{ id: 'c', kind: 'stat', anchor: 'pkg/none' }],
    }
    expect(validateMapLayout(broken)).toEqual([
      'flow f step 1: edge e:none does not exist',
      'card c: anchor pkg/none does not exist',
    ])
  })
})

describe('validateMapTimeline', () => {
  it('rejects unknown ids, out-of-order keyframes and keyframes off the map', () => {
    const timeline = {
      ...mapTimelineFixture,
      keyframes: [
        { atS: 2, durS: 0.4, op: 'reveal', ids: ['pkg/none'] },
        { atS: 1, durS: 0.4, op: 'edge', ids: ['e:web->api'] },
        { atS: 7, durS: 0.4, op: 'card-in', ids: ['card:notes.ts'] },
      ] as const,
    }
    expect(validateMapTimeline(timeline, mapLayoutFixture)).toEqual([
      'keyframe 0: unknown node pkg/none',
      'keyframe 1: out of order',
      'keyframe 2: starts outside every span',
    ])
  })

  it('rejects overlapping spans', () => {
    const timeline = {
      ...mapTimelineFixture,
      spans: [
        { startS: 0, endS: 6 },
        { startS: 5, endS: 14 },
      ],
    }
    expect(validateMapTimeline(timeline, mapLayoutFixture)).toEqual([
      'span 1: overlaps or precedes span 0',
    ])
  })
})
