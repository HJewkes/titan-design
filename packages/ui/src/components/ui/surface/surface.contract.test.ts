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
 * steps — the frame->content jump is biggest, each plane above adds less.
 * As of S-3 (this re-space) the steps are 4.5 / 4.5 / 3.5 / 3 / 2.5
 * (frame->background / background->base / base->elevated / elevated->raised /
 * raised->overlay) — the top three widened from the original 2.5/2/1.5 taper
 * so the content planes read as distinct without leaning on the hairline
 * alone (R3 still carries the rest, per "lightness is a *secondary* cue").
 * So R1 here asserts what the locked design actually guarantees: strict
 * monotonicity, a >=4 L* foundational jump at the frame/shell boundary, and
 * a >=2.5 L* floor on each of the three re-spaced upper steps — not a flat
 * "always diminishing" rule (quantizing to whole hex bytes can make two
 * adjacent re-spaced steps land within ~0.02 L* of each other; the floor is
 * the guarantee that matters, not strict ordering between them).
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

// The 6-plane derivation, in darkest -> lightest order. The floor is `frame`;
// the old `inset` plane was retired in TD-07.14 for being ΔE 1.10 from it.
const RAMP_HEX = {
  frame: dark['background-frame'],
  background: dark['background-base'],
  base: dark['surface-base'],
  elevated: dark['surface-elevated'],
  raised: dark['surface-raised'],
  overlay: dark['surface-overlay'],
} as const

const PLANE_ORDER = ['frame', 'background', 'base', 'elevated', 'raised', 'overlay'] as const

