import { describe, expect, it } from 'vitest'
import {
  judgeAlignmentNearMiss,
  judgeEdgeClearance,
  judgeInsetAsymmetry,
  judgeLayout,
  judgeStackedInset,
} from './layout-probes.mjs'

const flex = (flexDirection = 'column') => ({
  display: 'flex',
  flexDirection,
  flexWrap: 'nowrap',
  alignItems: 'normal',
  alignSelf: 'auto',
  position: 'static',
})
const flow = {
  display: 'block',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'normal',
  alignSelf: 'auto',
  position: 'static',
}
const textOf = (box) => {
  const [x, y, w, h] = box
  const line = { baseline: y + h, inkTop: y, inkBottom: y + h, left: x, right: x + w }
  return { fontSize: 14, lineCount: 1, left: x, right: x + w, first: line, last: line }
}
// A node with the collector's shape; ink defaults to the box of a painted node, else the text.
const node = (id, parent, box, extra = {}) => {
  const n = {
    id,
    parent,
    selector: `.n${id}`,
    tag: 'div',
    role: null,
    interactive: false,
    box,
    pad: [0, 0, 0, 0],
    border: [0, 0, 0, 0],
    margin: [0, 0, 0, 0],
    layout: flow,
    paints: false,
    text: null,
    ink: null,
    ...extra,
  }
  if (n.paints) n.ink = box
  else if (n.text) n.ink = [n.text.left, n.text.first.inkTop, n.text.right - n.text.left, n.box[3]]
  return n
}
// Like the collector, an unpainted box takes the union of its children's ink.
const layout = (...nodes) => {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  for (const n of [...nodes].reverse()) {
    const p = byId.get(n.parent)
    if (!p || p.paints || !n.ink) continue
    const [x, y] = [
      Math.min(p.ink?.[0] ?? n.ink[0], n.ink[0]),
      Math.min(p.ink?.[1] ?? n.ink[1], n.ink[1]),
    ]
    const r = Math.max(p.ink ? p.ink[0] + p.ink[2] : 0, n.ink[0] + n.ink[2])
    const b = Math.max(p.ink ? p.ink[1] + p.ink[3] : 0, n.ink[1] + n.ink[3])
    p.ink = [x, y, r - x, b - y]
  }
  return { nodes, truncated: false, declared: {} }
}

// Column of heading + body: the heading wrapper carries `padBottom` that paints nothing, and the
// body starts `gap` below the wrapper box.
const stackWith = ({ padBottom, gap = 8, wrapper = {} }) => {
  const wrapperBox = [0, 0, 200, 16 + padBottom]
  const text = node('0.0', '0', [0, 0, 200, 16], { text: textOf([0, 0, 120, 16]) })
  const a = node('0', 'root', wrapperBox, {
    pad: [0, 0, padBottom, 0],
    ...wrapper,
  })
  const b = node('1', 'root', [0, 16 + padBottom + gap, 200, 16], {
    text: textOf([0, 16 + padBottom + gap, 120, 16]),
  })
  const root = node('root', null, [0, 0, 200, 80], { layout: flex() })
  return layout(root, a, text, b)
}

