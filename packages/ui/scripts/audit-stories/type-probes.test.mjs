// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FONT_SIZE_NEAR_MISS, judgeFontSizeNearMiss } from './layout-probes.mjs'
import {
  CAPS_LABEL_LOOKS,
  CAPS_TRACKING,
  KINDS,
  LINE_STYLE_BUDGET,
  LOWERCASE_TRACKING,
  RULES,
  SIZES_PER_COMPONENT,
  TEXT_FLOOR,
  WEIGHTS_FACES,
  isCaps,
  judge,
  judgeCapsLabelLooks,
  judgeCapsTracking,
  judgeLineStyleBudget,
  judgeLowercaseTracking,
  judgeSizesPerComponent,
  judgeTextFloor,
  judgeWeightsFaces,
} from './type-probes.mjs'

const fonts = { mono: 'Fixture Mono' }
const component = { id: 'components-atoms-card--default', title: 'Components/Atoms/Card' }
const gallery = { id: 'components-atoms-card--all-sizes', title: 'Components/Atoms/Card' }
const page = { id: 'pages-home--default', title: 'Pages/Home' }
const specimen = { id: 'foundations-type--scale', title: 'Foundations/Typography' }

// A box with the collector's shape, inked so instanceRoots can see it.
const box = (id, parent, extra = {}) => ({
  id,
  parent,
  selector: `.n${id.replaceAll('.', '-')}`,
  tag: 'div',
  role: null,
  interactive: false,
  box: [0, 0, 100, 20],
  ink: [0, 0, 100, 20],
  paints: false,
  text: null,
  layout: { display: 'block', flexDirection: 'row' },
  state: { disabled: false },
  ...extra,
})
// A text node: 14px regular sans, untracked, black, sentence case.
const text = (id, parent, t = {}, extra = {}) =>
  box(id, parent, {
    text: {
      fontSize: 14,
      fontWeight: 400,
      letterSpacing: 0,
      textTransform: 'none',
      family: 'Fixture Sans',
      color: 'rgb(0, 0, 0)',
      ownText: 'Body text',
      ...t,
    },
    ...extra,
  })
const caps = (id, parent, t = {}, extra = {}) =>
  text(id, parent, { textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12, ...t }, extra)
const row = (id, parent, extra = {}) =>
  box(id, parent, { layout: { display: 'flex', flexDirection: 'row' }, ...extra })
const layoutOf = (...nodes) => ({ nodes, audit: { concepts: {}, glyphRoles: {} } })
// A card root (0) holding the given children (0.0, 0.1, ...).
const card = (...make) => layoutOf(box('0', null), ...make.map((f, i) => f(`0.${i}`, '0')))
const kinds = (findings) => findings.map((f) => f.kind)

describe('type probe module contract', () => {
  it('maps each kind to its typography rule', () => {
    expect(KINDS).toHaveLength(7)
    expect(RULES).toEqual({
      [CAPS_TRACKING]: 'DR-TY-01',
      [CAPS_LABEL_LOOKS]: 'DR-TY-03',
      [TEXT_FLOOR]: 'DR-TY-06',
      [SIZES_PER_COMPONENT]: 'DR-TY-10',
      [WEIGHTS_FACES]: 'DR-TY-11',
      [LOWERCASE_TRACKING]: 'DR-TY-12',
      [LINE_STYLE_BUDGET]: 'DR-CO-05',
    })
  })

  it('never throws on nodes missing optional fields', () => {
    const bare = { id: '0', parent: null, selector: '.x', box: [0, 0, 1, 1], text: { fontSize: 8 } }
    expect(() => judge({ nodes: [bare] }, {})).not.toThrow()
    expect(judge(undefined)).toEqual([])
  })
})

describe('isCaps', () => {
  it.each([
    [{ textTransform: 'uppercase', ownText: 'Label' }, true],
    [{ textTransform: 'none', ownText: 'TOTAL' }, true],
    [{ textTransform: 'none', ownText: 'Total' }, false],
    [{ textTransform: 'none', ownText: 'AB' }, false],
    [{ textTransform: 'uppercase', ownText: '120' }, false],
  ])('%o is caps: %s', (t, expected) => {
    expect(isCaps(t)).toBe(expected)
  })
})

