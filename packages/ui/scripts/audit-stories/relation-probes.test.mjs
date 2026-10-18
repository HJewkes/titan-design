import { describe, expect, it } from 'vitest'
import { ALIGN_TOLERANCE, INVERSION_RATIO, MAX_BAND, MIN_EXCESS } from './layout-probes.mjs'
import { PROBE_KINDS } from './probe-suite.mjs'
import {
  COLUMN_EDGE_NEAR_MISS,
  DEAD_BAND,
  HEADING_DETACHED,
  IN_SURFACE_SECTION_GAP,
  KINDS,
  NESTING_ORDER,
  RULES,
  judge,
} from './relation-probes.mjs'
import { RULE_BY_KIND } from './rules.mjs'

const layoutOf = (display = 'flex', flexDirection = 'column', extra = {}) => ({
  display,
  flexDirection,
  flexWrap: 'nowrap',
  alignItems: 'normal',
  alignSelf: 'auto',
  justifyContent: 'normal',
  position: 'static',
  rowGap: 'normal',
  columnGap: 'normal',
  ...extra,
})
const column = layoutOf()
const row = layoutOf('flex', 'row')
const flow = layoutOf('block', 'row')

// A node with the collector's shape. Painted nodes are their own ink; the rest take their children's.
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
    marginAuto: [false, false, false, false],
    layout: flow,
    paints: false,
    text: null,
    ink: null,
    style: { direction: 'ltr', textAlign: 'start' },
    heading: null,
    ...extra,
  }
  if (n.paints) n.ink = box
  return n
}
const bar = (id, parent, x, y, extra = {}) =>
  node(id, parent, [x, y, extra.w ?? 200, extra.h ?? 20], { paints: true, ...extra })
const card = (id, parent, box, pad, extra = {}) =>
  node(id, parent, box, { paints: true, pad: [pad, pad, pad, pad], layout: column, ...extra })

const tree = (...nodes) => {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  for (const n of [...nodes].reverse()) {
    const p = byId.get(n.parent)
    if (!p || p.paints || !n.ink) continue
    const b = p.ink
    const x = Math.min(b?.[0] ?? Infinity, n.ink[0])
    const y = Math.min(b?.[1] ?? Infinity, n.ink[1])
    const r = Math.max(b ? b[0] + b[2] : -Infinity, n.ink[0] + n.ink[2])
    const bt = Math.max(b ? b[1] + b[3] : -Infinity, n.ink[1] + n.ink[3])
    p.ink = [x, y, r - x, bt - y]
  }
  return { nodes, truncated: false, declared: { '--space-stack-lg': 16, '--space-section-sm': 24 } }
}
const of = (layout, kind) => judge(layout).filter((f) => f.kind === kind)

describe('relation-probes module contract', () => {
  it('maps every kind to its DR-LA rule and is wired into the suite and the rule map', () => {
    expect(RULES).toEqual({
      'heading-detached': 'DR-LA-02',
      'nesting-order': 'DR-LA-03',
      'in-surface-section-gap': 'DR-LA-08',
      'dead-band': 'DR-LA-09',
      'column-edge-near-miss': 'DR-LA-11',
    })
    expect(Object.keys(RULES)).toEqual([...KINDS])
    for (const kind of KINDS) {
      expect(PROBE_KINDS).toContain(kind)
      expect(RULE_BY_KIND[kind]).toBe(RULES[kind])
    }
  })

  it('never throws on nodes that lack the optional collector fields', () => {
    const bare = (id, parent, box, extra) => {
      const n = node(id, parent, box, extra)
      delete n.style
      delete n.heading
      delete n.marginAuto
      return n
    }
    const layout = tree(
      bare('0', null, [0, 0, 200, 100], { layout: column }),
      bare('0.0', '0', [0, 0, 200, 20], { paints: true }),
      bare('0.1', '0', [3, 40, 200, 20], { paints: true })
    )
    expect(() => judge(layout, {})).not.toThrow()
    expect(() => judge({ nodes: [] })).not.toThrow()
  })
})

