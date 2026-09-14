/**
 * Workout-specific tokens not yet in the main Tailwind config.
 * Use these inline instead of Tailwind classes.
 */
import { sequentialEffort, primitiveRamps as ramp } from './tokens/primitives'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

export const WORKOUT_TOKENS = {
  // Canonical 4-band performance scale — the single source for BOTH the
  // VelocityStrip zone bars and the SetRow RPE color (TD-03.43). The direction
  // is intentionally inverted between the two consumers: for velocity, green =
  // fastest/best; for RPE, green = easiest. This is the [0,2,3,4] subsample of
  // the canonical `sequentialEffort` primitive: an EVEN hue walk across the ramp
  // (green → gold → orange → red). The earlier [0,1,2,4] spent two of its four
  // bands on adjacent yellows (amber-200 + amber-300) and skipped orange, reading
  // yellow-heavy with an abrupt jump to red; sampling amber-300 + orange-400
  // instead gives four cleanly separable bands that hold at 3px strip scale.
  // Consumed inline (RN).
  scale: {
    green: sequentialEffort[0], // green-300
    yellow: sequentialEffort[2], // amber-300 (gold)
    orange: sequentialEffort[3], // orange-400 (true orange)
    red: sequentialEffort[4], // red-600
  },

  // Badge border-radius (rounded-sm is 4px, we need 2px)
  badgeRadius: 2,

  // Surface and border colors were removed here: those flip with the theme, so
  // components use the CSS custom properties (var(--color-surface-*/border-*))
  // directly. Only theme-independent data-viz values remain below.

  // Intensity bar specific — over-target tiers deepen along the red ramp.
  intensity: {
    track: '#333333',
    over1: ramp.red[600], // matches status-error
    over2: ramp.red[700],
    over3: ramp.red[800],
    targetLine: 'rgba(33, 150, 243, 0.5)',
    atTargetGlow: '0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15)',
  },

  // Deviation bar
  deviation: {
    track: '#333333',
  },
} as const

/** The five diverging volume meanings, plus the no-data fill. */
export interface HeatmapColors {
  none: string
  under: string
  maintenance: string
  productive: string
  approaching: string
  over: string
}

/**
 * BodyMap volume heatmap for a theme mode — the `dataviz-diverging-*` roles
 * (under → optimal → over): a true diverging shape with a light green center,
 * cool-blue under-trained end and warm-red over-reaching end (colorblind-robust
 * in lightness).
 *
 * A FUNCTION of mode rather than a frozen map (VW-371). The five meanings are
 * fixed; which hex each one paints is the theme's business, so a consumer
 * resolves it at render time from the nearest Surface. Dark and light hold the
 * same values today — phase 2 tunes the light column.
 */
export function heatmapColors(mode: ThemeMode): HeatmapColors {
  const c = getSemanticColors(mode)
  return {
    none: '#E0E0E0', // no training data — not a palette stop, so not a dataviz role
    under: c['dataviz-diverging-0'], // below MEV
    maintenance: c['dataviz-diverging-1'], // MEV to MAV
    productive: c['dataviz-diverging-2'], // optimal center — MAV to MRV
    approaching: c['dataviz-diverging-3'], // near MRV
    over: c['dataviz-diverging-4'], // over MRV
  }
}