describe('caps-tracking', () => {
  it('reports caps tracked under 5% of the size', () => {
    const found = judgeCapsTracking(
      card((id, p) => caps(id, p, { letterSpacing: 0.2 })),
      { fonts }
    )
    expect(found).toHaveLength(1)
    expect(found[0].detail).toBe('caps "Body text" 12px tracked 0.2px = 1.7% (range 5%–12%)')
  })

  it.each([
    ['0.1em', { letterSpacing: 1.2 }],
    ['mono at 0', { letterSpacing: 0, family: 'Fixture Mono' }],
    ['the 5% edge', { letterSpacing: 0.6 }],
  ])('leaves %s alone', (_, t) => {
    expect(
      judgeCapsTracking(
        card((id, p) => caps(id, p, t)),
        { fonts }
      )
    ).toEqual([])
  })

  it('leaves mixed-case text alone', () => {
    expect(
      judgeCapsTracking(
        card((id, p) => text(id, p)),
        { fonts }
      )
    ).toEqual([])
  })
})

describe('text-floor', () => {
  it('reports text under 10px and keeps 10px', () => {
    const found = judgeTextFloor(
      card(
        (id, p) => text(id, p, { fontSize: 8.5 }),
        (id, p) => text(id, p, { fontSize: 10 })
      )
    )
    expect(found.map((f) => f.selector)).toEqual(['.n0-0'])
    expect(found[0].detail).toMatch(/^8\.5px text under the 10px floor \(error tier\)$/)
  })
})

describe('caps-label-looks', () => {
  const overline = (id, p) => caps(id, p, { fontWeight: 600, color: 'rgb(107, 114, 128)' })
  const micro = (id, p) =>
    caps(id, p, { fontSize: 10, letterSpacing: 1, fontWeight: 600, color: 'rgb(156, 163, 175)' })

  it('reports two looks in one component', () => {
    const found = judgeCapsLabelLooks(card(overline, micro), { story: component })
    expect(found).toHaveLength(1)
    expect(found[0].detail).toBe(
      'component has 2 caps label looks (limit 1): 12px/600/1.25px/Fixture Sans/#6b7280, ' +
        '10px/600/1px/Fixture Sans/#9ca3af'
    )
  })

  it('allows one look per instance of a variant grid, two per page', () => {
    expect(judgeCapsLabelLooks(card(overline, micro), { story: gallery })).toEqual([])
    expect(judgeCapsLabelLooks(card(overline, micro), { story: page })).toEqual([])
    expect(judgeCapsLabelLooks(card(overline, micro), { story: specimen })).toEqual([])
  })

  it('reports three looks on a page', () => {
    const big = (id, p) => caps(id, p, { fontSize: 14, letterSpacing: 1.4 })
    expect(kinds(judgeCapsLabelLooks(card(overline, micro, big), { story: page }))).toEqual([
      CAPS_LABEL_LOOKS,
    ])
  })

  it('counts a colour change between tab states as one look', () => {
    const tab = (selected) => (id, p) => [
      box(id, p, { interactive: true, role: 'tab', state: { selected, disabled: false } }),
      caps(`${id}.0`, id, { color: selected ? 'rgb(37, 99, 235)' : 'rgb(107, 114, 128)' }),
    ]
    const nodes = [box('0', null), ...tab(true)('0.0', '0'), ...tab(false)('0.1', '0')]
    expect(judgeCapsLabelLooks(layoutOf(...nodes), { story: component })).toEqual([])
  })

  it('counts a colour change on a disabled label as one look', () => {
    const disabled = (id, p) =>
      caps(id, p, { fontWeight: 600, color: 'rgb(200, 200, 200)' }, { state: { disabled: true } })
    expect(judgeCapsLabelLooks(card(overline, disabled), { story: component })).toEqual([])
  })

  it('reports a column header larger than the body cells', () => {
    const nodes = [
      box('0', null, { role: 'table' }),
      box('0.0', '0', { role: 'row' }),
      box('0.0.0', '0.0', { role: 'columnheader' }),
      caps('0.0.0.0', '0.0.0', { fontSize: 14, letterSpacing: 1.4 }),
      box('0.1', '0', { role: 'row' }),
      box('0.1.0', '0.1', { role: 'cell' }),
      text('0.1.0.0', '0.1.0', { fontSize: 12 }),
    ]
    const found = judgeCapsLabelLooks(layoutOf(...nodes), { story: component })
    expect(found.map((f) => f.detail)).toEqual([
      'column header 14px is larger than body cell text 12px',
    ])
  })

  it('counts a sorted header colour beside unsorted ones as one look', () => {
    const header = (id, sort, color) => [
      box(id, '0.0', { role: 'columnheader', state: { disabled: false, sort } }),
      box(`${id}.0`, id, { interactive: true, role: 'button' }),
      caps(`${id}.0.0`, `${id}.0`, { color }),
    ]
    const nodes = [
      box('0', null, { role: 'table' }),
      box('0.0', '0', { role: 'row' }),
      ...header('0.0.0', 'ascending', 'rgb(37, 99, 235)'),
      ...header('0.0.1', null, 'rgb(107, 114, 128)'),
      ...header('0.0.2', null, 'rgb(107, 114, 128)'),
    ]
    expect(judgeCapsLabelLooks(layoutOf(...nodes), { story: component })).toEqual([])
  })

  it('reports two looks across one header row', () => {
    const nodes = [
      box('0', null, { role: 'table' }),
      box('0.0', '0', { role: 'row' }),
      box('0.0.0', '0.0', { role: 'columnheader' }),
      caps('0.0.0.0', '0.0.0'),
      box('0.0.1', '0.0', { role: 'columnheader' }),
      caps('0.0.1.0', '0.0.1', { fontWeight: 700 }),
    ]
    const found = judgeCapsLabelLooks(layoutOf(...nodes), { story: gallery })
    expect(found.map((f) => f.detail)).toEqual([
      expect.stringMatching(/^header row has 2 caps label looks \(limit 1\)/),
    ])
  })
})

