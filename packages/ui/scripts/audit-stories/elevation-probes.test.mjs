import { describe, expect, it } from 'vitest'
import {
  GLOW_SCOPE,
  GLYPH_DRIFT,
  KINDS,
  NESTED_LIFT,
  RULES,
  judge,
  judgeGlowScope,
  judgeGlyphDrift,
  judgeNestedLift,
} from './elevation-probes.mjs'

// Computed box-shadow strings as Chromium reports them: colour first, then the lengths.
const LIFT_1 = 'rgba(0, 0, 0, 0.35) 0px 1px 2px 0px, rgba(0, 0, 0, 0.3) 0px 2px 6px 0px'
const LIFT_2 = 'rgba(0, 0, 0, 0.35) 0px 1px 2px 0px, rgba(0, 0, 0, 0.32) 0px 4px 12px 0px'
const LIFT_4 =
  'rgba(0, 0, 0, 0.35) 0px 1px 2px 0px, rgba(0, 0, 0, 0.3) 0px 10px 24px 0px, ' +
  'rgba(0, 0, 0, 0.2) 0px 24px 48px 0px'
const RIM = 'rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset'
const GLOW = 'rgba(34, 197, 94, 0.5) 0px 0px 8px 2px'
const FOCUS_RING = 'rgb(37, 99, 235) 0px 0px 0px 2px'

// A node with the collector's shape; ids are child-index paths, so the parent is the id's prefix.
const node = (id, extra = {}) => ({
  id,
  parent: id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : null,
  selector: `.n${id.replaceAll('.', '-')}`,
  tag: 'div',
  role: null,
  interactive: false,
  box: [0, 0, 200, 120],
  layout: { position: 'static' },
  ink: [0, 0, 200, 120],
  text: null,
  style: { backgroundColor: 'rgba(0, 0, 0, 0)', boxShadow: 'none', hasBackgroundImage: false },
  state: { selected: false, current: null, pressed: null, checked: null, disabled: false },
  ...extra,
})
const shadowed = (id, boxShadow, extra = {}) =>
  node(id, { ...extra, style: { ...node(id).style, boxShadow, ...extra.style } })
const sized = (w, h = w) => ({ box: [0, 0, w, h], ink: [0, 0, w, h] })
const icon = (id, size, paint = 'rgb(156, 163, 175)', extra = {}) =>
  node(id, { tag: 'svg', glyph: 'chev', paint, ...sized(size), ...extra })
const filled = (id, backgroundColor, extra = {}) =>
  node(id, { ...extra, style: { ...node(id).style, backgroundColor } })
const layoutOf = (...nodes) => ({ nodes, audit: { concepts: {}, glyphRoles: {} } })

describe('elevation probe module contract', () => {
  it('maps each kind to its rule', () => {
    expect(KINDS).toEqual([NESTED_LIFT, GLOW_SCOPE, GLYPH_DRIFT])
    expect(RULES).toEqual({
      [NESTED_LIFT]: 'DR-CO-14',
      [GLOW_SCOPE]: 'DR-CO-15',
      [GLYPH_DRIFT]: 'DR-RB-04',
    })
  })

  it('does not throw on nodes missing optional fields or on an empty context', () => {
    const bare = {
      nodes: [
        { id: '0', selector: '.bare' },
        { id: '1', tag: 'svg', glyph: 'x' },
      ],
    }

    expect(judge(bare, {})).toEqual([])
    expect(judge(undefined)).toEqual([])
  })
})

describe('nested-lift', () => {
  it('flags a lifted card inside a lifted card, on the inner card', () => {
    const tree = layoutOf(shadowed('0', LIFT_1), shadowed('0.0', LIFT_2, sized(160, 80)))

    expect(judgeNestedLift(tree)).toEqual([
      {
        kind: NESTED_LIFT,
        selector: '.n0-0',
        detail: 'lifted 160×80 box inside lifted .n0 (lifted depth 2, limit 1)',
      },
    ])
  })

  it('counts every lifted ancestor in the depth and cites the nearest', () => {
    const tree = layoutOf(
      shadowed('0', LIFT_1),
      shadowed('0.0', LIFT_1),
      shadowed('0.0.0', `${RIM}, ${LIFT_2}`, sized(100, 60))
    )

    expect(judgeNestedLift(tree).map((f) => f.detail)).toEqual([
      'lifted 200×120 box inside lifted .n0 (lifted depth 2, limit 1)',
      'lifted 100×60 box inside lifted .n0-0 (lifted depth 3, limit 1)',
    ])
  })

  it('stays quiet for flat, floating, thumb, sibling, rim-only and coloured-shadow cases', () => {
    const quiet = layoutOf(
      shadowed('0', LIFT_1),
      node('0.0'),
      shadowed('0.1', LIFT_4),
      shadowed('0.2', LIFT_1, { role: 'menu' }),
      shadowed('0.3', LIFT_1, { layout: { position: 'fixed' } }),
      shadowed('0.4', LIFT_1, sized(20)),
      shadowed('0.5', RIM),
      shadowed('0.6', 'rgba(37, 99, 235, 0.4) 0px 4px 12px 0px'),
      shadowed('1', LIFT_1)
    )

    expect(judgeNestedLift(quiet)).toEqual([])
  })

  it('starts a new stack inside a floating box', () => {
    const tree = layoutOf(
      shadowed('0', LIFT_1),
      shadowed('0.0', LIFT_2, { role: 'dialog' }),
      shadowed('0.0.0', LIFT_1, sized(120, 60))
    )

    expect(judgeNestedLift(tree)).toEqual([])
  })
})

