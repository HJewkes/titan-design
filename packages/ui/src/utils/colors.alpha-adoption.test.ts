import { describe, it, expect } from 'vitest'
import { alpha } from './colors'
import { getSemanticColors } from '../theme/tokens/semantic'
import { primitiveColors } from '../theme/tokens/primitives'

/**
 * VW-78: every `rgba(...)` literal swapped for `alpha(<resolved token>, opacity)`
 * across the functional-colour baseline files must resolve to the exact same
 * colour it replaced. Table-driven rather than per-component render tests: the
 * literal each row replaced is recorded alongside the new `alpha()` call built
 * from the same tokens the component now imports, so a regression in either the
 * token value or `alpha()` itself fails here without needing a DOM render per
 * touched component.
 *
 * Comparison is on PARSED (r, g, b, a) rather than raw strings — `alpha()`
 * doesn't reproduce a source literal's decimal formatting (`0.10` -> `0.1`,
 * `0.20` -> `0.2`), and that difference is not a colour difference: both
 * strings parse to the identical rgba() the browser paints.
 */

function parseRgba(value: string): [number, number, number, number] {
  const m = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s]+([\d.]+))?\s*\)/)
  if (!m) throw new Error(`Not an rgb()/rgba() value: ${value}`)
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
}

/**
 * `alphaTolerance` accommodates `.toFixed(3)`-rounded originals (MesoCard's
 * dynamic heatmap opacity): the rounding itself can differ from the exact
 * value by up to 0.0005, which is not a colour difference.
 */
function expectSameColor(actual: string, original: string, alphaTolerance = 1e-6) {
  const [ar, ag, ab, aa] = parseRgba(actual)
  const [or_, og, ob, oa] = parseRgba(original)
  expect([ar, ag, ab]).toEqual([or_, og, ob])
  expect(Math.abs(aa - oa)).toBeLessThanOrEqual(alphaTolerance)
}

const dark = getSemanticColors('dark')
const BRAND_PRIMARY = dark['brand-primary']