describe('sizes-per-component', () => {
  const sized = (...sizes) => card(...sizes.map((fontSize) => (id, p) => text(id, p, { fontSize })))

  it('reports a fifth size in one component', () => {
    const found = judgeSizesPerComponent(sized(10, 12, 14, 16, 20), { story: component })
    expect(found.map((f) => f.detail)).toEqual([
      'component uses 5 text sizes (limit 4): 10, 12, 14, 16, 20px',
    ])
  })

  it('allows four sizes, and five on a page', () => {
    expect(judgeSizesPerComponent(sized(10, 12, 14, 16), { story: component })).toEqual([])
    expect(judgeSizesPerComponent(sized(10, 12, 14, 16, 20), { story: page })).toEqual([])
    expect(judgeSizesPerComponent(sized(10, 12, 14, 16, 20), { story: specimen })).toEqual([])
  })

  it('reports a seventh size on a page', () => {
    expect(
      kinds(judgeSizesPerComponent(sized(10, 12, 14, 16, 20, 24, 32), { story: page }))
    ).toEqual([SIZES_PER_COMPONENT])
  })

  it('judges each instance of a variant grid on its own', () => {
    const instance = (sizes) => (id, p) => [
      box(id, p),
      ...sizes.map((fontSize, i) => text(`${id}.${i}`, id, { fontSize })),
    ]
    const nodes = [
      box('0', null),
      ...instance([10, 11, 12])('0.0', '0'),
      ...instance([13, 14, 15])('0.1', '0'),
      ...instance([16, 18, 20])('0.2', '0'),
    ]
    expect(judgeSizesPerComponent(layoutOf(...nodes), { story: gallery })).toEqual([])
    expect(kinds(judgeSizesPerComponent(layoutOf(...nodes), { story: component }))).toEqual([
      SIZES_PER_COMPONENT,
    ])
  })
})

describe('weights-faces', () => {
  const weighted = (...weights) =>
    card(...weights.map((fontWeight) => (id, p) => text(id, p, { fontWeight })))

  it('reports a third weight in one component', () => {
    expect(
      judgeWeightsFaces(weighted(400, 600, 700), { story: component }).map((f) => f.detail)
    ).toEqual(['component uses 3 weights (limit 2): 400, 600, 700'])
  })

  it('allows two weights, and leaves page weights alone', () => {
    expect(judgeWeightsFaces(weighted(400, 600), { story: component })).toEqual([])
    expect(judgeWeightsFaces(weighted(400, 600, 700), { story: page })).toEqual([])
  })

  it('reports each weight under 400, specimens included', () => {
    const found = judgeWeightsFaces(weighted(300, 400), { story: specimen })
    expect(found.map((f) => [f.selector, f.detail])).toEqual([['.n0-0', 'weight 300 is under 400']])
  })

  it('reports a fourth family in a frame and allows three', () => {
    const faced = (...families) =>
      card(...families.map((family) => (id, p) => text(id, p, { family })))
    expect(judgeWeightsFaces(faced('A', 'B', 'C'), { story: page })).toEqual([])
    expect(
      judgeWeightsFaces(faced('A', 'B', 'C', 'D'), { story: page }).map((f) => f.detail)
    ).toEqual(['frame uses 4 font families (limit 3): A, B, C, D'])
  })
})