describe('glow-scope', () => {
  it('flags a glow on a box over 24px', () => {
    const out = judgeGlowScope(layoutOf(shadowed('0', GLOW, sized(40))))

    expect(out).toEqual([
      { kind: GLOW_SCOPE, selector: '.n0', detail: 'glow on a 40×40 box (limit 24px)' },
    ])
  })

  it('flags a glow on text and a glow inside an svg', () => {
    const tree = layoutOf(
      shadowed('0', GLOW, { ...sized(20, 16), text: { color: 'rgb(0, 0, 0)' } }),
      node('1', { tag: 'svg', ...sized(200, 100) }),
      shadowed('1.0', GLOW, sized(8))
    )

    expect(judgeGlowScope(tree).map((f) => f.detail)).toEqual([
      'glow on text (indicators only)',
      'glow inside an svg (no chart marks)',
    ])
  })

  it('flags the second glow in one instance, once', () => {
    const tree = layoutOf(
      node('0'),
      shadowed('0.0', GLOW, sized(8)),
      shadowed('0.1', GLOW, sized(8))
    )

    expect(judgeGlowScope(tree, { story: { id: 'atoms-dot--default' } })).toEqual([
      { kind: GLOW_SCOPE, selector: '.n0-1', detail: 'glow 2 of 2 in one instance (limit 1)' },
    ])
  })

  it('reports a node once when it is both oversized and a second glow', () => {
    const tree = layoutOf(shadowed('0', GLOW, sized(8)), shadowed('1', GLOW, sized(40)))

    expect(judgeGlowScope(tree)).toHaveLength(1)
  })

  it('stays quiet for one dot, a focus ring, a neutral blur and one dot per variant', () => {
    const dots = Array.from({ length: 6 }, (_, i) => node(`0.${i}`, sized(8))).map((n) => ({
      ...n,
      style: { ...n.style, boxShadow: GLOW },
    }))
    const gallery = layoutOf(node('0'), ...dots)
    const single = layoutOf(
      shadowed('0', GLOW, sized(8)),
      shadowed('1', FOCUS_RING, sized(120, 40)),
      shadowed('2', 'rgba(0, 0, 0, 0.4) 0px 0px 12px 0px', sized(120, 40))
    )

    expect(judgeGlowScope(gallery, { story: { id: 'atoms-dot--all-colors' } })).toEqual([])
    expect(judgeGlowScope(single)).toEqual([])
  })
})

describe('glyph-drift', () => {
  it('flags two copies of one icon more than 1px apart in size', () => {
    const tree = layoutOf(filled('0', 'rgb(255, 255, 255)'), icon('0.0', 16), icon('0.1', 18))

    expect(judgeGlyphDrift(tree)).toEqual([
      {
        kind: GLYPH_DRIFT,
        selector: '.n0-1',
        detail: 'glyph chev: size 18×18 vs 16×16 at .n0-0 (limit 1px)',
      },
    ])
  })

  it('flags two copies of one icon in two colours on one backdrop', () => {
    const tree = layoutOf(
      filled('0', 'rgb(255, 255, 255)'),
      icon('0.0', 16),
      icon('0.1', 16, 'rgb(107, 114, 128)')
    )

    expect(judgeGlyphDrift(tree).map((f) => f.detail)).toEqual([
      'glyph chev: colour #6b7280 vs #9ca3af at .n0-0 on #ffffff (one colour per backdrop)',
    ])
  })

  it('composites translucent fills when it compares backdrops', () => {
    const tree = layoutOf(
      filled('0', 'rgb(255, 255, 255)'),
      filled('0.0', 'rgba(0, 0, 0, 0.5)', sized(40)),
      icon('0.0.0', 16),
      filled('0.1', 'rgba(0, 0, 0, 0.5)', sized(40)),
      icon('0.1.0', 16, 'rgb(107, 114, 128)')
    )

    expect(judgeGlyphDrift(tree).map((f) => f.detail)).toEqual([
      'glyph chev: colour #6b7280 vs #9ca3af at .n0-0-0 on #808080 (one colour per backdrop)',
    ])
  })

  it('stays quiet for matching copies, other backdrops, states, declared roles and big svgs', () => {
    const quiet = layoutOf(
      filled('0', 'rgb(255, 255, 255)'),
      icon('0.0', 16),
      icon('0.1', 16.75),
      filled('0.2', 'rgb(37, 99, 235)', { interactive: true, ...sized(40) }),
      icon('0.2.0', 16, 'rgb(255, 255, 255)'),
      node('0.3', { interactive: true, state: { ...node('0').state, selected: true } }),
      icon('0.3.0', 16, 'rgb(37, 99, 235)', { glyph: 'tab' }),
      node('0.4', { interactive: true }),
      icon('0.4.0', 20, 'rgb(107, 114, 128)', { glyph: 'tab' }),
      icon('0.5', 16, 'rgb(156, 163, 175)', { glyph: 'role' }),
      icon('0.6', 24, 'rgb(156, 163, 175)', { glyph: 'role' }),
      icon('0.7', 120, 'rgb(156, 163, 175)'),
      icon('0.8', 16, 'rgb(156, 163, 175)', { glyph: null })
    )
    quiet.audit.glyphRoles = { 0.6: 'toolbar' }

    expect(judgeGlyphDrift(quiet)).toEqual([])
  })

  it('compares copies only inside one instance of a variant grid', () => {
    const tree = layoutOf(node('0'), node('0.0'), icon('0.0.0', 16), node('0.1'), icon('0.1.0', 20))

    expect(judgeGlyphDrift(tree, { story: { id: 'atoms-icon--sizes' } })).toEqual([])
    expect(judgeGlyphDrift(tree, { story: { id: 'atoms-icon--default' } })).toHaveLength(1)
  })
})