describe('stacked-inset', () => {
  it('flags hidden padding that widens the gap by the 4px threshold', () => {
    const found = judgeStackedInset(stackWith({ padBottom: 4 }))
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ kind: 'stacked-inset', selector: '.n0' })
    expect(found[0].detail).toBe(
      'visible gap 12px = layout gap 8px + paddingBottom 4px on .n0, which paint nothing ' +
        '(next sibling .n1; threshold 4px)'
    )
  })

  it('stays quiet one pixel under the threshold', () => {
    expect(judgeStackedInset(stackWith({ padBottom: 3 }))).toEqual([])
  })

  it('exempts an interactive box, whose padding is a hit target', () => {
    expect(judgeStackedInset(stackWith({ padBottom: 12, wrapper: { interactive: true } }))).toEqual(
      []
    )
  })

  it('exempts a painted card, whose padding shows', () => {
    expect(judgeStackedInset(stackWith({ padBottom: 16, wrapper: { paints: true } }))).toEqual([])
  })

  it('exempts a stack whose every gap carries the same hidden padding', () => {
    const row = (i) => {
      const y = i * 32
      return [
        node(`${i}`, 'root', [0, y, 200, 32], { pad: [8, 0, 8, 0] }),
        node(`${i}.0`, `${i}`, [0, y + 8, 200, 16], { text: textOf([0, y + 8, 100, 16]) }),
      ]
    }
    const root = node('root', null, [0, 0, 200, 96], { layout: flex() })
    expect(judgeStackedInset(layout(root, ...row(0), ...row(1), ...row(2)))).toEqual([])
  })

  it('flags the one gap whose hidden padding differs by the threshold from the others', () => {
    const base = stackWith({ padBottom: 8, gap: 0 })
    const extra = node('2', 'root', [0, 80, 200, 16], { text: textOf([0, 80, 120, 16]) })
    const third = node('3', 'root', [0, 112, 200, 16], { text: textOf([0, 112, 120, 16]) })
    const found = judgeStackedInset(layout(...base.nodes, extra, third))
    expect(found.map((f) => f.selector)).toEqual(['.n0'])
  })

  it('measures along x in a flex row', () => {
    const a = node('0', 'root', [0, 0, 70, 16], { pad: [0, 10, 0, 0] })
    const text = node('0.0', '0', [0, 0, 60, 16], { text: textOf([0, 0, 60, 16]) })
    const b = node('1', 'root', [78, 0, 60, 16], { text: textOf([78, 0, 60, 16]) })
    const root = node('root', null, [0, 0, 200, 16], { layout: flex('row') })
    expect(judgeStackedInset(layout(root, a, text, b))[0].detail).toContain('paddingRight 10px')
  })

  it('ignores a gap that padding does not explain: a narrow label in a wide padded cell', () => {
    const cell = node('0', 'root', [0, 0, 200, 16], { pad: [0, 16, 0, 0] })
    const text = node('0.0', '0', [0, 0, 60, 16], { text: textOf([0, 0, 60, 16]) })
    const next = node('1', 'root', [200, 0, 60, 16], { text: textOf([200, 0, 60, 16]) })
    const root = node('root', null, [0, 0, 300, 16], { layout: flex('row') })
    expect(judgeStackedInset(layout(root, cell, text, next))).toEqual([])
  })

  it('flags padding over a tall line box whose glyph ink sits well inside it', () => {
    const wrapper = node('0', 'root', [0, 0, 200, 40], { pad: [0, 0, 12, 0] })
    const line = node('0.0', '0', [0, 0, 200, 28], {
      text: { ...textOf([0, 6, 120, 16]), fontSize: 24 },
    })
    const body = node('1', 'root', [0, 48, 200, 20], { text: textOf([0, 48, 120, 20]) })
    const root = node('root', null, [0, 0, 200, 80], { layout: flex() })
    const found = judgeStackedInset(layout(root, wrapper, line, body))
    expect(found).toHaveLength(1)
    expect(found[0].detail).toContain('paddingBottom 12px on .n0')
  })

  it('exempts table cells, whose padding is the column rhythm', () => {
    const cell = node('0', 'root', [0, 0, 84, 16], { pad: [0, 16, 0, 0], role: 'cell' })
    const text = node('0.0', '0', [0, 0, 60, 16], { text: textOf([0, 0, 60, 16]) })
    const next = node('1', 'root', [84, 0, 60, 16], { text: textOf([84, 0, 60, 16]), role: 'cell' })
    const root = node('root', null, [0, 0, 300, 16], { layout: flex('row') })
    expect(judgeStackedInset(layout(root, cell, text, next))).toEqual([])
  })

  it('skips absolute siblings and wrapping containers', () => {
    const abs = stackWith({ padBottom: 12, wrapper: { layout: { ...flow, position: 'absolute' } } })
    expect(judgeStackedInset(abs)).toEqual([])
    const wrapped = stackWith({ padBottom: 12 })
    wrapped.nodes[0].layout = { ...flex(), flexWrap: 'wrap' }
    expect(judgeStackedInset(wrapped)).toEqual([])
  })
})

// A painted surface at [0,0,300,100] with padding `pad`, holding one text run at `ink`.
const surfaceWith = ({ pad, ink, tag = 'div' }) => {
  const surface = node('s', null, [0, 0, 300, 100], { paints: true, pad })
  const content = node('s.0', 's', ink, { text: textOf(ink), tag })
  return layout(surface, content)
}

