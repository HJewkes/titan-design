// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  FOCUS_RING_CLIPPED,
  FOCUS_RING_MISSING,
  FOCUS_RING_OBSCURED,
  HOVER_ONLY_CONTENT,
  KINDS,
  RULES,
  STATE_NO_CHANGE,
  STATE_SHIFT,
  contrastRatio,
  judge,
  judgeFocus,
  judgeHoverOnly,
  judgeStates,
  ringOf,
} from './interaction.mjs'

// Synthetic snapshots in the driver's shape. LOOK_* are joined computed-style strings.
const LOOK_REST = 'rgb(255, 255, 255)|rgb(37, 99, 235)|none'
const LOOK_HOVER = 'rgb(255, 255, 255)|rgb(29, 78, 216)|none'
const NO_RING = {
  outlineStyle: 'none',
  outlineWidth: '0px',
  outlineOffset: '0px',
  outlineColor: 'rgb(0, 0, 0)',
  boxShadow: 'none',
  borderTopWidth: '0px',
  borderTopColor: 'rgb(0, 0, 0)',
}
const OUTLINE_RING = {
  ...NO_RING,
  outlineStyle: 'solid',
  outlineWidth: '2px',
  outlineOffset: '2px',
  outlineColor: 'rgb(255, 121, 0)',
}
const DRAWER = { box: [100, 100, 80, 32], clips: [], backdrop: 'rgb(17, 17, 17)' }
const FOCUS_DETAIL = { chain: [DRAWER], topmost: [true, true, true, true, true], coveredBy: null }
const SIBLING_BOX = [0, 140, 200, 20]

const state = (extra = {}) => ({
  look: [LOOK_REST],
  ring: [NO_RING],
  boxes: { 7: SIBLING_BOX },
  texts: ['Save'],
  ...extra,
})
const focusState = (extra = {}, detail = {}) =>
  state({
    look: [LOOK_HOVER],
    ring: [OUTLINE_RING],
    focus: { ...FOCUS_DETAIL, ...detail },
    ...extra,
  })
const clipped = (clips) => ({ chain: [{ ...DRAWER, clips }] })

// A target whose every state differs from rest and moves nothing: no findings.
const target = (states = {}) => ({
  selector: '[data-testid="t"]',
  states: {
    rest: state(),
    hover: state({ look: [LOOK_HOVER] }),
    focus: focusState(),
    press: state({ look: [LOOK_HOVER] }),
    ...states,
  },
})
const moved = (dy) => ({ 7: [SIBLING_BOX[0], SIBLING_BOX[1] + dy, SIBLING_BOX[2], SIBLING_BOX[3]] })

describe('interaction module contract', () => {
  it('maps every kind to its DR-IX rule', () => {
    expect(Object.keys(RULES).sort()).toEqual([...KINDS].sort())
    expect(RULES[STATE_NO_CHANGE]).toBe('DR-IX-05')
    expect(RULES[STATE_SHIFT]).toBe('DR-IX-12')
    expect(RULES[HOVER_ONLY_CONTENT]).toBe('DR-IX-08')
    expect(
      [FOCUS_RING_MISSING, FOCUS_RING_CLIPPED, FOCUS_RING_OBSCURED].map((k) => RULES[k])
    ).toEqual(['DR-IX-03', 'DR-IX-03', 'DR-IX-03'])
  })

  it('gives no finding for a target that changes in every state and moves nothing', () => {
    expect(judge([target()], { 7: '.sibling' })).toEqual([])
  })

  it('never throws on a target with no snapshots', () => {
    expect(judge([{ selector: '.x' }, { selector: '.y', states: {} }])).toEqual([])
  })
})

describe('judgeStates: state-no-change (DR-IX-05)', () => {
  it('flags a hover identical to rest', () => {
    const findings = judgeStates(target({ hover: state() }))

    expect(findings).toEqual([
      {
        kind: STATE_NO_CHANGE,
        selector: '[data-testid="t"]',
        detail:
          'hover looks the same as rest (colour, background, border, shadow, outline, transform, opacity and underline unchanged)',
      },
    ])
  })

  it('lists every unchanged state in one finding', () => {
    const findings = judgeStates(target({ hover: state(), press: state() }))

    expect(findings).toHaveLength(1)
    expect(findings[0].detail).toMatch(/^hover, press look the same as rest/)
  })

  it('counts a change in any subtree node, not only the target', () => {
    const rest = state({ look: [LOOK_REST, 'label-rest'] })
    const hover = state({ look: [LOOK_REST, 'label-hover'] })

    expect(judgeStates(target({ rest, hover }))).toEqual([])
  })

  it('skips a state the driver could not reach', () => {
    expect(judgeStates(target({ focus: null }))).toEqual([])
  })
})