describe('alpha() adoption (VW-78) — swapped literal parity', () => {
  const staticCases: Array<{ label: string; original: string; swapped: string }> = [
    // Gauge.tsx
    {
      label: 'Gauge TRACK',
      original: 'rgba(255,255,255,0.08)',
      swapped: alpha(primitiveColors.white, 0.08),
    },
    // Scatter.tsx
    {
      label: 'Scatter GRID_LINE',
      original: 'rgba(255,255,255,0.07)',
      swapped: alpha(primitiveColors.white, 0.07),
    },
    {
      label: 'Scatter AXIS_LINE',
      original: 'rgba(255,255,255,0.18)',
      swapped: alpha(primitiveColors.white, 0.18),
    },
    {
      label: 'Scatter DIAGONAL_LINE',
      original: 'rgba(255,255,255,0.28)',
      swapped: alpha(primitiveColors.white, 0.28),
    },
    // BaseBadge.tsx
    {
      label: 'BaseBadge pr.bg',
      original: 'rgba(255, 121, 0, 0.12)',
      swapped: alpha(dark['brand-primary'], 0.12),
    },
    {
      label: 'BaseBadge pr.border',
      original: 'rgba(255, 121, 0, 0.3)',
      swapped: alpha(dark['brand-primary'], 0.3),
    },
    // BodyMap.tsx
    {
      label: 'BodyMap OUTLINE_FILL',
      original: 'rgba(255,255,255,0.08)',
      swapped: alpha(primitiveColors.white, 0.08),
    },
    {
      label: 'BodyMap OUTLINE_BORDER',
      original: 'rgba(255,255,255,0.12)',
      swapped: alpha(primitiveColors.white, 0.12),
    },
    {
      label: 'BodyMap toggle active bg',
      original: 'rgba(255,121,0,0.16)',
      swapped: alpha(BRAND_PRIMARY, 0.16),
    },
    // BodyMapDetailPanel.tsx
    {
      label: 'BodyMapDetailPanel bg',
      original: 'rgba(255,121,0,0.12)',
      swapped: alpha(BRAND_PRIMARY, 0.12),
    },
    {
      label: 'BodyMapDetailPanel border',
      original: 'rgba(255,121,0,0.3)',
      swapped: alpha(BRAND_PRIMARY, 0.3),
    },
    // CapacityBandChart.tsx
    {
      label: 'CapacityBandChart BAND_FILL',
      original: 'rgba(46,213,115,0.1)',
      swapped: alpha(dark['status-success'], 0.1),
    },
    {
      label: 'CapacityBandChart BAND_EDGE',
      original: 'rgba(46,213,115,0.45)',
      swapped: alpha(dark['status-success'], 0.45),
    },
    {
      label: 'CapacityBandChart PROJECTION_FILL',
      original: 'rgba(46,213,115,0.05)',
      swapped: alpha(dark['status-success'], 0.05),
    },
    // DeviationBar.tsx (grey stop at 50% has no token match and stays raw — not listed here)
    {
      label: 'DeviationBar gradient success stop',
      original: 'rgba(46,213,115,0.25)',
      swapped: alpha(dark['status-success'], 0.25),
    },
    {
      label: 'DeviationBar gradient warning stop',
      original: 'rgba(249,180,21,0.25)',
      swapped: alpha(dark['status-warning'], 0.25),
    },
    // ExerciseDetailPage.tsx
    {
      label: 'ExerciseDetailPage e1rm bg',
      original: 'rgba(255,121,0,0.10)',
      swapped: alpha(BRAND_PRIMARY, 0.1),
    },
    {
      label: 'ExerciseDetailPage e1rm border',
      original: 'rgba(255,121,0,0.25)',
      swapped: alpha(BRAND_PRIMARY, 0.25),
    },
    // IntensityBar.tsx
    {
      label: 'IntensityBar TARGET_LINE_COLOR',
      original: 'rgba(33, 150, 243, 0.5)',
      swapped: alpha(dark['status-info'], 0.5),
    },
    // MesoStatusCard.tsx
    {
      label: 'MesoStatusCard gradient success',
      original: 'rgba(46,213,115,0.25)',
      swapped: alpha(dark['status-success'], 0.25),
    },
    {
      label: 'MesoStatusCard gradient warning',
      original: 'rgba(249,180,21,0.25)',
      swapped: alpha(dark['status-warning'], 0.25),
    },
    {
      label: 'MesoStatusCard gradient error',
      original: 'rgba(209,67,67,0.25)',
      swapped: alpha(dark['status-error'], 0.25),
    },
    {
      label: 'MesoStatusCard success.bg',
      original: 'rgba(46,213,115,0.15)',
      swapped: alpha(dark['status-success'], 0.15),
    },
    {
      label: 'MesoStatusCard success.border',
      original: 'rgba(46,213,115,0.3)',
      swapped: alpha(dark['status-success'], 0.3),
    },
    {
      label: 'MesoStatusCard warning.bg',
      original: 'rgba(249,180,21,0.15)',
      swapped: alpha(dark['status-warning'], 0.15),
    },
    {
      label: 'MesoStatusCard warning.border',
      original: 'rgba(249,180,21,0.3)',
      swapped: alpha(dark['status-warning'], 0.3),
    },
    {
      label: 'MesoStatusCard error.bg',
      original: 'rgba(209,67,67,0.15)',
      swapped: alpha(dark['status-error'], 0.15),
    },
    {
      label: 'MesoStatusCard error.border',
      original: 'rgba(209,67,67,0.25)',
      swapped: alpha(dark['status-error'], 0.25),
    },
    {
      label: 'MesoStatusCard gauge center line',
      original: 'rgba(255,255,255,0.3)',
      swapped: alpha(primitiveColors.white, 0.3),
    },
    {
      label: 'MesoStatusCard coaching bg',
      original: 'rgba(249,180,21,0.06)',
      swapped: alpha(dark['status-warning'], 0.06),
    },
    {
      label: 'MesoStatusCard coaching border',
      original: 'rgba(249,180,21,0.15)',
      swapped: alpha(dark['status-warning'], 0.15),
    },
    {
      label: 'MesoStatusCard next-target bg',
      original: 'rgba(46,213,115,0.06)',
      swapped: alpha(dark['status-success'], 0.06),
    },
    {
      label: 'MesoStatusCard next-target border',
      original: 'rgba(46,213,115,0.2)',
      swapped: alpha(dark['status-success'], 0.2),
    },
    // ReadinessCheck.tsx
    {
      label: 'ReadinessCheck BRAND_PRIMARY_SUBTLE',
      original: 'rgba(255,121,0,0.12)',
      swapped: alpha(BRAND_PRIMARY, 0.12),
    },
    // RestTimer.tsx
    {
      label: 'RestTimer add-time bg',
      original: 'rgba(255,255,255,0.06)',
      swapped: alpha(primitiveColors.white, 0.06),
    },
    {
      label: 'RestTimer skip bg',
      original: 'rgba(255,121,0,0.12)',
      swapped: alpha(BRAND_PRIMARY, 0.12),
    },
    // StrengthTrendChart.tsx
    {
      label: 'StrengthTrendChart GRID_LINE',
      original: 'rgba(255,255,255,0.06)',
      swapped: alpha(primitiveColors.white, 0.06),
    },
    {
      label: 'StrengthTrendChart SUCCESS_PILL_BG',
      original: 'rgba(46,213,115,0.10)',
      swapped: alpha(dark['status-success'], 0.1),
    },
    {
      label: 'StrengthTrendChart SUCCESS_PILL_BORDER',
      original: 'rgba(46,213,115,0.20)',
      swapped: alpha(dark['status-success'], 0.2),
    },
    {
      label: 'StrengthTrendChart ERROR_PILL_BG',
      original: 'rgba(209,67,67,0.10)',
      swapped: alpha(dark['status-error'], 0.1),
    },
    {
      label: 'StrengthTrendChart ERROR_PILL_BORDER',
      original: 'rgba(209,67,67,0.20)',
      swapped: alpha(dark['status-error'], 0.2),
    },
    {
      label: 'StrengthTrendChart tooltip borderLeftColor',
      original: 'rgba(255,255,255,0.10)',
      swapped: alpha(primitiveColors.white, 0.1),
    },
    // ToolbarButton.tsx
    {
      label: 'ToolbarButton disabledBg',
      original: 'rgba(255, 255, 255, 0.12)',
      swapped: alpha(primitiveColors.white, 0.12),
    },
  ]

  it.each(staticCases)(
    '$label resolves to the same colour it replaced',
    ({ original, swapped }) => {
      expectSameColor(swapped, original)
    }
  )

  it('covers all 43 static swaps (the 44th, MesoCard, is dynamic and tested below)', () => {
    expect(staticCases).toHaveLength(43)
  })

  describe('MesoCard heatmapColor (dynamic opacity)', () => {
    // Mirrors the original `rgba(255,121,0,${opacity.toFixed(3)})` formula this
    // replaced, at representative percentages.
    function originalHeatmapColor(percentage: number): string {
      const clamped = Math.max(0, Math.min(100, percentage))
      const opacity = 0.12 + (clamped / 100) * 0.78
      return `rgba(255,121,0,${opacity.toFixed(3)})`
    }
    function swappedHeatmapColor(percentage: number): string {
      const clamped = Math.max(0, Math.min(100, percentage))
      const opacity = 0.12 + (clamped / 100) * 0.78
      return alpha(BRAND_PRIMARY, opacity)
    }

    it.each([0, 1, 25, 50, 63, 80, 99, 100])('matches at %i%%', (pct) => {
      expectSameColor(swappedHeatmapColor(pct), originalHeatmapColor(pct), 0.0006)
    })
  })
})
