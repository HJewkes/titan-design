import { describe, expect, it } from 'vitest'
import {
  CONCEPT_TOKEN_DRIFT,
  FULL_CHROMA,
  GREY_ON_COLOUR,
  KINDS,
  RULES,
  judge,
  judgeConceptTokenDrift,
  judgeFullChroma,
  judgeGreyOnColour,
} from './colour-probes.mjs'

const tokens = {
  '#22c55e': ['--color-status-success'],
  '#dc2626': ['--color-status-error'],
  '#2563eb': ['--color-status-info'],
  '#dcfce7': ['--color-status-success-subtle'],
  '#ffffff': ['--color-on-status-info'],
  '#000000': ['--color-status-success-rgb'],
}
const ctx = { tokens }

// A node with the collector's shape: a box, no text, nothing painted, full opacity, enabled.
const node = (id, extra = {}) => ({
  id,
  parent: null,
  selector: `.n${id}`,
  tag: 'div',
  box: [0, 0, 100, 40],
  paints: false,
  text: null,
  style: { backgroundColor: 'rgba(0, 0, 0, 0)', effectiveOpacity: 1 },
  concept: null,
  state: { disabled: false },
  ...extra,
})
const label = (id, color, { opacity = 1, backdrop = '#ffffff', ...rest } = {}) =>
  node(id, {
    text: { color, backdrop, backdropImage: false },
    style: { backgroundColor: 'rgba(0, 0, 0, 0)', effectiveOpacity: opacity },
    ...rest,
  })
const dot = (id, backgroundColor, extra = {}) =>
  node(id, {
    box: [0, 0, 10, 10],
    paints: true,
    style: { backgroundColor, effectiveOpacity: 1 },
    ...extra,
  })
const layoutOf = (...nodes) => ({ nodes, audit: { concepts: {}, glyphRoles: {} } })

describe('colour probe module contract', () => {
  it('maps each kind to its colour rule', () => {
    expect(KINDS).toEqual([FULL_CHROMA, GREY_ON_COLOUR, CONCEPT_TOKEN_DRIFT])
    expect(RULES).toEqual({
      [FULL_CHROMA]: 'DR-CO-08',
      [GREY_ON_COLOUR]: 'DR-CO-09',
      [CONCEPT_TOKEN_DRIFT]: 'DR-CO-11',
    })
  })

  it('does not throw on nodes missing optional fields or on an empty context', () => {
    const bare = {
      nodes: [
        { id: '0', selector: '.bare' },
        { id: '1', concept: 'a' },
      ],
    }

    expect(judge(bare, {})).toEqual([])
    expect(judge(undefined)).toEqual([])
  })
})

describe('full-chroma', () => {
  it('flags a status label faded by an ancestor opacity', () => {
    const out = judgeFullChroma(layoutOf(label('1', 'rgb(34, 197, 94)', { opacity: 0.6 })), ctx)

    expect(out).toEqual([
      {
        kind: FULL_CHROMA,
        selector: '.n1',
        detail: 'text #22c55e (--color-status-success) at opacity 0.6 (floor 0.95)',
      },
    ])
  })

  it('flags a status mark washed by its own alpha', () => {
    const out = judgeFullChroma(layoutOf(dot('1', 'rgba(220, 38, 38, 0.4)')), ctx)

    expect(out.map((f) => f.detail)).toEqual([
      'background #dc2626 (--color-status-error) at alpha 0.4 (floor 0.95)',
    ])
  })

  it('flags a faded svg mark in a status colour', () => {
    const icon = node('1', {
      tag: 'svg',
      paint: 'rgb(37, 99, 235)',
      style: { effectiveOpacity: 0.5 },
    })

    expect(judgeFullChroma(layoutOf(icon), ctx)).toHaveLength(1)
  })

  it('stays quiet for full-strength, neutral, subtle, disabled and large painted cases', () => {
    const quiet = layoutOf(
      label('1', 'rgb(34, 197, 94)'),
      label('2', 'rgb(107, 114, 128)', { opacity: 0.6 }),
      dot('3', 'rgb(220, 252, 231)', {
        style: { backgroundColor: 'rgb(220, 252, 231)', effectiveOpacity: 0.6 },
      }),
      label('4', 'rgb(34, 197, 94)', { opacity: 0.5, state: { disabled: true } }),
      label('5', 'rgb(0, 0, 0)', { opacity: 0.6 }),
      node('6', {
        paints: true,
        style: { backgroundColor: 'rgba(220, 38, 38, 0.4)', effectiveOpacity: 1 },
      })
    )

    expect(judgeFullChroma(quiet, ctx)).toEqual([])
  })

  it('lets a strength of exactly 0.95 pass', () => {
    expect(
      judgeFullChroma(layoutOf(label('1', 'rgb(34, 197, 94)', { opacity: 0.95 })), ctx)
    ).toEqual([])
  })
})

