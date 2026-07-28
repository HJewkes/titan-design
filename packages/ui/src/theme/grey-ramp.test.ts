/**
 * TD-07.14 / TD-07.15 — the warm grey ramp, and the gate it had to clear.
 *
 * This ramp was lost and re-derived four times before it was committed, so these
 * tests exist to make the properties that were argued about EXPENSIVE to break,
 * rather than leaving them in a document nobody reads. Each block corresponds to
 * a decision someone had to make twice.
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { greyRamp, SURFACE_PLANE_STEPS, primitiveRamps } from './tokens/primitives'


// ── colour math (CIELAB D65 + WCAG relative luminance) ──────────────────────
const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const srgb2lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29)
function lab(hex: string): [number, number, number] {
  const [r, g, b] = hex2rgb(hex).map(srgb2lin)
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
  const [fx, fy, fz] = [f(X), f(Y), f(Z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
const dE76 = (a: string, b: string) => {
  const [p, q] = [lab(a), lab(b)]
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}
const Lstar = (hex: string) => lab(hex)[0]
const warmth = (hex: string) => {
  const [r, , b] = hex2rgb(hex)
  return r - b
}

/** Machado-2009 dichromacy, severity 1.0. */
const CVD = {
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
} as const
function simulateCvd(m: readonly number[], hex: string): string {
  const [r, g, b] = hex2rgb(hex)
  const out = [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ]
  return (
    '#' +
    out
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

const STEPS = Object.keys(greyRamp).map(Number).sort((a, b) => a - b)
const hexAt = (step: number) => greyRamp[step as keyof typeof greyRamp]

describe('greyRamp — shape', () => {
  it('is monotonically darker as the step number rises', () => {
    const ls = STEPS.map((s) => Lstar(hexAt(s)))
    for (let i = 1; i < ls.length; i++) {
      expect(ls[i], `step ${STEPS[i]} is not darker than ${STEPS[i - 1]}`).toBeLessThan(ls[i - 1])
    }
  })

  it('reads warm at every step — R−B never drops below the +2 the generator guards', () => {
    for (const s of STEPS) {
      expect(warmth(hexAt(s)), `step ${s} (${hexAt(s)}) is not warm`).toBeGreaterThanOrEqual(2)
    }
  })

  it('has no two steps a reader could not tell apart', () => {
    for (let i = 1; i < STEPS.length; i++) {
      const d = dE76(hexAt(STEPS[i - 1]), hexAt(STEPS[i]))
      expect(d, `steps ${STEPS[i - 1]}/${STEPS[i]} collapse at ΔE ${d.toFixed(2)}`).toBeGreaterThan(1.5)
    }
  })

  /**
   * The reason `975` exists at all. If a chromatic ramp is ever re-tuned so its
   * darkest step drops below the bezel, the justification for the extra step
   * evaporates and this ramp should be renumbered rather than left as folklore.
   */
  it('extends below the chromatic grid — which is why 975 is not 950', () => {
    const floor = [...Object.values(primitiveRamps)]
      .map((r) => Lstar(r[950 as keyof typeof r] as string))
      .sort((a, b) => a - b)
    const median = floor[Math.floor(floor.length / 2)]
    expect(Lstar(greyRamp[975])).toBeLessThan(median)
    expect(median).toBeCloseTo(10.3, 0)
  })
})

describe('greyRamp — anchors are load-bearing', () => {
  /**
   * These six are byte-identical to the values that shipped in v0.10.0 as
   * `surfaceRampDark` + `backgroundFrameDark`. That is what makes TD-07.14 a
   * rename rather than a restyle: every surface keeps its exact pixel value.
   * Changing one here silently restyles every surface in the system.
   */
  const ANCHORS: Array<[keyof typeof greyRamp, string, string]> = [
    [850, '#373635', 'surface overlay'],
    [875, '#31302F', 'surface raised'],
    [900, '#2C2A28', 'surface elevated'],
    [925, '#252321', 'surface base'],
    [950, '#1C1916', 'background base'],
    [975, '#100D0A', 'background frame / bezel'],
  ]

  it.each(ANCHORS)('step %s is %s (%s) — unchanged from v0.10.0', (step, hex) => {
    expect(greyRamp[step]).toBe(hex)
  })

  it('maps every surface plane to a real step, darkest first', () => {
    const steps = Object.values(SURFACE_PLANE_STEPS)
    for (const s of steps) expect(greyRamp[s]).toBeDefined()
    expect([...steps].sort((a, b) => b - a)).toEqual(steps)
  })

  it('has no `inset` — it was retired for being imperceptible from the frame', () => {
    // The reason, kept as an assertion so nobody reintroduces it: the old inset
    // #13100D sat ΔE 1.10 from the bezel, well under the ~2.3 JND.
    expect(dE76('#13100D', greyRamp[975])).toBeLessThan(2.3)
    expect(Object.keys(greyRamp)).not.toContain('inset')
  })
})

describe('greyRamp — accessibility gate (TD-07.15)', () => {
  // NOTE: the on-surface TEXT-pairing gate lives in `semantic-contrast.test.ts`,
  // added with the token repoint. It cannot pass until the text tokens actually
  // move onto this ramp — on the shipped cool `neutral` scale, text-tertiary
  // fails WCAG outright on the three lightest planes (2.96 / 2.72 / 2.49).

  it('stays legible under all three dichromacies', () => {
    for (const [mode, matrix] of Object.entries(CVD)) {
      for (const s of STEPS) {
        const shift = dE76(hexAt(s), simulateCvd(matrix, hexAt(s)))
        expect(shift, `${mode} shifts grey-${s} by ΔE ${shift.toFixed(2)}`).toBeLessThan(3)
      }
      // Adjacent steps must stay separable AFTER simulation, or the depth
      // ordering of the surface stack stops reading for those viewers.
      for (let i = 1; i < STEPS.length; i++) {
        const d = dE76(simulateCvd(matrix, hexAt(STEPS[i - 1])), simulateCvd(matrix, hexAt(STEPS[i])))
        expect(d, `${mode}: grey-${STEPS[i - 1]}/${STEPS[i]} merge`).toBeGreaterThan(1.5)
      }
    }
  })
})

describe('greyRamp — provenance', () => {
  it('still matches the generator that derived it', () => {
    const script = join(__dirname, '../../scripts/generate-grey-ramp.mjs')
    // Throws (non-zero exit) if primitives.ts has drifted from the derivation.
    expect(() => execFileSync('node', [script, '--check'], { encoding: 'utf8' })).not.toThrow()
  })
})
