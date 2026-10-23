import { describe, expect, it } from 'vitest'
import { fromCompoundLayout, type CompoundLayoutLike } from './compound-layout-adapter'

/** The shape graph-layout's `computeCompoundLayout` returns, with invented ids. */
const LAYOUT: CompoundLayoutLike = {
  nodes: [
    { id: 'api', x: 100, y: 60, width: 120, height: 40 },
    { id: 'kernel', x: 100, y: 200, width: 120, height: 40 },
  ],
  groups: [
    { id: 'service', x: 100, y: 55, width: 160, height: 90 },
    { id: 'core', x: 100, y: 195, width: 160, height: 90 },
  ],
  edges: [
    {
      srcId: 'api',
      dstId: 'kernel',
      attrs: {
        weight: 3,
        route: [
          { x: 100, y: 80 },
          { x: 100, y: 180 },
        ],
      },
    },
    { srcId: 'kernel', dstId: 'api' },
  ],
}

describe('fromCompoundLayout', () => {
  it('turns centred node boxes into top-left boxes', () => {
    const layout = fromCompoundLayout(LAYOUT)

    expect(layout.nodes.api).toEqual({ x: 40, y: 40, width: 120, height: 40 })
    expect(layout.nodes.kernel).toEqual({ x: 40, y: 180, width: 120, height: 40 })
  })

  it('turns each group box into the tier box of the same id', () => {
    const layout = fromCompoundLayout(LAYOUT)

    expect(layout.tiers).toEqual({
      service: { x: 20, y: 10, width: 160, height: 90 },
      core: { x: 20, y: 150, width: 160, height: 90 },
    })
  })

  it('maps group ids through tierOfGroup and drops the ones it rejects', () => {
    const layout = fromCompoundLayout(LAYOUT, {
      tierOfGroup: (id) => (id === 'core' ? 'tier-core' : null),
    })

    expect(Object.keys(layout.tiers ?? {})).toEqual(['tier-core'])
  })

  it('keys each attached route by the dependency edge id and skips edges without one', () => {
    const layout = fromCompoundLayout(LAYOUT)

    expect(layout.routes).toEqual({
      'api->kernel': [
        { x: 100, y: 80 },
        { x: 100, y: 180 },
      ],
    })
  })

  it('drops non-finite boxes and malformed routes', () => {
    const layout = fromCompoundLayout({
      nodes: [{ id: 'bad', x: Number.NaN, y: 0, width: 10, height: 10 }],
      groups: [{ id: 'flat', x: 0, y: 0, width: 0, height: 10 }],
      edges: [
        { srcId: 'a', dstId: 'b', attrs: { route: [{ x: 0, y: 0 }] } },
        { srcId: 'a', dstId: 'c', attrs: { route: [{ x: 0 }, { x: 1, y: 1 }] } },
      ],
    })

    expect(layout).toEqual({ nodes: {}, tiers: {}, routes: {} })
  })
})
