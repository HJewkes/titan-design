import { describe, expect, it } from 'vitest'
import {
  HUE_BUDGET,
  KINDS,
  ROLE_ORDER,
  RUBRIC,
  RULES,
  SALIENCE_TIE,
  STATE_CARRIERS,
  hueClusters,
  judge,
  judgeHueBudget,
  judgeRoleOrder,
  judgeSalienceTie,
  judgeStateCarriers,
  salienceOf,
  stateFamilyOf,
} from './hierarchy-probes.mjs'
import { PROBE_KINDS, PROBE_RULES } from './probe-suite.mjs'

// Synthetic token map: three text roles and two status families.
const tokens = {
  '#111827': ['--color-text-primary'],
  '#5b6472': ['--color-text-secondary'],
  '#6b7280': ['--color-text-tertiary'],
  '#16a34a': ['--color-status-success'],
  '#dcfce7': ['--color-status-success-subtle'],
  '#15803d': ['--color-text-success'],
  '#dc2626': ['--color-status-error'],
  '#000000': ['--color-status-error-rgb'],
  '#2563eb': ['--color-brand-primary'],
  '#9333ea': ['--color-dataviz-4'],
}
const component = { id: 'components-atoms-sample--default', title: 'Components/Atoms/Sample' }
const grid = { id: 'components-atoms-sample--all-variants', title: 'Components/Atoms/Sample' }
const ctx = { tokens, story: component }

// A node with the collector's shape: a box, no text, nothing painted, enabled.
const node = (id, parent, extra = {}) => ({
  id,
  parent,
  selector: `.n${id.replaceAll('.', '-')}`,
  tag: 'div',
  box: [0, 0, 200, 40],
  ink: [0, 0, 200, 40],
  paints: false,
  text: null,
  style: { backgroundColor: 'rgba(0, 0, 0, 0)', effectiveOpacity: 1 },
  state: { disabled: false },
  ...extra,
})
const text = (
  id,
  parent,
  color,
  { size = 14, weight = 400, backdrop = '#ffffff', words = 'Label', ...rest } = {}
) =>
  node(id, parent, {
    text: {
      fontSize: size,
      fontWeight: weight,
      color,
      backdrop,
      backdropImage: false,
      ownText: words,
    },
    ...rest,
  })
const fill = (id, parent, backgroundColor, extra = {}) =>
  node(id, parent, { paints: true, style: { backgroundColor, effectiveOpacity: 1 }, ...extra })
const icon = (id, parent, paint, size = 16) =>
  node(id, parent, { tag: 'svg', box: [0, 0, size, size], ink: [0, 0, size, size], paint })
// One component root `0` holding the given children (ids `0.*`).
const card = (...children) => ({ nodes: [node('0', null), ...children] })

describe('hierarchy probe module contract', () => {
  it('maps each kind to its colour rule and is registered in the probe suite', () => {
    expect(KINDS).toEqual([ROLE_ORDER, SALIENCE_TIE, HUE_BUDGET, STATE_CARRIERS])
    expect(RULES).toEqual({
      [ROLE_ORDER]: 'DR-CO-03',
      [SALIENCE_TIE]: 'DR-CO-04',
      [HUE_BUDGET]: 'DR-CO-06',
      [STATE_CARRIERS]: 'DR-CO-07',
    })
    expect(PROBE_KINDS).toEqual(expect.arrayContaining(KINDS))
    expect(PROBE_RULES).toMatchObject(RULES)
  })

  it('lists the CO-04, CO-06 and CO-07 judgement rows as rubric rows', () => {
    expect(RUBRIC.map((r) => [r.rule, r.kind])).toEqual([
      ['DR-CO-04', SALIENCE_TIE],
      ['DR-CO-06', HUE_BUDGET],
      ['DR-CO-07', STATE_CARRIERS],
    ])
    expect(RUBRIC.every((r) => RULES[r.kind] === r.rule && r.question.endsWith('?'))).toBe(true)
  })

  it('does not throw on nodes missing optional fields or on an empty context', () => {
    const bare = {
      nodes: [
        { id: '0', parent: null, selector: '.bare' },
        { id: '0.0', parent: '0' },
      ],
    }

    expect(judge(bare, {})).toEqual([])
    expect(judge(undefined)).toEqual([])
  })
})