describe('lowercase-tracking', () => {
  const tracked = (t) => judgeLowercaseTracking(card((id, p) => text(id, p, t)))

  it('reports open tracking at 12px or more', () => {
    expect(tracked({ fontSize: 14, letterSpacing: 0.7 }).map((f) => f.detail)).toEqual([
      'mixed-case 14px tracked 0.7px = 5% (limit 2% at 12px or more)',
    ])
  })

  it('reports tight tracking at any size', () => {
    expect(tracked({ fontSize: 32, letterSpacing: -1.6 }).map((f) => f.detail)).toEqual([
      'mixed-case 32px tracked -1.6px = -5% (floor -3%)',
    ])
  })

  it.each([
    ['untracked', { letterSpacing: 0 }],
    ['tracking-tight', { letterSpacing: -0.35 }],
    ['open under 12px', { fontSize: 11, letterSpacing: 0.55 }],
    ['uppercase-transformed', { textTransform: 'uppercase', letterSpacing: 1.4 }],
    ['caps own text', { ownText: 'TOTAL', letterSpacing: 1.4 }],
  ])('leaves %s alone', (_, t) => {
    expect(tracked(t)).toEqual([])
  })
})

describe('line-style-budget', () => {
  const line = (...ts) =>
    layoutOf(
      row('0', null),
      ...ts.map((t, i) => text(`0.${i}`, '0', t, { box: [i * 100, 0, 90, 20] }))
    )

  it('reports three sizes under the hero ratio', () => {
    const found = judgeLineStyleBudget(line({ fontSize: 16 }, { fontSize: 13 }, { fontSize: 12 }))
    expect(found.map((f) => f.detail)).toEqual([
      'one line has 3 sizes 12, 13, 16px (max/min 1.33 < 1.5, Δ4 > 2px)',
    ])
  })

  it('reports three colours and three weights in one finding', () => {
    const found = judgeLineStyleBudget(
      line(
        { color: 'rgb(0, 0, 0)', fontWeight: 400 },
        { color: 'rgb(255, 0, 0)', fontWeight: 600 },
        { color: 'rgb(0, 0, 255)', fontWeight: 700 }
      )
    )
    expect(found).toHaveLength(1)
    expect(found[0].detail).toBe(
      'one line has 3 weights 400, 600, 700 (limit 2); 3 colours #000000, #ff0000, #0000ff (limit 2)'
    )
  })

  it('allows a hero and its unit', () => {
    expect(judgeLineStyleBudget(line({ fontSize: 32 }, { fontSize: 14 }))).toEqual([])
  })

  it('hands size steps of 2px or less to font-size-near-miss', () => {
    const near = line({ fontSize: 14 }, { fontSize: 12 })
    const past = line({ fontSize: 14.25 }, { fontSize: 12 })
    expect(judgeLineStyleBudget(near)).toEqual([])
    expect(kinds(judgeFontSizeNearMiss(near))).toEqual([FONT_SIZE_NEAR_MISS])
    expect(kinds(judgeLineStyleBudget(past))).toEqual([LINE_STYLE_BUDGET])
    expect(judgeFontSizeNearMiss(past)).toEqual([])
  })

  it('leaves text on its own painted badge out of the line', () => {
    const nodes = [
      row('0', null),
      text('0.0', '0', {}, { box: [0, 0, 90, 20] }),
      text('0.1', '0', { color: 'rgb(255, 0, 0)' }, { box: [100, 0, 90, 20] }),
      box('0.2', '0', { paints: true, box: [200, 0, 60, 20] }),
      text('0.2.0', '0.2', { color: 'rgb(0, 128, 0)', fontSize: 12 }, { box: [204, 2, 50, 16] }),
    ]
    expect(judgeLineStyleBudget(layoutOf(...nodes))).toEqual([])
  })
})
