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
  // the canonical `sequentialEffort` primitive. The `orange` key is the band
  // label. Consumed inline (RN).
  scale: {
    green: sequentialEffort[0],
    yellow: sequentialEffort[1],
    orange: sequentialEffort[2], // gold band
    red: sequentialEffort[4],
  },

  // BodyMap volume heatmap — the canonical `divergingScale` (under → optimal →
  // over): a true diverging shape with a light green center, cool-blue under-
  // trained end and warm-red over-reaching end (colorblind-robust in lightness).
  heatmap: {
    none: '#E0E0E0', // no training data
    under: divergingScale[0], // below MEV
    maintenance: divergingScale[1], // MEV to MAV
    productive: divergingScale[2], // optimal center — MAV to MRV
    approaching: divergingScale[3], // near MRV
    over: divergingScale[4], // over MRV
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