describe('judgeStates: state-shift (DR-IX-12)', () => {
  it('flags a sibling box that moves 4px on hover', () => {
    const findings = judgeStates(
      target({ hover: state({ look: [LOOK_HOVER], boxes: moved(4) }) }),
      {
        7: 'div:nth-of-type(2)',
      }
    )

    expect(findings).toEqual([
      {
        kind: STATE_SHIFT,
        selector: '[data-testid="t"]',
        detail: 'hover moves div:nth-of-type(2) by 4px (limit 1px)',
      },
    ])
  })

  it('gives no finding for a 1px move', () => {
    const hover = state({ look: [LOOK_HOVER], boxes: moved(1) })

    expect(judgeStates(target({ hover }))).toEqual([])
  })

  it('reports the largest move across states, including a resize', () => {
    const press = state({ look: [LOOK_HOVER], boxes: { 7: [0, 140, 206, 20] } })
    const hover = state({ look: [LOOK_HOVER], boxes: moved(3) })

    const [finding] = judgeStates(target({ hover, press }))

    expect(finding.detail).toBe('press moves node 7 by 6px (limit 1px)')
  })

  it('ignores a node that appears from an empty box (a display: none tooltip opening)', () => {
    const rest = state({ boxes: { ...moved(0), 8: [0, 0, 0, 0] } })
    const hover = state({ look: [LOOK_HOVER], boxes: { ...moved(0), 8: [24, 68, 120, 24] } })

    expect(judgeStates(target({ rest, hover }))).toEqual([])
  })

  it('ignores a node that only exists in the state (a portal opening)', () => {
    const hover = state({ look: [LOOK_HOVER], boxes: { ...moved(0), 9: [0, 0, 100, 40] } })

    expect(judgeStates(target({ hover }))).toEqual([])
  })
})

describe('ringOf and contrastRatio', () => {
  it('reads a 2px outline with its offset as the ring extent', () => {
    expect(ringOf(NO_RING, OUTLINE_RING)).toMatchObject({ via: 'outline', width: 2, extent: 4 })
  })

  it('reads a Tailwind ring as the outer shadow layer minus the offset layer', () => {
    const focus = {
      ...NO_RING,
      boxShadow: 'rgb(17, 17, 17) 0px 0px 0px 2px, rgb(255, 121, 0) 0px 0px 0px 4px',
    }

    expect(ringOf(NO_RING, focus)).toMatchObject({ via: 'box-shadow', width: 2, extent: 4 })
  })

  it('ignores a shadow layer that rest already had', () => {
    const lift = { ...NO_RING, boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 6px 2px' }

    expect(ringOf(lift, lift)).toBeNull()
  })

  it('computes the WCAG ratio of black on white as 21', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5)
  })
})

