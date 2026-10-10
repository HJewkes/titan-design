import { describe, expect, it } from 'vitest'
import {
  judgeAlignmentNearMiss,
  judgeEdgeClearance,
  judgeFontSizeNearMiss,
  judgeGapOutlier,
  judgeInsetAsymmetry,
  judgeLayout,
  judgeProximityInversion,
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

  describe('baseline of a child that opens with an icon', () => {
    // CSS aligns such a child by the icon's bottom edge, not by the label that follows it.
    const iconLabel = (iconBottom) => {
      const icon = node('i', 'w', [50, iconBottom - 20, 20, 20], {
        selector: '.i',
        tag: 'svg',
        paints: true,
      })
      const text = label('t', [74, 2, 40, 28], { baseline: 24, fontSize: 24 })
      text.parent = 'w'
      const wrap = node('w', 'r', [50, 0, 64, 30], { selector: '.w' })
      return [wrap, icon, text]
    }
    const row = rowOf({ alignItems: 'baseline' })
    const plain = label('a', [0, 0, 40, 12], { baseline: 20, fontSize: 12 })

    it('gives no finding when the icon bottom is where the row put the baseline', () => {
      expect(judgeAlignmentNearMiss(layout(row, plain, ...iconLabel(20)))).toEqual([])
    })

    it('flags the child when its icon bottom is off the shared baseline', () => {
      const [found] = judgeAlignmentNearMiss(layout(row, plain, ...iconLabel(30)))
      expect(found.detail).toBe('.a vs .w: baseline Δ10 (align-items: baseline)')
    })

    it('reads text in the first in-flow item and ignores an absolute badge before it', () => {
      const badge = node('b', 'w', [50, 0, 10, 10], {
        selector: '.b',
        layout: { ...flow, position: 'absolute' },
        text: textOf([50, 0, 10, 10]),
      })
      const text = label('t', [50, 6, 40, 14], { baseline: 20, fontSize: 24 })
      text.parent = 'w'
      const wrap = node('w', 'r', [50, 0, 64, 20], { selector: '.w' })
      expect(judgeAlignmentNearMiss(layout(row, plain, wrap, badge, text))).toEqual([])
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

describe('gap-outlier', () => {
  const SECTION = { '--space-section-sm': 24 }
  const column = (extra = {}) => node('r', null, [0, 0, 200, 400], { layout: flex(), ...extra })
  // Painted 10px children (1px for those in `thin`, a divider) whose ink gaps are `gaps`.
  const stack = (gaps, { root = column(), declared = {}, thin = [], margins = {} } = {}) => {
    let y = 0
    const kids = [0, ...gaps].map((g, i) => {
      y += g
      const h = thin.includes(i) ? 1 : 10
      const box = [0, y, 200, h]
      y += h
      const margin = margins[i] ?? [0, 0, 0, 0]
      return node(`k${i}`, 'r', box, { selector: `.k${i}`, paints: true, margin })
    })
    return { ...layout(root, ...kids), declared }
  }

  it.each([
    [8, 16, 1], // g = 2m and g - m = 8 together
    [8, 15.75, 0],
    [10, 20, 1], // g = 2m, g - m = 10
    [10, 19.75, 0],
    [2, 10, 1], // g - m = 8, g = 5m
    [2, 9.75, 0],
    [12, 12, 0], // uniform rhythm
  ])('gaps of %spx then %spx give %i findings', (m, g, count) => {
    expect(judgeGapOutlier(stack([m, g]))).toHaveLength(count)
  })

  it('names both neighbours and the multiple', () => {
    expect(judgeGapOutlier(stack([8, 8, 24]))).toEqual([
      {
        kind: 'gap-outlier',
        selector: '.k2',
        detail: 'gap 24px between .k2 and .k3 is 3× the 8px gaps beside it',
      },
    ])
  })

  it('needs two gaps to compare', () => {
    expect(judgeGapOutlier(stack([40]))).toEqual([])
  })

  describe('--space-section-* exemption', () => {
    const margins = { 1: [0, 0, 24, 0] }

    it('exempts a gap whose facing margin is a section value', () => {
      expect(judgeGapOutlier(stack([8, 24], { declared: SECTION, margins }))).toEqual([])
    })

    it('flags the same gap when the margin matches no section value', () => {
      const declared = { '--space-section-sm': 32 }
      expect(judgeGapOutlier(stack([8, 24], { declared, margins }))).toHaveLength(1)
    })

    it('flags the same gap when padding, not a declared margin, makes it', () => {
      expect(judgeGapOutlier(stack([8, 24], { declared: SECTION }))).toHaveLength(1)
    })

    it('adds the flex gap to the facing margins', () => {
      const root = column({ layout: { ...flex(), rowGap: '8px' } })
      const m = { 1: [0, 0, 16, 0] }
      expect(judgeGapOutlier(stack([8, 24], { root, declared: SECTION, margins: m }))).toEqual([])
    })

    it('ignores a declared value that is not a section token', () => {
      const declared = { '--space-stack-md': 24 }
      expect(judgeGapOutlier(stack([8, 24], { declared, margins }))).toHaveLength(1)
    })
  })

  describe('divider split', () => {
    it('does not compare a gap that touches the divider with the run beside it', () => {
      expect(judgeGapOutlier(stack([8, 8, 30, 8, 8], { thin: [3] }))).toEqual([])
    })

    it('still flags an outlier inside a run', () => {
      expect(judgeGapOutlier(stack([8, 8, 30, 8, 8], { thin: [5] }))).toHaveLength(1)
    })
  })

  it('reads a flex row along x', () => {
    const row = node('r', null, [0, 0, 400, 20], { layout: flex('row') })
    const box = (id, x) => node(id, 'r', [x, 0, 10, 10], { selector: `.${id}`, paints: true })
    const kids = [box('a', 0), box('b', 18), box('c', 36), box('d', 70)]
    expect(judgeGapOutlier(layout(row, ...kids)).map((f) => f.detail)).toEqual([
      'gap 24px between .c and .d is 3× the 8px gaps beside it',
    ])
  })

  it('skips a grid, which is out of scope', () => {
    const grid = column({ layout: { ...flex(), display: 'grid' } })
    expect(judgeGapOutlier(stack([8, 8, 40], { root: grid }))).toEqual([])
  })

  describe('rows that spread their children', () => {
    const kids = [8, 8, 40]
    const spread = (justifyContent) =>
      column({ layout: { ...flex(), justifyContent }, margin: [0, 0, 0, 0] })

    it('exempts space-between, space-around and space-evenly', () => {
      for (const j of ['space-between', 'space-around', 'space-evenly'])
        expect(judgeGapOutlier(stack(kids, { root: spread(j) }))).toEqual([])
    })

    it('still flags the same gaps under justify-content: flex-start', () => {
      expect(judgeGapOutlier(stack(kids, { root: spread('flex-start') }))).toHaveLength(1)
    })

    it('exempts a run with a child that has an auto margin on the main axis', () => {
      const found = stack(kids)
      found.nodes.find((n) => n.id === 'k3').marginAuto = [true, false, false, false]
      expect(judgeGapOutlier(found)).toEqual([])
    })

    it('ignores an auto margin on the cross axis', () => {
      const found = stack(kids)
      found.nodes.find((n) => n.id === 'k3').marginAuto = [false, true, false, true]
      expect(judgeGapOutlier(found)).toHaveLength(1)
    })

    it('needs three children in plain flow: an absolute child does not count', () => {
      const found = stack([8, 40])
      found.nodes.find((n) => n.id === 'k2').layout = { ...flow, position: 'absolute' }
      expect(judgeGapOutlier(found)).toEqual([])
    })
  })
})

describe('proximity-inversion', () => {
  const item = (id, parent, y) =>
    node(id, parent, [0, y, 200, 10], { selector: `.${id}`, paints: true })
  // A column of groups; group `i` is a flex column of `sizes[i]` items `inners[i]` apart, and
  // groups sit `outer` apart.
  const groups = (inners, outer, { sizes = [], dividerAfter = [], group = {}, itemOf } = {}) => {
    const nodes = [node('r', null, [0, 0, 200, 600], { layout: flex() })]
    let y = 0
    inners.forEach((inner, g) => {
      const start = y
      const kids = Array.from({ length: sizes[g] ?? 2 }, (_, i) => {
        const kid = (g === 0 && itemOf ? itemOf : item)(`g${g}i${i}`, `g${g}`, y)
        y += 10 + inner
        return kid
      })
      y -= inner
      const box = [0, start, 200, y - start]
      nodes.push(
        node(`g${g}`, 'r', box, { selector: `.g${g}`, layout: flex(), ...(g === 0 ? group : {}) }),
        ...kids
      )
      if (dividerAfter.includes(g)) {
        nodes.push(
          node(`d${g}`, 'r', [0, y + outer / 2, 200, 1], { paints: true, selector: `.d${g}` })
        )
        y += outer + 1
      } else y += outer
    })
    return layout(...nodes)
  }

  it.each([
    [18, 12, 1], // inner = 1.5 × outer
    [17.75, 12, 0],
    [12, 12, 0], // a tie reads as ambiguous, not inverted
    [17, 4, 1], // 4.25×: a goal-summary block 4px above its chart
    [14, 4, 1],
  ])(
    'items %spx apart inside a group %spx from its neighbour give %i findings',
    (inner, outer, n) => {
      expect(judgeProximityInversion(groups([inner, 4], outer))).toHaveLength(n)
    }
  )

  it('names the group, both distances and the nearer neighbour', () => {
    expect(judgeProximityInversion(groups([18, 4], 12))).toEqual([
      {
        kind: 'proximity-inversion',
        selector: '.g0',
        detail: '.g0: items 18px apart inside, 12px from .g1 outside',
      },
    ])
  })

  it('compares against the nearer of the two neighbours', () => {
    const found = judgeProximityInversion(groups([4, 17, 4], 12))
    expect(found).toEqual([])
    expect(judgeProximityInversion(groups([4, 18, 4], 12))).toHaveLength(1)
  })

  it('ignores a single-child wrapper, which is not a visual group', () => {
    expect(judgeProximityInversion(groups([18, 18, 18], 12, { sizes: [1, 1, 1] }))).toEqual([])
  })

  it('does not compare across a divider', () => {
    expect(judgeProximityInversion(groups([18, 4], 12, { dividerAfter: [0] }))).toEqual([])
  })

  it('skips a group with no neighbour', () => {
    expect(judgeProximityInversion(groups([18], 12))).toEqual([])
  })

  it('skips a grid group, which is out of scope', () => {
    const found = groups([18, 4], 12)
    found.nodes.find((n) => n.id === 'g0').layout = { ...flex(), display: 'grid' }
    expect(judgeProximityInversion(found)).toEqual([])
  })

  describe('painted groups', () => {
    // A tile with its own background shows its extent: loose items inside it are not a grouping bug.
    it('exempts a group with its own background', () => {
      expect(judgeProximityInversion(groups([18, 4], 4, { group: { paints: true } }))).toEqual([])
    })

    it('still flags the same layout when the group paints nothing', () => {
      expect(judgeProximityInversion(groups([18, 4], 4))).toHaveLength(1)
    })
  })

  describe('control rows', () => {
    const button = (id, parent, y) =>
      node(id, parent, [0, y, 200, 10], { selector: `.${id}`, paints: true, interactive: true })
    const controls = (inner, outer) => groups([inner, 4], outer, { itemOf: button })

    it('exempts a row of controls that sits clearly nearer its content than its items are apart', () => {
      expect(judgeProximityInversion(controls(20, 4))).toEqual([])
      expect(judgeProximityInversion(controls(20, 12))).toEqual([])
    })

    it('still flags a row of controls that is hardly nearer its content than its items are apart', () => {
      expect(judgeProximityInversion(controls(20, 20))).toHaveLength(1)
      expect(judgeProximityInversion(controls(20, 16))).toHaveLength(1)
    })

    it('never flags a row of controls that sits farther from its content than its items', () => {
      expect(judgeProximityInversion(controls(4, 20))).toEqual([])
    })

    it('treats a button nested in a wrapper as a control', () => {
      const found = groups([20, 4], 4)
      const wrappers = found.nodes.filter((x) => x.id.startsWith('g0i'))
      for (const n of wrappers)
        found.nodes.push(
          node(`${n.id}b`, n.id, n.box, { selector: `.${n.id}b`, interactive: true })
        )
      expect(judgeProximityInversion(found)).toEqual([])
    })

    it('does not exempt a group with a single button among plain items', () => {
      const one = (id, parent, y) =>
        node(id, parent, [0, y, 200, 10], {
          selector: `.${id}`,
          paints: true,
          interactive: id.endsWith('i0'),
        })
      expect(judgeProximityInversion(groups([20, 4], 4, { itemOf: one }))).toHaveLength(1)
    })
  })
})

describe('font-size-near-miss', () => {
  const row = (wrap = 'nowrap') =>
    node('r', null, [0, 0, 400, 100], { layout: { ...flex('row'), flexWrap: wrap } })
  const sized = (id, parent, box, fontSize) =>
    node(id, parent, box, { selector: `.${id}`, text: { ...textOf(box), fontSize } })
  const pairAt = (other) =>
    layout(row(), sized('a', 'r', [0, 0, 40, 16], 14), sized('b', 'r', [50, 0, 40, 16], other))

  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [2.5, 0],
  ])('two sizes %spx apart on one line give %i findings', (d, count) => {
    expect(judgeFontSizeNearMiss(pairAt(14 + d))).toHaveLength(count)
  })

  it('names both sizes, the delta and the limit', () => {
    expect(judgeFontSizeNearMiss(pairAt(13))).toEqual([
      {
        kind: 'font-size-near-miss',
        selector: '.a',
        detail: '.a 14px vs .b 13px on one line: Δ1 (limit 2px)',
      },
    ])
  })

  it('leaves a hero number and its unit alone', () => {
    const hero = sized('a', 'r', [0, 0, 60, 40], 32)
    const unit = sized('b', 'r', [64, 20, 20, 16], 14)
    expect(judgeFontSizeNearMiss(layout(row(), hero, unit))).toEqual([])
  })

  it('compares text nested under one flex row, but only on one visual line', () => {
    const col = node('c', 'r', [50, 0, 100, 40], { layout: flex('column') })
    const name = sized('c.0', 'c', [50, 0, 100, 16], 14)
    const caption = sized('c.1', 'c', [50, 20, 100, 16], 13)
    const label = sized('a', 'r', [0, 0, 40, 16], 15)
    expect(
      judgeFontSizeNearMiss(layout(row(), label, col, name, caption)).map((f) => f.selector)
    ).toEqual(['.a'])
  })

  it('skips text with no flex-row ancestor', () => {
    const block = node('r', null, [0, 0, 400, 100])
    const a = sized('a', 'r', [0, 0, 40, 16], 14)
    expect(judgeFontSizeNearMiss(layout(block, a, sized('b', 'r', [50, 0, 40, 16], 13)))).toEqual(
      []
    )
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
