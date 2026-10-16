import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  floorRatio,
  isLargeText,
  over,
  textKind,
  toHex,
  type Rgba,
} from '../src/contrast.ts'
import { evaluateFrame } from '../src/contrast-check.ts'
import type { FrameSamples, RawNode, RawSample } from '../src/contrast-collect.ts'

const WHITE: Rgba = [255, 255, 255, 1]
const BLACK: Rgba = [0, 0, 0, 1]
const CLEAR: Rgba = [0, 0, 0, 0]

describe('contrast ratio', () => {
  it('spans 1:1 for one colour to 21:1 for black on white', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5)
    expect(contrastRatio(WHITE, WHITE)).toBe(1)
  })

  it('matches the WCAG reference value for #767676 on white', () => {
    expect(floorRatio(contrastRatio([0x76, 0x76, 0x76, 1], WHITE))).toBe(4.54)
  })

  it('composites a translucent foreground over its background before measuring', () => {
    const halfBlack: Rgba = [0, 0, 0, 0.5]
    expect(toHex(over(halfBlack, WHITE))).toBe('#808080')
    expect(contrastRatio(halfBlack, WHITE)).toBeCloseTo(contrastRatio([128, 128, 128, 1], WHITE), 1)
  })

  it('rounds a reported ratio down, so a near miss never prints as a pass', () => {
    expect(floorRatio(4.4999)).toBe(4.49)
  })
})

describe('large text', () => {
  it('is 24px at any weight, or 18.66px when bold', () => {
    expect(isLargeText(24, 400)).toBe(true)
    expect(isLargeText(23.9, 400)).toBe(false)
    expect(isLargeText(18.66, 700)).toBe(true)
    expect(isLargeText(18.66, 600)).toBe(false)
    expect(isLargeText(18, 700)).toBe(false)
  })

  it('maps to the text kind that sets the threshold', () => {
    expect(textKind(16, 400)).toBe('text')
    expect(textKind(32, 400)).toBe('large-text')
  })
})

/** html (base plane) > surface > the measured element. */
function frame(surface: Rgba, samples: Partial<RawSample>[], extra: Partial<RawNode> = {}) {
  const nodes: RawNode[] = [
    { parent: -1, bg: CLEAR, opacity: 1, bgImage: false },
    { parent: 0, bg: surface, opacity: 1, bgImage: false },
    { parent: 1, bg: CLEAR, opacity: 1, bgImage: false, ...extra },
  ]
  const full = samples.map(
    (s): RawSample => ({ role: 'text', node: 2, plane: 2, colors: [], selector: 'span', ...s })
  )
  return { base: WHITE, nodes, samples: full } satisfies FrameSamples
}

describe('evaluateFrame', () => {
  it('fails 1.7:1 body text and passes the same colour when it is large', () => {
    const grey: Rgba = [0xb8, 0xb8, 0xb8, 1]
    const [small, large] = evaluateFrame(
      frame(WHITE, [
        { colors: [grey], fontSize: 14, fontWeight: 400, text: 'Last week' },
        { colors: [[0x90, 0x90, 0x90, 1]], fontSize: 24, fontWeight: 400 },
      ])
    ).checks
    expect(small).toMatchObject({ kind: 'text', required: 4.5, pass: false, text: 'Last week' })
    expect(small.ratio).toBeLessThan(2)
    expect(large).toMatchObject({ kind: 'large-text', required: 3, pass: true })
  })

  it('measures against the effective plane, compositing a translucent fill over its parent', () => {
    const scrim: Rgba = [0, 0, 0, 0.5]
    const [check] = evaluateFrame(
      frame(scrim, [{ colors: [WHITE], fontSize: 16, fontWeight: 400 }])
    ).checks
    expect(check.bg).toBe('#808080')
    expect(check.fg).toBe('#ffffff')
  })

  it('fades text by the opacity of its subtree', () => {
    const [check] = evaluateFrame(
      frame(WHITE, [{ colors: [BLACK], fontSize: 16, fontWeight: 400 }], { opacity: 0.2 })
    ).checks
    expect(check.fg).toBe('#cccccc')
    expect(check.pass).toBe(false)
  })

  it('takes the better of a control’s border and fill as its boundary', () => {
    const [check] = evaluateFrame(
      frame(WHITE, [{ role: 'control-boundary', plane: 1, colors: [[0xee, 0xee, 0xee, 1], BLACK] }])
    ).checks
    expect(check).toMatchObject({ kind: 'non-text', fg: '#000000', pass: true })
  })

  it('skips a fill identical to its plane, which draws nothing', () => {
    expect(
      evaluateFrame(frame(WHITE, [{ role: 'mark', plane: 1, colors: [WHITE] }])).checks
    ).toEqual([])
  })

  it('never fails an inactive control, but still records it', () => {
    const [check] = evaluateFrame(
      frame(WHITE, [{ colors: [[0xdd, 0xdd, 0xdd, 1]], fontSize: 16, exempt: 'inactive control' }])
    ).checks
    expect(check).toMatchObject({ pass: true, exempt: 'inactive control' })
  })

  it('reports a gradient plane as indeterminate instead of guessing', () => {
    const result = evaluateFrame(
      frame(WHITE, [{ colors: [BLACK], fontSize: 16 }], { bgImage: true })
    )
    expect(result.checks).toEqual([])
    expect(result.indeterminate[0].reason).toContain('background-image')
  })
})
