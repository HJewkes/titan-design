/**
 * Workout-specific tokens not yet in the main Tailwind config.
 * Use these inline instead of Tailwind classes.
 */
import { divergingScale, sequentialEffort, primitiveRamps as ramp } from './tokens/primitives'

export const WORKOUT_TOKENS = {
  // Canonical 4-band performance scale — the single source for BOTH the
  // VelocityStrip zone bars and the SetRow RPE color (TD-03.43). The direction
  // is intentionally inverted between the two consumers: for velocity, green =
  // fastest/best; for RPE, green = easiest. This is the [0,1,2,4] subsample of
  // the canonical `sequentialEffort` primitive — it walks the two ambers
  // (green-300 · amber-200 · amber-300 · red-600) to mirror the legacy strip's
  // golden third stop rather than jumping to the pure orange. The `orange` key
  // is the band label; its value is the gold amber-300. Consumed inline (RN).
  scale: {
    green: sequentialEffort[0], // green-300 #2ED573
    yellow: sequentialEffort[1], // amber-200 #FFD352
    orange: sequentialEffort[2], // amber-300 #F9B415 (gold band)
    red: sequentialEffort[4], // red-600 #D14343
  },

  // BodyMap volume heatmap — the canonical `divergingScale` (under → optimal →
  // over): a true diverging shape with a light green center, cool-blue under-
  // trained end and warm-red over-reaching end (colorblind-robust in lightness).
  heatmap: {
    none: '#E0E0E0', // gray — no training data
    under: divergingScale[0], // blue-700 — below MEV
    maintenance: divergingScale[1], // cyan-400 — MEV to MAV
    productive: divergingScale[2], // green-300 (optimal center) — MAV to MRV
    approaching: divergingScale[3], // orange-500 — near MRV
    over: divergingScale[4], // red-700 — over MRV
  },

  // Badge border-radius (rounded-sm is 4px, we need 2px)
  badgeRadius: 2,

  // Surface and border colors were removed here: those flip with the theme, so
  // components use the CSS custom properties (var(--color-surface-*/border-*))
  // directly. Only theme-independent data-viz values remain below.

  // Intensity bar specific — over-target tiers deepen along the red ramp.
  intensity: {
    track: '#333333',
    over1: ramp.red[600], // #D14343 (matches status-error)
    over2: ramp.red[700], // #A4221C
    over3: ramp.red[800], // #7E1002
    targetLine: 'rgba(33, 150, 243, 0.5)',
    atTargetGlow:
      '0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15)',
  },

  // Placeholder strip
  placeholder: {
    fill: '#3A3A3A',
  },

  // Deviation bar
  deviation: {
    track: '#333333',
  },
} as const