describe('heading-detached (DR-LA-02)', () => {
  const list = (gapBelow, items = 8) =>
    tree(
      node('0', null, [0, 0, 200, 200], { layout: column }),
      bar('0.0', '0', 0, 0, { heading: 2 }),
      node('0.1', '0', [0, 20 + gapBelow, 200, 60 + 2 * items], { layout: column }),
      bar('0.1.0', '0.1', 0, 20 + gapBelow),
      bar('0.1.1', '0.1', 0, 40 + gapBelow + items),
      bar('0.1.2', '0.1', 0, 60 + gapBelow + 2 * items)
    )

  it('flags a title farther from its list than the list items are apart', () => {
    const [f] = of(list(8 + MIN_EXCESS + 1), HEADING_DETACHED)
    expect(f.selector).toBe('.n0.0')
    expect(f.detail).toBe(
      `.n0.0 sits 13px above .n0.1: body items 8px apart (limit +${MIN_EXCESS}px)`
    )
  })

  it('stays quiet at the inner gap plus MIN_EXCESS', () => {
    expect(of(list(8 + MIN_EXCESS), HEADING_DETACHED)).toEqual([])
  })

  // A bar, then a section whose title sits `below` above its body, `above` under the bar.
  const section = (above, below, sectionExtra = {}) =>
    tree(
      node('0', null, [0, 0, 200, 300], { layout: column }),
      bar('0.0', '0', 0, 0),
      node('0.1', '0', [0, 20 + above, 200, 60 + below], { layout: column, ...sectionExtra }),
      bar('0.1.0', '0.1', 0, 20 + above, { heading: 3 }),
      bar('0.1.1', '0.1', 0, 40 + above + below, { h: 40 })
    )

  it('flags a section title no nearer its body than the section is to the block above', () => {
    const [f] = of(section(12, 12), HEADING_DETACHED)
    expect(f.detail).toBe(`.n0.1.0 sits 12px above .n0.1.1: 12px above it (limit 1.5× below)`)
  })

  it('stays quiet once the gap above reaches INVERSION_RATIO times the gap below', () => {
    expect(of(section(12 * INVERSION_RATIO, 12), HEADING_DETACHED)).toEqual([])
  })

  it('skips the gap above when the heading opens a painted surface', () => {
    const painted = section(12, 12, { paints: true })
    painted.nodes[2].ink = painted.nodes[2].box
    expect(of(painted, HEADING_DETACHED)).toEqual([])
  })

  it('skips headings in a grid', () => {
    const grid = list(30)
    grid.nodes[0].layout = layoutOf('grid', 'row')
    expect(of(grid, HEADING_DETACHED)).toEqual([])
  })
})

describe('nesting-order (DR-LA-03)', () => {
  const surface = (pad, inner) =>
    tree(
      card('0', null, [0, 0, 200, 2 * pad + 40 + inner], pad),
      bar('0.0', '0', pad, pad, { w: 200 - 2 * pad }),
      bar('0.1', '0', pad, pad + 20 + inner, { w: 200 - 2 * pad })
    )

  it('flags items farther apart than the padding that frames them', () => {
    const [f] = of(surface(12, 16), NESTING_ORDER)
    expect(f.detail).toBe('items 16px apart > padding 12px (want inner ≤ padding ≤ outer, ±1px)')
  })

  it('allows one PADDING_TOLERANCE pixel', () => {
    expect(of(surface(12, 13), NESTING_ORDER)).toEqual([])
  })

  const siblings = (gap, parentLayout = column) => {
    const h = 32 + 48
    const cardAt = (id, y) => [
      card(id, '0', [0, y, 200, h], 16),
      bar(`${id}.0`, id, 16, y + 16, { w: 168 }),
      bar(`${id}.1`, id, 16, y + 44, { w: 168 }),
    ]
    return tree(
      node('0', null, [0, 0, 200, 2 * h + gap], { layout: parentLayout }),
      ...cardAt('0.0', 0),
      ...cardAt('0.1', h + gap)
    )
  }

  it('flags sibling surfaces nearer each other than their padding, once per pair', () => {
    const found = of(siblings(8), NESTING_ORDER)
    expect(found).toHaveLength(1)
    expect(found[0].selector).toBe('.n0.0')
    expect(found[0].detail).toMatch(/^padding 16px > 8px to sibling surface \.n0\.1 /)
  })

  it('stays quiet when sibling surfaces sit at least their padding apart, or sit in a grid', () => {
    expect(of(siblings(16), NESTING_ORDER)).toEqual([])
    expect(of(siblings(8, layoutOf('grid', 'row')), NESTING_ORDER)).toEqual([])
  })

  it('skips interactive surfaces and surfaces whose content is a row', () => {
    const button = surface(12, 16)
    button.nodes[0].interactive = true
    expect(of(button, NESTING_ORDER)).toEqual([])
    const pill = surface(12, 16)
    pill.nodes[0].layout = row
    expect(of(pill, NESTING_ORDER)).toEqual([])
  })
})