describe('grey-on-colour', () => {
  it('flags grey text on a saturated fill and says it is neutral', () => {
    const out = judgeGreyOnColour(
      layoutOf(label('1', 'rgb(156, 163, 175)', { backdrop: '#2563eb' })),
      ctx
    )

    expect(out).toEqual([
      {
        kind: GREY_ON_COLOUR,
        selector: '.n1',
        detail:
          'neutral text #9ca3af (raw) on #2563eb (L 0.55, C 0.22) is not an on-* token value ' +
          '(chromatic: C > 0.06, L 0.35–0.85)',
      },
    ])
  })

  it('stays quiet for on-* text, dark and pale backdrops, and image backdrops', () => {
    const quiet = layoutOf(
      label('1', 'rgb(255, 255, 255)', { backdrop: '#2563eb' }),
      label('2', 'rgb(156, 163, 175)', { backdrop: '#1f2937' }),
      label('3', 'rgb(107, 114, 128)', { backdrop: '#dbeafe' }),
      node('4', { text: { color: 'rgb(156, 163, 175)', backdrop: null, backdropImage: true } })
    )

    expect(judgeGreyOnColour(quiet, ctx)).toEqual([])
  })
})

describe('concept-token-drift', () => {
  const marks = (concept, ...colours) =>
    colours.map((c, i) => dot(`${concept}${i}`, c, { concept, selector: `.${concept}${i}` }))

  it('flags one concept painted in two colours, once, listing each colour', () => {
    const tree = layoutOf(
      ...marks('live', 'rgb(34, 197, 94)', 'rgb(34, 197, 94)', 'rgb(22, 163, 74)')
    )

    const out = judgeConceptTokenDrift(tree, ctx)

    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ kind: CONCEPT_TOKEN_DRIFT, selector: '.live0' })
    expect(out[0].detail).toMatch(
      /^concept "live": #22c55e \(--color-status-success\) ×2, #16a34a \(raw\) ×1; max ΔE [\d.]+ \(limit 2\)$/
    )
  })

  it('reads members from the story-declared concept map and paints a wrapper by its first painted child', () => {
    const wrapper = node('w')
    const inner = label('w.0', 'rgb(22, 163, 74)', { parent: 'w' })
    const tree = {
      ...layoutOf(dot('a', 'rgb(34, 197, 94)'), wrapper, inner),
      audit: { concepts: { live: ['a', 'w'] } },
    }

    expect(judgeConceptTokenDrift(tree, ctx).map((f) => f.selector)).toEqual(['.na'])
  })

  it('stays quiet for matching instances, different concepts and a single instance', () => {
    const quiet = layoutOf(
      ...marks('same', 'rgb(34, 197, 94)', 'rgb(34, 197, 94)', 'rgb(34, 197, 94)'),
      ...marks('up', 'rgb(34, 197, 94)'),
      ...marks('down', 'rgb(220, 38, 38)'),
      ...marks('near', 'rgb(34, 197, 94)', 'rgb(35, 197, 94)')
    )

    expect(judgeConceptTokenDrift(quiet, ctx)).toEqual([])
  })
})