describe('surface ramp contract (dark) — token-value guardrails', () => {
  it('ships the deriveSurfaceRamp() output verbatim for the addressable planes', () => {
    // Locked values from surface-system-north-star.md (re-spaced S-3) — see
    // surfaceRampDark in primitives.ts for the derivation this must match
    // byte-for-byte. background/base are unchanged by the re-space.
    expect(dark['background-frame']).toBe('#100D0A')
    expect(dark['background-base']).toBe('#1C1916')
    expect(dark['surface-base']).toBe('#252321')
    expect(dark['surface-elevated']).toBe('#2C2A28')
    expect(dark['surface-raised']).toBe('#31302F')
    expect(dark['surface-overlay']).toBe('#373635')
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

    it('clears ΔL* >= 4 at the two foundational steps (frame->background, background->base)', () => {
      const dL_insetToBackground = lstar(RAMP_HEX.background) - lstar(RAMP_HEX.frame)
      const dL_backgroundToBase = lstar(RAMP_HEX.base) - lstar(RAMP_HEX.background)
      expect(dL_insetToBackground).toBeGreaterThanOrEqual(4)
      expect(dL_backgroundToBase).toBeGreaterThanOrEqual(4)
    })

    it('each re-spaced upper step (base->elevated->raised->overlay) clears ΔL* >= 2.5', () => {
      // S-3 widened the top three steps to 3.5/3/2.5 specifically so they no
      // longer need to lean on the "keep diminishing" clause the old 2.5/2/1.5
      // taper required — each step now stands on its own >=2.5 L* floor.
      // (Quantizing to whole hex bytes can make two of these land within
      // ~0.02 L* of strict diminishing order; that's expected and not asserted.)
      const upperSteps = ['base', 'elevated', 'raised', 'overlay'] as const
      for (let i = 1; i < upperSteps.length; i++) {
        const d = lstar(RAMP_HEX[upperSteps[i]]) - lstar(RAMP_HEX[upperSteps[i - 1]])
        expect(d, `${upperSteps[i - 1]} -> ${upperSteps[i]}`).toBeGreaterThanOrEqual(2.5)
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
        dark['background-frame'],
        dark['surface-base'],
        dark['surface-elevated'],
        dark['surface-raised'],
        dark['surface-overlay'],
        dark['surface-input'],
      ])
      // `border-prominent` is the only solid border left; the quiet three are
      // alpha hairlines now and cannot equal a fill.
      const solidBorders = ['border-prominent'] as const
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
    // much darker ramp (L* 4.7-10.3). The S-1 ramp compressed into a narrower,
    // lighter band (L* 9-19.5); S-3's re-space widens it further still
    // (L* 4.5-22.5) — the wider top steps push `overlay` even lighter, so the
    // SAME alpha values composite to a slightly smaller (but still solid,
    // still near-constant) ΔL* there. Floors below are re-measured against
    // the S-3 ramp (default dropped 8->7 — the `overlay` plane now measures
    // ~7.97, just under the old floor); a wall-display calibration pass (S-6)
    // may retune the alpha values themselves.
    //
    // S-6 DID (VW-99). The alphas went up ×1.5 to .09/.135/.21: on the wall at
    // ~3 m `subtle` rendered but was indiscernible, and `default` — which has had
    // no solid-border fallback since TD-07.14 — went weak on the lightest plane.
    // Floors below re-measured against the new alphas. Note new `subtle` now
    // measures exactly where old `default` did (min 7.97), and the new `default`
    // where old `strong` did (min 12.26) — each tier onto a measured-good rung.
    const HAIRLINES = {
      subtle: { token: 'hairline-subtle', floor: 7 },
      default: { token: 'hairline-default', floor: 12 },
      strong: { token: 'hairline-strong', floor: 18 },
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

    it('is near-constant (self-normalizing) across all planes: spread stays proportional', () => {
      // Measured RELATIVE spread ((max-min)/min): subtle 0.27, default 0.29,
      // strong 0.29 — and, importantly, those are the same figures the OLD
      // .06/.09/.14 family produced (0.28 / 0.27 / 0.28). Self-normalization
      // survived the S-6 retune untouched.
      //
      // This assertion used to be an ABSOLUTE `spread < 4 L*`, which was the
      // wrong metric: absolute spread scales with the alpha, so ANY strengthening
      // fails it no matter how well the property holds. The S-6 ×1.5 retune
      // tripped it (strong 3.46 -> 5.29) purely arithmetically. A ratio is
      // scale-invariant, which is what "self-normalizing" actually claims.
      //
      // Contrast a solid border token, which swings ~5.6 -> 0 across this same
      // ramp (see R4): the point is not a tight absolute band, it is that no
      // plane ever loses the cue. Alpha-over-white is sublinear in L* as the
      // base lightens, which is the R3 floor-vs-doc discrepancy noted above.
      for (const { token } of Object.values(HAIRLINES)) {
        const hairlineColor = dark[token as keyof typeof dark]
        const deltas = PLANE_ORDER.map((plane) => {
          const planeHex = RAMP_HEX[plane]
          return lstar(compositeOver(planeHex, hairlineColor)) - lstar(planeHex)
        })
        const min = Math.min(...deltas)
        expect((Math.max(...deltas) - min) / min, `${token} relative spread`).toBeLessThan(0.35)
      }
    })
  })

  // R4 used to check that the solid `border-subtle` hex did not match the plane
  // it sat on. Those solid borders are gone (TD-07.14) — separation is R3's
  // alpha hairlines, which cannot collide with a plane by construction. What is
  // left to guard is the one border still solid.
  describe('R4 — border-prominent, the last solid border', () => {
    it('clears ΔL* >= 3 on every content plane', () => {
      const planes = [
        'surface-base',
        'surface-elevated',
        'surface-raised',
        'surface-overlay',
      ] as const
      for (const plane of planes) {
        const dL = Math.abs(lstar(dark['border-prominent']) - lstar(dark[plane]))
        expect(dL, `border-prominent vs ${plane}`).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('R5 — background-frame, the ramp floor', () => {
    it('background-frame is darker than background-base', () => {
      expect(lstar(dark['background-frame'])).toBeLessThan(lstar(dark['background-base']))
    })

    it('background-frame is distinct from every surface/background token', () => {
      const otherTokens = [
        'background-base',
        'background-default',
        'background-subtle',
        'surface-base',
        'surface-elevated',
        'surface-raised',
        'surface-overlay',
        'surface-input',
      ] as const
      for (const token of otherTokens) {
        expect(dark['background-frame'], `background-frame vs ${token}`).not.toBe(dark[token])
      }
    })

    // `surface-inset` used to sit between frame and background as the darkest
    // surface-family token. TD-07.14 retired it: at delta-E 1.10 from the frame
    // it was an imperceptible duplicate, which is why `<Surface pressed>`
    // (surface - 1) kept collapsing into it. `frame` is the floor now, so the
    // rule that matters is that nothing in the surface family goes below it.
    it('background-frame is darker than every surface-family token', () => {
      const surfaceFamily = [
        'surface-base',
        'surface-elevated',
        'surface-raised',
        'surface-overlay',
        'surface-input',
      ] as const
      const frameL = lstar(dark['background-frame'])
      for (const token of surfaceFamily) {
        expect(frameL, `background-frame vs ${token}`).toBeLessThan(lstar(dark[token]))
      }
    })
  })
})