describe('edge-clearance', () => {
  it('flags ink pushed one pixel into the declared padding (a)', () => {
    const found = judgeEdgeClearance(surfaceWith({ pad: [16, 16, 16, 16], ink: [15, 30, 100, 16] }))
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ kind: 'edge-clearance', selector: '.ns.0' })
    expect(found[0].detail).toBe('ink 15px from the left edge of .ns (padding 16px, floor 4px)')
  })

  it('stays quiet when the ink is within a pixel of the padding', () => {
    expect(
      judgeEdgeClearance(surfaceWith({ pad: [16, 16, 16, 16], ink: [16, 30, 100, 16] }))
    ).toEqual([])
    expect(
      judgeEdgeClearance(surfaceWith({ pad: [16, 16, 16, 16], ink: [15.5, 30, 100, 16] }))
    ).toEqual([])
  })

  it('flags ink under 4px from an edge declared with no padding (b)', () => {
    const found = judgeEdgeClearance(surfaceWith({ pad: [0, 16, 0, 0], ink: [3.75, 30, 100, 16] }))
    expect(found[0].detail).toContain('ink 3.75px from the left edge')
  })

  it('stays quiet at the 4px floor on an unpadded edge', () => {
    expect(judgeEdgeClearance(surfaceWith({ pad: [0, 16, 0, 0], ink: [4, 30, 100, 16] }))).toEqual(
      []
    )
  })

  it('exempts a pill whose ink honours its declared 2px padding', () => {
    const pill = node('p', null, [0, 0, 60, 16], { paints: true, pad: [2, 8, 2, 8] })
    const text = node('p.0', 'p', [8, 2, 44, 12], { text: textOf([8, 2, 44, 12]) })
    expect(judgeEdgeClearance(layout(pill, text))).toEqual([])
  })

  it('exempts text in an unpainted wrapper that sits far from a painted page', () => {
    const page = node('s', null, [0, 0, 300, 100], { paints: true })
    const wrapper = node('s.0', 's', [24, 24, 252, 52], { pad: [24, 24, 24, 24] })
    const text = node('s.0.0', 's.0', [48, 48, 100, 16], { text: textOf([48, 48, 100, 16]) })
    expect(judgeEdgeClearance(layout(page, wrapper, text))).toEqual([])
  })

  it('takes the painted ancestor as surface for a replaced child, never the svg itself', () => {
    const button = node('b', null, [0, 0, 32, 32], { paints: true, pad: [8, 8, 8, 8] })
    const icon = node('b.0', 'b', [8, 8, 16, 16], { paints: true, tag: 'svg' })
    expect(judgeEdgeClearance(layout(button, icon))).toEqual([])
    const crowded = node('b.0', 'b', [4, 8, 16, 16], { paints: true, tag: 'svg' })
    expect(judgeEdgeClearance(layout(button, crowded))[0].detail).toContain('left edge of .nb')
  })

  it('measures inside the border', () => {
    const surface = node('s', null, [0, 0, 300, 100], {
      paints: true,
      pad: [0, 0, 0, 8],
      border: [0, 0, 0, 2],
    })
    const text = node('s.0', 's', [10, 30, 100, 16], { text: textOf([10, 30, 100, 16]) })
    expect(judgeEdgeClearance(layout(surface, text))).toEqual([])
  })
})

const row = (cells, { pad = [0, 12, 0, 12], width = 300 } = {}) => {
  const surface = node('r', null, [0, 0, width, 40], { paints: true, pad })
  return layout(
    surface,
    ...cells.map(([x, w], i) => node(`r.${i}`, 'r', [x, 0, w, 40], { paints: true }))
  )
}

describe('edge-clearance on clipped text and icons', () => {
  it('clamps ellipsised text to its box so hidden characters are not overflow', () => {
    const surface = node('s', null, [0, 0, 300, 40], { paints: true, pad: [8, 8, 8, 8] })
    const label = node('s.0', 's', [8, 8, 100, 16], { text: textOf([8, 8, 400, 16]) })
    expect(judgeEdgeClearance(layout(surface, label))).toEqual([])
  })

  it('still flags text whose own box is pushed into the padding', () => {
    const surface = node('s', null, [0, 0, 300, 40], { paints: true, pad: [8, 8, 8, 8] })
    const label = node('s.0', 's', [2, 8, 100, 16], { text: textOf([2, 8, 100, 16]) })
    expect(judgeEdgeClearance(layout(surface, label))).toHaveLength(1)
  })

  it('leaves an icon centred in an unpadded badge alone, but flags one pushed past padding', () => {
    const badge = node('b', null, [0, 0, 20, 20], { paints: true, border: [1, 1, 1, 1] })
    const icon = node('b.0', 'b', [3, 3, 14, 14], { paints: true, tag: 'svg' })
    expect(judgeEdgeClearance(layout(badge, icon))).toEqual([])
    const padded = node('b', null, [0, 0, 32, 32], { paints: true, pad: [8, 8, 8, 8] })
    const pushed = node('b.0', 'b', [4, 8, 16, 16], { paints: true, tag: 'svg' })
    expect(judgeEdgeClearance(layout(padded, pushed))).toHaveLength(1)
  })
})