describe('role-order', () => {
  it('flags secondary text within 1.25× of tertiary on the same plane', () => {
    const layout = card(
      text('0.0', '0', '#111827'),
      text('0.1', '0', '#5b6472'),
      text('0.2', '0', '#6b7280')
    )

    expect(judgeRoleOrder(layout, ctx)).toEqual([
      {
        kind: ROLE_ORDER,
        selector: '.n0-2',
        detail: 'on #ffffff: secondary 5.98:1 vs tertiary 4.83:1 = 1.24× (least step 1.25×)',
      },
    ])
  })

  it('flags tertiary text that outranks secondary', () => {
    const swapped = {
      ...tokens,
      '#5b6472': ['--color-text-tertiary'],
      '#6b7280': ['--color-text-secondary'],
    }
    const layout = card(text('0.0', '0', '#6b7280'), text('0.1', '0', '#5b6472'))

    const out = judgeRoleOrder(layout, { tokens: swapped })

    expect(out).toHaveLength(1)
    expect(out[0].detail).toContain('secondary 4.83:1 vs tertiary 5.98:1 = 0.81×')
  })

  it('compares the next role present when one is missing', () => {
    const close = { ...tokens, '#5b6472': ['--color-text-primary'] }
    const layout = card(text('0.0', '0', '#5b6472'), text('0.1', '0', '#6b7280'))

    expect(judgeRoleOrder(layout, { tokens: close }).map((f) => f.detail)).toEqual([
      'on #ffffff: primary 5.98:1 vs tertiary 4.83:1 = 1.24× (least step 1.25×)',
    ])
  })

  it('leaves clean controls alone: a wide ladder, other planes, disabled text, a background image', () => {
    const wide = { ...tokens, '#9ca3af': ['--color-text-tertiary'] }
    const layout = card(
      text('0.0', '0', '#111827'),
      text('0.1', '0', '#5b6472'),
      text('0.2', '0', '#9ca3af'),
      text('0.3', '0', '#6b7280', { backdrop: '#f3f4f6' }),
      text('0.4', '0', '#5b6472', { state: { disabled: true } })
    )
    const imaged = card(text('0.0', '0', '#5b6472'), text('0.1', '0', '#6b7280'))
    imaged.nodes[2].text = { ...imaged.nodes[2].text, backdropImage: true, backdrop: null }

    expect(judgeRoleOrder(layout, { tokens: wide })).toEqual([])
    expect(judgeRoleOrder(imaged, ctx)).toEqual([])
  })
})

describe('salience-tie', () => {
  it('weighs size, weight and contrast', () => {
    const t = text('0', null, '#111827', { size: 20, weight: 600 }).text

    expect(salienceOf(t)).toBeCloseTo(20 * 1.5 * 17.74, 0)
    expect(salienceOf({ ...t, backdrop: null })).toBeNull()
  })

  it('flags two distinct templates tied for the top', () => {
    const layout = card(
      text('0.0', '0', '#111827', { size: 27, weight: 400, words: 'Title' }),
      text('0.1', '0', '#111827', { size: 18, weight: 600, words: 'Total' }),
      text('0.2', '0', '#5b6472', { words: 'Body' })
    )

    const out = judgeSalienceTie(layout, ctx)

    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ kind: SALIENCE_TIE, selector: '.n0-0' })
    expect(out[0].detail).toMatch(
      /^2 templates tie for most salient \(within 5%\): "Title" 27px\/400\/#111827 = \d+(\.\d)?; "Total" 18px\/600\/#111827/
    )
  })

  it('flags a bold label tying a larger regular heading', () => {
    const layout = card(
      text('0.0', '0', '#111827', { size: 21, weight: 400, words: 'Heading' }),
      text('0.1', '0', '#111827', { size: 14, weight: 600, words: 'Badge' })
    )

    expect(judgeSalienceTie(layout, ctx).map((f) => f.kind)).toEqual([SALIENCE_TIE])
  })

  it('leaves clean controls alone: one clear top, repeated rows of one template', () => {
    const clear = card(
      text('0.0', '0', '#111827', { size: 20, weight: 600 }),
      text('0.1', '0', '#5b6472'),
      text('0.2', '0', '#5b6472')
    )
    const rows = card(text('0.0', '0', '#111827'), text('0.1', '0', '#111827'))

    expect(judgeSalienceTie(clear, ctx)).toEqual([])
    expect(judgeSalienceTie(rows, ctx)).toEqual([])
  })

  it('judges each instance of a variant grid apart, and skips page and specimen stories', () => {
    const instance = (i, size) => [
      node(`0.${i}`, '0'),
      text(`0.${i}.0`, `0.${i}`, '#111827', { size, weight: 600 }),
      text(`0.${i}.1`, `0.${i}`, '#5b6472'),
    ]
    const layout = card(...instance(0, 16), ...instance(1, 20))
    const tied = card(
      text('0.0', '0', '#111827', { size: 27, weight: 400 }),
      text('0.1', '0', '#111827', { size: 18, weight: 600 })
    )

    expect(judgeSalienceTie(layout, { ...ctx, story: grid })).toEqual([])
    expect(judgeSalienceTie(tied, { ...ctx, story: { title: 'Pages/Home' } })).toEqual([])
    expect(judgeSalienceTie(tied, { ...ctx, story: { title: 'Foundations/Type' } })).toEqual([])
  })
})

