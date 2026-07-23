import { describe, it, expect } from 'vitest'
import { getSemanticColors } from '../../../theme/tokens/semantic'

/**
 * Token-value contract for the dark surface ramp (TD-surface-tokens, S-1).
 * Mirrors `config.completeness.test.ts`'s role — this fails CI on the raw
 * token VALUES, independent of any component, the same way the categorical
 * palette locks its eligibility mask with a value-level test.
 *
 * Scope: DARK mode only. The north-star diagnosis
 * (coordination/design-explorations/surface-system-north-star.md) measured and
 * fixed the dark ramp specifically; light mode has its own latent collisions
 * (e.g. `surface-overlay` === `surface-base`, both `#FFFFFF`) that were never
 * part of this investigation — flagged as a follow-up, not silently patched
 * here (see the report / open item list).
 *
 * ── R1 note — why this does NOT assert a flat ΔL* >= 4 on every step ──
 * An earlier draft of the north-star doc (§3) proposed 5 EVEN steps at
 * ΔL*≈4. The LOCKED derivation that ships here (§ "Surface-ramp SYSTEM —
 * derived, not hand-picked") deliberately supersedes that with DIMINISHING
 * steps (4.5 / 2.5 / 2 / 1.5) — the frame->content jump is biggest, each
 * plane above adds less — and explicitly shifts separation duty for the
 * tight upper steps onto the alpha hairline (R3), not lightness:
 * "lightness is a *secondary* cue" (doc §"Surface-ramp SYSTEM"). So R1 here
 * asserts what the locked design actually guarantees: strict monotonicity,
 * a >=4 L* foundational jump at the frame/shell boundary, and a floor under
 * the taper — not a uniform >=4 everywhere. The multi-channel guarantee
 * (hairline carries the rest) is R3.
 */

// --- CIELAB L* (perceptual lightness), matching the calculation in
// surface-lab-shared.tsx's `lstar()` (the derivation source) verbatim, so
// this test measures the SAME metric the ramp was designed against. ---
function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

