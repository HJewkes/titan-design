import { describe, expect, it } from 'vitest'
import { GRAPH_NODE_PADDING } from '../network-graph-model'
import type { GraphLayoutInput } from '../types'
import { boxLayout } from './box-layout-model'

const input = (ids: string[]): GraphLayoutInput => ({
  nodes: ids.map((id) => ({ id, label: id })),
  edges: [],
  width: 400,
  height: 300,
})

const BOXES = {
  a: { x: 20, y: 20, width: 100, height: 40 },
  b: { x: 160, y: 20, width: 100, height: 40 },
  far: { x: 20, y: 400, width: 100, height: 40 },
}
const GROUPS = [
  { id: 'inner', label: 'Inner', box: { x: 10, y: 10, width: 120, height: 60 } },
  { id: 'outer', label: 'Outer', box: { x: 0, y: 0, width: 300, height: 100 } },
]

describe('boxLayout', () => {
  // Mutation caught: positions at the box corner instead of its centre (labels and tooltips land off the box).
  it('places each node at the centre of its box, top row first', () => {
    const result = boxLayout({ boxes: BOXES }).compute(input(['far', 'b', 'a']))
    expect(result.positions).toEqual({
      a: { x: 70, y: 40 },
      b: { x: 210, y: 40 },
      far: { x: 70, y: 420 },
    })
    expect(result.order).toEqual(['a', 'b', 'far'])
  })

  // Mutation caught: a node without a box placed at the origin.
  it('leaves out a node without a box of some area', () => {
    const boxes = { ...BOXES, flat: { x: 0, y: 0, width: 0, height: 10 } }
    const result = boxLayout({ boxes }).compute(input(['a', 'flat', 'none']))
    expect(result.order).toEqual(['a'])
  })

  // Mutation caught: membership by the centre point, which counts a box that only overlaps the group.
  it('makes a group hold every node whose box lies wholly inside it, outermost first', () => {
    const result = boxLayout({ boxes: BOXES, groups: GROUPS }).compute(input(['a', 'b', 'far']))
    expect(result.groups?.map((g) => [g.id, g.variant, g.nodeIds])).toEqual([
      ['outer', 'box', ['a', 'b']],
      ['inner', 'box', ['a']],
    ])
  })

  it('sizes the canvas to the far corner of every box, group and route point', () => {
    const routes = {
      'a->b': [
        { x: 120, y: 40 },
        { x: 600, y: 40 },
      ],
    }
    const result = boxLayout({ boxes: BOXES, groups: GROUPS, routes }).compute(input(['a', 'far']))
    expect([result.width, result.height]).toEqual([
      600 + GRAPH_NODE_PADDING,
      440 + GRAPH_NODE_PADDING,
    ])
    expect([result.nodeShape, result.edgeShape]).toEqual(['box', 'routed'])
  })

  // Mutation caught: a key built from object insertion order, which recomputes on an equal input.
  it('keys equal options equally, whatever their key order', () => {
    const reordered = { far: BOXES.far, b: BOXES.b, a: BOXES.a }
    expect(boxLayout({ boxes: reordered }).key).toBe(boxLayout({ boxes: BOXES }).key)
    expect(boxLayout({ boxes: { a: BOXES.a } }).key).not.toBe(boxLayout({ boxes: BOXES }).key)
  })
})