describe('inset-asymmetry', () => {
  it('flags a full row that stops more than 2px short of the right padding', () => {
    const found = judgeInsetAsymmetry(row([[12, 270]]))
    expect(found).toHaveLength(1)
    expect(found[0].detail).toBe(
      'content sits 12px from the left edge and 18px from the right edge of .nr ' +
        '(padding 12px each side; limit 2px)'
    )
  })

  it('stays quiet at a 2px difference', () => {
    expect(judgeInsetAsymmetry(row([[12, 274]]))).toEqual([])
  })

  it('flags a difference of 2.25px', () => {
    expect(judgeInsetAsymmetry(row([[12, 273.75]]))).toHaveLength(1)
  })

  it('never triggers for a short label that does not fill the axis', () => {
    expect(judgeInsetAsymmetry(row([[12, 100]]))).toEqual([])
  })

  it('applies at 80% fill and not below', () => {
    expect(judgeInsetAsymmetry(row([[12, 220.8]]))).toHaveLength(1)
    expect(judgeInsetAsymmetry(row([[12, 220.5]]))).toEqual([])
  })

  it('ignores a ragged paragraph: the text block spans the width though its lines stop short', () => {
    const card = node('c', null, [0, 0, 300, 80], { paints: true, pad: [16, 16, 16, 16] })
    const text = node('c.0', 'c', [16, 16, 268, 48], { text: textOf([16, 16, 200, 48]) })
    expect(judgeInsetAsymmetry(layout(card, text))).toEqual([])
  })

  it('needs equal padding on the two sides', () => {
    expect(judgeInsetAsymmetry(row([[12, 200]], { pad: [0, 40, 0, 12] }))).toEqual([])
  })

  it('judges the vertical axis on layout boxes', () => {
    const surface = node('s', null, [0, 0, 100, 100], { paints: true, pad: [8, 0, 8, 0] })
    const child = node('s.0', 's', [0, 8, 100, 76], { paints: true })
    expect(judgeInsetAsymmetry(layout(surface, child))[0].detail).toContain('top edge')
  })
})

describe('what the surface padding places', () => {
  const card = (extra = {}) =>
    node('c', null, [0, 0, 300, 40], { paints: true, pad: [0, 12, 0, 12], ...extra })

  it('ignores an absolutely positioned accent bar beside symmetric content', () => {
    const bar = node('c.0', 'c', [0, 0, 4, 40], {
      paints: true,
      layout: { ...flow, position: 'absolute' },
    })
    const body = node('c.1', 'c', [12, 0, 276, 40], { paints: true })
    expect(judgeInsetAsymmetry(layout(card(), bar, body))).toEqual([])
  })

  it('ignores a child whose own ancestor below the surface is out of flow', () => {
    const wrap = node('c.0', 'c', [0, 0, 100, 40], { layout: { ...flow, position: 'absolute' } })
    const label = node('c.0.0', 'c.0', [2, 10, 60, 16], { text: textOf([2, 10, 60, 16]) })
    expect(judgeEdgeClearance(layout(card(), wrap, label))).toEqual([])
  })

  it('ignores absolutely positioned tick labels against the surface padding', () => {
    const tick = node('c.0', 'c', [5, 10, 40, 16], {
      text: textOf([5, 10, 40, 16]),
      layout: { ...flow, position: 'absolute' },
    })
    expect(judgeEdgeClearance(layout(card({ pad: [0, 20, 0, 20] }), tick))).toEqual([])
  })

  it.each(['progressbar', 'meter', 'slider'])('skips a %s, whose fill is the value', (role) => {
    const fill = node('c.0', 'c', [12, 0, 200, 40], { paints: true })
    expect(judgeInsetAsymmetry(layout(card({ role }), fill))).toEqual([])
  })

  it('skips an axis on which the surface declares no padding', () => {
    const surface = node('c', null, [0, 0, 300, 40], { paints: true })
    const fill = node('c.0', 'c', [0, 0, 230, 40], { paints: true })
    expect(judgeInsetAsymmetry(layout(surface, fill))).toEqual([])
    const flush = node('c.1', 'c', [0, 10, 60, 16], { text: textOf([0, 10, 60, 16]) })
    expect(judgeEdgeClearance(layout(surface, flush))).toEqual([])
  })
})