describe('in-surface-section-gap (DR-LA-08)', () => {
  const stack = (lastGap, extra = {}) =>
    tree(
      card('0', null, [0, 0, 200, 300], 24, { layout: flow, ...extra }),
      bar('0.0', '0', 24, 24, { margin: [0, 0, 8, 0] }),
      bar('0.1', '0', 24, 52, { margin: [0, 0, lastGap, 0] }),
      bar('0.2', '0', 24, 72 + lastGap)
    )

  it('flags a gap over --space-stack-lg inside a painted surface', () => {
    const [f] = of(stack(20), IN_SURFACE_SECTION_GAP)
    expect(f.selector).toBe('.n0.1')
    expect(f.detail).toBe(
      'gap 20px between .n0.1 and .n0.2 inside .n0 ' +
        '(limit --space-stack-lg 16px unless declared as --space-section-*)'
    )
  })

  it('stays quiet at the stack-lg value, for a section token, and outside a surface', () => {
    expect(of(stack(16), IN_SURFACE_SECTION_GAP)).toEqual([])
    expect(of(stack(24), IN_SURFACE_SECTION_GAP)).toEqual([])
    expect(of(stack(20, { paints: false }), IN_SURFACE_SECTION_GAP)).toEqual([])
  })

  it('skips a run that spreads its children, and a frame without the token', () => {
    const spread = stack(20, { layout: { ...column, justifyContent: 'space-between' } })
    expect(of(spread, IN_SURFACE_SECTION_GAP)).toEqual([])
    const noToken = stack(20)
    expect(
      judge(noToken, { declared: {} }).filter((f) => f.kind === IN_SURFACE_SECTION_GAP)
    ).toEqual([])
  })
})

describe('dead-band (DR-LA-09)', () => {
  const tall = (height, extra = {}, parent = null) =>
    tree(
      ...(parent ? [parent] : []),
      card('0', parent?.id ?? null, [0, 0, 200, height], 16, extra),
      bar('0.0', '0', 16, 16, { w: 168 }),
      bar('0.1', '0', 16, 44, { w: 168 })
    )

  it('flags an edge band over max(2 × padding, 24px)', () => {
    const [f] = of(tall(120), DEAD_BAND)
    expect(f.detail).toBe('56px empty at the bottom (limit max(2 × padding 16px, 24px))')
  })

  it('stays quiet at the limit and when the content placement is declared', () => {
    expect(of(tall(96), DEAD_BAND)).toEqual([])
    expect(of(tall(120, { layout: { ...column, justifyContent: 'center' } }), DEAD_BAND)).toEqual(
      []
    )
  })

  it('tags a band whose height a stretching row set', () => {
    const rowParent = node('r', null, [0, 0, 400, 120], { layout: row })
    const [f] = of(tall(120, {}, rowParent), DEAD_BAND)
    expect(f.detail).toMatch(/\(height set by a stretching row\)$/)
  })

  it('leaves a band inset-asymmetry reports to that probe', () => {
    const filled = tree(
      card('0', null, [0, 0, 200, 200], 16),
      bar('0.0', '0', 16, 16, { w: 168, h: 140 })
    )
    expect(of(filled, DEAD_BAND)).toEqual([])
  })
})

describe('column-edge-near-miss (DR-LA-11)', () => {
  const pair = (dx, containerExtra = {}, second = {}) =>
    tree(
      node('0', null, [0, 0, 200, 48], { layout: column, ...containerExtra }),
      bar('0.0', '0', 0, 0, { w: 100 }),
      bar('0.1', '0', dx, 28, { w: 100, ...second })
    )

  it('flags stacked items whose start edges miss by more than ALIGN_TOLERANCE and at most MAX_BAND', () => {
    const [f] = of(pair(3), COLUMN_EDGE_NEAR_MISS)
    expect(f.detail).toBe(
      `.n0.0 vs .n0.1: left edge Δ3 (band ${ALIGN_TOLERANCE}px < Δ ≤ ${MAX_BAND}px)`
    )
    expect(of(pair(MAX_BAND), COLUMN_EDGE_NEAR_MISS)).toHaveLength(1)
  })

  it('stays quiet at the tolerance and past the band', () => {
    expect(of(pair(ALIGN_TOLERANCE), COLUMN_EDGE_NEAR_MISS)).toEqual([])
    expect(of(pair(MAX_BAND + 0.25), COLUMN_EDGE_NEAR_MISS)).toEqual([])
  })

  it('skips centred columns and children aligned off the start edge', () => {
    expect(
      of(pair(3, { layout: { ...column, alignItems: 'center' } }), COLUMN_EDGE_NEAR_MISS)
    ).toEqual([])
    expect(
      of(pair(3, {}, { layout: { ...flow, alignSelf: 'flex-end' } }), COLUMN_EDGE_NEAR_MISS)
    ).toEqual([])
    expect(
      of(pair(3, {}, { style: { direction: 'ltr', textAlign: 'center' } }), COLUMN_EDGE_NEAR_MISS)
    ).toEqual([])
  })

  it('reads the right edge in an RTL column', () => {
    const rtl = { style: { direction: 'rtl', textAlign: 'start' } }
    const flush = tree(
      node('0', null, [0, 0, 200, 48], { layout: column, ...rtl }),
      bar('0.0', '0', 100, 0, { w: 100 }),
      bar('0.1', '0', 104, 28, { w: 96 })
    )
    expect(of(flush, COLUMN_EDGE_NEAR_MISS)).toEqual([])
    flush.nodes[2].ink = [101, 28, 96, 20]
    expect(of(flush, COLUMN_EDGE_NEAR_MISS)[0].detail).toMatch(/right edge Δ3 /)
  })
})