describe('hue-budget', () => {
  it('clusters hues within 30° and joins clusters across 360°', () => {
    const hues = [{ h: 5 }, { h: 20 }, { h: 150 }, { h: 350 }].map((x) => ({ ...x, hex: '#x' }))

    expect(hueClusters(hues).map((c) => c.map((x) => x.h))).toEqual([[350, 5, 20], [150]])
  })

  it('flags three hues in one component', () => {
    const layout = card(
      fill('0.0', '0', 'rgb(37, 99, 235)'),
      text('0.1', '0', '#16a34a'),
      icon('0.2', '0', '#dc2626')
    )

    expect(judgeHueBudget(layout, ctx)).toEqual([
      {
        kind: HUE_BUDGET,
        selector: '.n0',
        detail:
          '3 hues (limit 2; C > 0.06, 30° clusters): 27° (#dc2626), 149° (#16a34a), 263° (#2563eb)',
      },
    ])
  })

  it('leaves clean controls alone: two hues, near hues, greys, data marks, a chart', () => {
    const layout = card(
      fill('0.0', '0', '#2563eb'),
      text('0.1', '0', '#3b82f6'),
      text('0.2', '0', '#16a34a'),
      text('0.3', '0', '#6b7280'),
      icon('0.4', '0', '#9333ea'),
      icon('0.5', '0', '#dc2626', 200),
      text('0.6', '0', '#f59e0b', { state: { disabled: true } })
    )

    expect(judgeHueBudget(layout, ctx)).toEqual([])
  })
})

describe('state-carriers', () => {
  it('resolves token names to a status or result family', () => {
    expect(stateFamilyOf('#dcfce7', tokens)).toBe('status-success')
    expect(stateFamilyOf('#15803d', tokens)).toBe('status-success')
    expect(stateFamilyOf('#2563eb', tokens)).toBeNull()
    expect(stateFamilyOf('#000000', tokens)).toBeNull()
    expect(stateFamilyOf('#aaaaaa', { '#aaaaaa': ['--color-result-improve-light'] })).toBe(
      'result-improve'
    )
  })

  it('flags a mark, a label and a badge all carrying success', () => {
    const layout = card(
      fill('0.0', '0', '#16a34a', { box: [0, 0, 8, 8] }),
      text('0.1', '0', '#15803d', { words: 'Done' }),
      fill('0.2', '0', '#dcfce7', { box: [0, 0, 60, 24], ink: [0, 0, 60, 24] })
    )

    expect(judgeStateCarriers(layout, ctx)).toEqual([
      {
        kind: STATE_CARRIERS,
        selector: '.n0-0',
        detail: '3 elements carry status-success (limit 2): mark + label + badge',
      },
    ])
  })

  it('leaves clean controls alone: a badge with its own text, two families, disabled carriers', () => {
    const layout = card(
      fill('0.0', '0', '#dcfce7', { box: [0, 0, 60, 24] }),
      text('0.0.0', '0.0', '#15803d', { backdrop: '#dcfce7' }),
      icon('0.1', '0', '#dc2626'),
      text('0.2', '0', '#dc2626'),
      text('0.3', '0', '#16a34a', { state: { disabled: true } })
    )

    expect(judgeStateCarriers(layout, ctx)).toEqual([])
  })

  it('ignores a grey state token, which carries no colour', () => {
    const grey = { '#737373': ['--color-result-neutral'] }
    const layout = card(
      text('0.0', '0', '#737373'),
      text('0.1', '0', '#737373'),
      text('0.2', '0', '#737373')
    )

    expect(judgeStateCarriers(layout, { tokens: grey, story: component })).toEqual([])
  })

  it('counts each instance of a variant grid apart', () => {
    const instance = (i) => [
      node(`0.${i}`, '0'),
      icon(`0.${i}.0`, `0.${i}`, '#16a34a'),
      text(`0.${i}.1`, `0.${i}`, '#15803d'),
    ]

    expect(
      judgeStateCarriers(card(...instance(0), ...instance(1)), { ...ctx, story: grid })
    ).toEqual([])
  })
})