describe('alignment-near-miss', () => {
  const rowOf = (layoutExtra = {}) =>
    node('r', null, [0, 0, 400, 100], { layout: { ...flex('row'), ...layoutExtra } })
  // A one-line text child whose box is its ink; `baseline` defaults to the ink bottom.
  const label = (id, ink, { baseline = ink[1] + ink[3], fontSize = 16, self = 'auto' } = {}) => {
    const [x, y, w, h] = ink
    const line = { baseline, inkTop: y, inkBottom: y + h, left: x, right: x + w }
    return node(id, 'r', ink, {
      selector: `.${id}`,
      layout: { ...flow, alignSelf: self },
      text: { fontSize, lineCount: 1, left: x, right: x + w, first: line, last: line },
      ink,
    })
  }
  const card = (id, box) => node(id, 'r', box, { selector: `.${id}`, paints: true })
  const shiftedPair = (d, fontSize = 16) =>
    layout(
      rowOf(),
      label('a', [0, 0, 40, 12], { fontSize }),
      label('b', [50, d, 40, 12], { fontSize })
    )

  it.each([
    [1, 0],
    [1.25, 1],
    [6, 1],
    [6.25, 0],
  ])('at 16px text, a %spx offset on every line gives %i findings', (d, count) => {
    expect(judgeAlignmentNearMiss(shiftedPair(d))).toHaveLength(count)
  })

  it('caps the band at half the smaller font size', () => {
    expect(judgeAlignmentNearMiss(shiftedPair(4, 8))).toHaveLength(1)
    expect(judgeAlignmentNearMiss(shiftedPair(4.25, 8))).toEqual([])
  })

  it('names every line it measured and the band', () => {
    const a = label('a', [0, 0, 40, 12])
    const b = label('b', [50, 4, 40, 9.5], { baseline: 14.5 })
    expect(judgeAlignmentNearMiss(layout(rowOf(), a, b))).toEqual([
      {
        kind: 'alignment-near-miss',
        selector: '.a',
        detail: '.a vs .b: baseline Δ2.5, top Δ4, centre Δ2.75, bottom Δ1.5 (band ≤ 6px)',
      },
    ])
  })

  it('stays quiet when any one line aligns, as with an icon centred beside text', () => {
    const icon = node('i', 'r', [0, 0, 16, 16], { selector: '.i', tag: 'svg', paints: true })
    const text = label('t', [20, 3, 40, 10])
    expect(judgeAlignmentNearMiss(layout(rowOf(), icon, text))).toEqual([])
  })

  describe('align-items: baseline', () => {
    // Tops align, so only a baseline request makes the 10px baseline delta a finding.
    const pair = (row, self) =>
      layout(
        row,
        label('a', [0, 0, 40, 12], { self }),
        label('b', [50, 0, 40, 40], { baseline: 22, self })
      )

    it('flags a baseline delta beyond the near-miss band', () => {
      expect(judgeAlignmentNearMiss(pair(rowOf()))).toEqual([])
      const [found] = judgeAlignmentNearMiss(pair(rowOf({ alignItems: 'baseline' })))
      expect(found.detail).toBe('.a vs .b: baseline Δ10 (align-items: baseline)')
    })

    it('honours align-self: baseline on both children', () => {
      expect(judgeAlignmentNearMiss(pair(rowOf(), 'baseline'))).toHaveLength(1)
    })

    it('accepts baselines within 1px', () => {
      const row = rowOf({ alignItems: 'baseline' })
      const a = label('a', [0, 4, 40, 12])
      const b = label('b', [50, 0, 40, 17], { baseline: 17 })
      expect(judgeAlignmentNearMiss(layout(row, a, b))).toEqual([])
    })
  })

  it('reads the baseline from a label on a child’s first line', () => {
    const wrap = node('w', 'r', [50, 0, 60, 14], { selector: '.w' })
    const inner = label('w.0', [70, 0, 40, 12], { baseline: 10 })
    inner.parent = 'w'
    const row = rowOf({ alignItems: 'baseline' })
    expect(judgeAlignmentNearMiss(layout(row, label('a', [0, 0, 40, 12]), wrap, inner))).toEqual([
      expect.objectContaining({ detail: '.a vs .w: baseline Δ2 (align-items: baseline)' }),
    ])
  })

  it('compares neighbours within each wrapped line, never across lines', () => {
    const row = rowOf({ flexWrap: 'wrap' })
    const tags = [
      card('t0', [0, 0, 50, 24]),
      card('t1', [60, 0, 50, 24]),
      card('t2', [120, 0, 50, 24]),
      card('t3', [0, 32, 50, 24]),
      card('t4', [60, 32, 50, 28]),
    ]
    expect(judgeAlignmentNearMiss(layout(row, ...tags)).map((f) => f.detail)).toEqual([
      '.t3 vs .t4: height Δ4 (both paint; limit 16px)',
    ])
  })

  it('keeps a nowrap row on one line however far its children are offset', () => {
    const row = layout(rowOf(), card('a', [0, 0, 50, 24]), card('b', [60, 20, 50, 28]))
    expect(judgeAlignmentNearMiss(row)).toHaveLength(1)
  })

  it('joins a child to a line it overlaps by half the smaller height', () => {
    const row = rowOf({ flexWrap: 'wrap' })
    const first = card('a', [0, 0, 50, 24])
    expect(judgeAlignmentNearMiss(layout(row, first, card('b', [60, 12, 50, 28])))).toHaveLength(1)
    expect(judgeAlignmentNearMiss(layout(row, first, card('b', [60, 12.25, 50, 28])))).toEqual([])
  })

  it.each([
    [1, 0],
    [1.25, 1],
    [16, 1],
    [16.25, 0],
  ])('two painted siblings %spx apart in height give %i findings', (d, count) => {
    const row = layout(rowOf(), card('a', [0, 0, 100, 60]), card('b', [110, 0, 100, 60 + d]))
    expect(judgeAlignmentNearMiss(row)).toHaveLength(count)
  })

  it('skips column flex, out-of-flow children and a lone child', () => {
    const col = node('r', null, [0, 0, 400, 100], { layout: flex('column') })
    expect(
      judgeAlignmentNearMiss(layout(col, label('a', [0, 0, 40, 12]), label('b', [0, 2, 40, 12])))
    ).toEqual([])
    const abs = label('b', [50, 2, 40, 12])
    abs.layout = { ...abs.layout, position: 'absolute' }
    expect(judgeAlignmentNearMiss(layout(rowOf(), label('a', [0, 0, 40, 12]), abs))).toEqual([])
  })
})