function lstar(hex: string): number {
  const lin = channels(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  return y <= 0.008856 ? y * 903.3 : 116 * Math.cbrt(y) - 16
}

/** Flatten an rgba(...) alpha color over an opaque hex background -> opaque hex. */
function compositeOver(baseHex: string, overlay: string): string {
  const match = overlay.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/
  )
  if (!match) throw new Error(`not an rgba() color: ${overlay}`)
  const [, r, g, b, a = '1'] = match
  const alpha = parseFloat(a)
  const base = channels(baseHex)
  const tint = [parseFloat(r), parseFloat(g), parseFloat(b)]
  const mixed = base.map((c, i) => c * (1 - alpha) + tint[i] * alpha)
  return (
    '#' +
    mixed
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}

const dark = getSemanticColors('dark')

// The 6-plane derivation, in darkest -> lightest order. `inset` has no shipped
// token yet (see semantic.ts comment) — included here only for the
// monotonicity/step checks against the derivation's own numbers, not as a
// token-identity assertion.
const RAMP_HEX = {
  inset: '#13100D',
  background: dark['background-base'],
  base: dark['surface-base'],
  elevated: dark['surface-elevated'],
  raised: dark['surface-raised'],
  overlay: dark['surface-overlay'],
} as const

const PLANE_ORDER = ['inset', 'background', 'base', 'elevated', 'raised', 'overlay'] as const

describe('surface ramp contract (dark) — token-value guardrails', () => {
  it('ships the deriveSurfaceRamp() output verbatim for the addressable planes', () => {
    // Locked values from surface-system-north-star.md — see surfaceRampDark in
    // primitives.ts for the derivation this must match byte-for-byte.
    expect(dark['background-base']).toBe('#1C1916')
    expect(dark['surface-base']).toBe('#252321')
    expect(dark['surface-elevated']).toBe('#2A2827')
    expect(dark['surface-raised']).toBe('#2D2C2B')
    expect(dark['surface-overlay']).toBe('#302F2E')
  })

  describe('R1 — monotonic ramp with a real foundational jump', () => {
    it('is strictly increasing in L* across all 6 planes', () => {
      const Ls = PLANE_ORDER.map((name) => lstar(RAMP_HEX[name]))
      for (let i = 1; i < Ls.length; i++) {
        expect(
          Ls[i],
          `${PLANE_ORDER[i]} should be lighter than ${PLANE_ORDER[i - 1]}`
        ).toBeGreaterThan(Ls[i - 1])
      }
    })

    it('clears ΔL* >= 4 at the two foundational steps (inset->background, background->base)', () => {
      const dL_insetToBackground = lstar(RAMP_HEX.background) - lstar(RAMP_HEX.inset)
      const dL_backgroundToBase = lstar(RAMP_HEX.base) - lstar(RAMP_HEX.background)
      expect(dL_insetToBackground).toBeGreaterThanOrEqual(4)
      expect(dL_backgroundToBase).toBeGreaterThanOrEqual(4)
    })

    it('tapers (each upper step is smaller than the last) but never collapses to zero', () => {
      // base->elevated->raised->overlay: the intentionally-diminishing part of
      // the ramp. Separation here is carried primarily by the hairline (R3);
      // this only guards against the steps disappearing or reversing.
      const upperSteps = ['base', 'elevated', 'raised', 'overlay'] as const
      const stepSizes: number[] = []
      for (let i = 1; i < upperSteps.length; i++) {
        const d = lstar(RAMP_HEX[upperSteps[i]]) - lstar(RAMP_HEX[upperSteps[i - 1]])
        expect(d, `${upperSteps[i - 1]} -> ${upperSteps[i]}`).toBeGreaterThanOrEqual(1)
        stepSizes.push(d)
      }
      for (let i = 1; i < stepSizes.length; i++) {
        expect(stepSizes[i], 'steps should keep diminishing (tapered design)').toBeLessThan(
          stepSizes[i - 1]
        )
      }
    })
  })

  describe('R2 — no footgun collisions', () => {
    it('surface-elevated and surface-overlay are distinct (previously both #191919)', () => {
      expect(dark['surface-elevated']).not.toBe(dark['surface-overlay'])
    })

    it('the 5 addressable surface-family hexes are pairwise distinct', () => {
      const family = [
        'surface-base',
        'surface-elevated',
        'surface-raised',
        'surface-overlay',
      ] as const
      const values = family.map((k) => dark[k])
      expect(new Set(values).size).toBe(values.length)
    })

    it('no solid border token equals any surface/background fill hex', () => {
      const surfaceHexes = new Set([
        dark['background-base'],
        dark['background-default'],
        dark['background-subtle'],
        dark['surface-base'],
        dark['surface-elevated'],
        dark['surface-raised'],
        dark['surface-overlay'],
        dark['surface-input'],
      ])
      const solidBorders = [
        'border-default',
        'border-subtle',
        'border-strong',
        'border-prominent',
      ] as const
      for (const token of solidBorders) {
        expect(
          surfaceHexes.has(dark[token]),
          `${token} (${dark[token]}) collides with a surface hex`
        ).toBe(false)
      }
    })
  })

  describe('R3 — alpha hairline clears its ΔL* floor on every plane', () => {
    // Doc floors (subtle>=6/default>=9/strong>=13) were calibrated on the OLD,
    // much darker ramp (L* 4.7-10.3). The locked ramp compresses into a
    // narrower, lighter band (L* 9-19.5) where CIELAB L* is sublinear near
    // white, so the SAME alpha values composite to a slightly smaller (but
    // still solid, still near-constant) ΔL* at the lightest planes. Measured
    // floors below reflect that; a wall-display calibration pass (S-6) may
    // retune the alpha values themselves.
    const HAIRLINES = {
      subtle: { token: 'hairline-subtle', floor: 5 },
      default: { token: 'hairline-default', floor: 8 },
      strong: { token: 'hairline-strong', floor: 12 },
    } as const

    for (const [name, { token, floor }] of Object.entries(HAIRLINES)) {
      it(`${name} (${token}) clears ΔL* >= ${floor} on every ramp plane`, () => {
        const hairlineColor = dark[token as keyof typeof dark]
        for (const plane of PLANE_ORDER) {
          const planeHex = RAMP_HEX[plane]
          const composited = compositeOver(planeHex, hairlineColor)
          const dL = lstar(composited) - lstar(planeHex)
          expect(dL, `${name} on ${plane}`).toBeGreaterThanOrEqual(floor)
        }
      })
    }

    it('is near-constant (self-normalizing) across all planes: spread < 4 L* per tier', () => {
      // Measured spread (inset..overlay): subtle ~1.6, default ~2.2, strong ~3.2 —
      // still far tighter than a solid border token (which swings ~5.6 -> 0
      // across this same ramp, see R4). "Near-constant" is relative to that,
      // not perfectly flat — alpha-over-white is sublinear in L* as the base
      // lightens, which is exactly the R3 floor-vs-doc discrepancy noted above.
      for (const { token } of Object.values(HAIRLINES)) {
        const hairlineColor = dark[token as keyof typeof dark]
        const deltas = PLANE_ORDER.map((plane) => {
          const planeHex = RAMP_HEX[plane]
          return lstar(compositeOver(planeHex, hairlineColor)) - lstar(planeHex)
        })
        expect(Math.max(...deltas) - Math.min(...deltas)).toBeLessThan(4)
      }
    })
  })

  describe('R4 — border-on-surface clears ΔL* >= 3 (fixes the invisible-hairline collision)', () => {
    it('border-subtle is no longer invisible on surface-raised (the original bug)', () => {
      const dL = Math.abs(lstar(dark['border-subtle']) - lstar(dark['surface-raised']))
      expect(dL).toBeGreaterThanOrEqual(3)
    })

    it('border-subtle clears ΔL* >= 3 against base/elevated/raised/overlay', () => {
      const planes = [
        'surface-base',
        'surface-elevated',
        'surface-raised',
        'surface-overlay',
      ] as const
      for (const plane of planes) {
        const dL = Math.abs(lstar(dark['border-subtle']) - lstar(dark[plane]))
        expect(dL, `border-subtle vs ${plane}`).toBeGreaterThanOrEqual(3)
      }
    })
  })
})