describe('judgeFocus: focus-ring-* (DR-IX-03)', () => {
  it('flags a focus state that adds no indicator', () => {
    const focus = focusState({ ring: [NO_RING] })

    const findings = judgeFocus(target({ focus }))

    expect(findings).toEqual([
      {
        kind: FOCUS_RING_MISSING,
        selector: '[data-testid="t"]',
        detail: 'no focus indicator: outline, box-shadow and border match rest',
      },
    ])
  })

  it('flags a 1px outline as too thin', () => {
    const focus = focusState({ ring: [{ ...OUTLINE_RING, outlineWidth: '1px' }] })

    expect(judgeFocus(target({ focus }))[0].detail).toBe('outline ring 1px wide (limit 2px)')
  })

  it('flags a ring under 3:1 against the backdrop', () => {
    const ring = [{ ...OUTLINE_RING, outlineColor: 'rgb(40, 40, 40)' }]

    const [finding] = judgeFocus(target({ focus: focusState({ ring }) }))

    expect(finding.kind).toBe(FOCUS_RING_MISSING)
    expect(finding.detail).toMatch(/^outline ring #282828 on #111111 at 1\.\d\d:1 \(limit 3:1\)$/)
  })

  it('accepts a 2px border colour change that clears 3:1 against the rest border', () => {
    const border = { ...NO_RING, borderTopWidth: '2px', borderTopColor: 'rgb(60, 60, 60)' }
    const focused = { ...border, borderTopColor: 'rgb(255, 121, 0)' }

    const rest = state({ ring: [border] })

    const findings = judgeFocus(target({ rest, focus: focusState({ ring: [focused] }) }))

    expect(findings).toEqual([])
  })

  it('accepts a ring that a wrapper draws, as an input field wrapper does', () => {
    const rest = state({ ring: [NO_RING, NO_RING] })
    const focus = focusState(
      { ring: [NO_RING, OUTLINE_RING] },
      { chain: [DRAWER, { ...DRAWER, box: [96, 96, 88, 40] }] }
    )

    expect(judgeFocus(target({ rest, focus }))).toEqual([])
  })

  it('checks the clip of the wrapper that draws the ring', () => {
    const rest = state({ ring: [NO_RING, NO_RING] })
    const wrapper = { ...DRAWER, clips: [{ selector: '.scroller', rect: [100, 0, 400, 400] }] }
    const focus = focusState({ ring: [NO_RING, OUTLINE_RING] }, { chain: [DRAWER, wrapper] })

    const [finding] = judgeFocus(target({ rest, focus }))

    expect(finding.detail).toBe('outline ring clipped by 4px at .scroller (limit 0px)')
  })

  it('flags a ring that crosses a clipping ancestor', () => {
    const clips = [{ selector: '[data-testid="scroller"]', rect: [100, 0, 400, 400] }]

    const findings = judgeFocus(target({ focus: focusState({}, clipped(clips)) }))

    expect(findings).toEqual([
      {
        kind: FOCUS_RING_CLIPPED,
        selector: '[data-testid="t"]',
        detail: 'outline ring clipped by 4px at [data-testid="scroller"] (limit 0px)',
      },
    ])
  })

  it('gives no clipped finding when the ring fits inside the clip', () => {
    const clips = [{ selector: '.scroller', rect: [96, 96, 184, 136] }]

    expect(judgeFocus(target({ focus: focusState({}, clipped(clips)) }))).toEqual([])
  })

  it('flags a target that is covered at every sampled point', () => {
    const detail = {
      topmost: [false, false, null, false, false],
      coveredBy: '[data-testid="sheet"]',
    }

    const findings = judgeFocus(target({ focus: focusState({}, detail) }))

    expect(findings).toEqual([
      {
        kind: FOCUS_RING_OBSCURED,
        selector: '[data-testid="t"]',
        detail: 'none of 4 sampled points is topmost; covered by [data-testid="sheet"]',
      },
    ])
  })

  it('accepts a target that is partly covered (one point topmost)', () => {
    const detail = { topmost: [false, true, false, false, false], coveredBy: '.badge' }

    expect(judgeFocus(target({ focus: focusState({}, detail) }))).toEqual([])
  })

  it('skips a target the Tab did not land on', () => {
    expect(judgeFocus(target({ focus: null }))).toEqual([])
  })
})

describe('judgeHoverOnly: hover-only-content (DR-IX-08)', () => {
  it('flags text that hover reveals and focus does not', () => {
    const hover = state({ look: [LOOK_HOVER], texts: ['Save', 'Saves a draft'] })

    const findings = judgeHoverOnly(target({ hover }))

    expect(findings).toEqual([
      {
        kind: HOVER_ONLY_CONTENT,
        selector: '[data-testid="t"]',
        detail: 'hover shows "Saves a draft"; keyboard focus does not',
      },
    ])
  })

  it('gives no finding when focus reveals the same text', () => {
    const texts = ['Save', 'Saves a draft']
    const hover = state({ look: [LOOK_HOVER], texts })

    expect(judgeHoverOnly(target({ hover, focus: focusState({ texts }) }))).toEqual([])
  })

  it('ignores text that was already visible at rest', () => {
    expect(judgeHoverOnly(target())).toEqual([])
  })
})