describe('judgeLayout', () => {
  it('keeps at most `limit` findings per kind', () => {
    const many = Array.from({ length: 3 }, (_, i) =>
      node(`${i}`, null, [0, 0, 10, 10], { text: textOf([0, 0, 10, 10]) })
    )
    const surface = node('s', null, [0, 0, 300, 100], { paints: true, pad: [0, 16, 0, 0] })
    const kids = many.map((n) => ({ ...n, id: `s.${n.id}`, parent: 's', selector: `.k${n.id}` }))
    expect(judgeLayout(layout(surface, ...kids), { limit: 2 })).toHaveLength(2)
  })

  it('names every hidden padding in the gap it adds up', () => {
    const wrapper = node('0', 'root', [0, 0, 200, 28], { pad: [0, 0, 6, 0] })
    const text = node('0.0', '0', [0, 0, 200, 22], { text: textOf([0, 0, 120, 22]) })
    const next = node('1', 'root', [0, 28, 200, 26], { pad: [6, 0, 0, 0] })
    const nextText = node('1.0', '1', [0, 34, 200, 20], { text: textOf([0, 34, 120, 20]) })
    const root = node('root', null, [0, 0, 200, 60], { layout: flex() })
    const [found] = judgeStackedInset(layout(root, wrapper, text, next, nextText))
    expect(found.detail).toContain('visible gap 12px = layout gap 0px + paddingBottom 6px on .n0')
    expect(found.detail).toContain('+ paddingTop 6px on .n1')
  })

  it('judges an empty layout without findings', () => {
    expect(judgeLayout(layout())).toEqual([])
  })
})
