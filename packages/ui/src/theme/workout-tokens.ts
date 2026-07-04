/**
 * Workout-specific tokens not yet in the main Tailwind config.
 * Use these inline instead of Tailwind classes.
 */
export const WORKOUT_TOKENS = {
  // Canonical 4-band performance scale — the single source for BOTH the
  // VelocityStrip zone bars and the SetRow RPE color (TD-03.43). The direction
  // is intentionally inverted between the two consumers: for velocity, green =
  // fastest/best; for RPE, green = easiest. Each component maps its own
  // thresholds onto these four colors. Kept as vivid data-viz values (distinct
  // from the muted status tokens) and theme-independent, so — like the heatmap
  // scale below — they are consumed inline as a JS import rather than CSS vars.
  // A JS import also resolves on native RN, unlike var(--…) strings.
  scale: {
    green: '#2ed573',
    yellow: '#ffd43b',
    orange: '#ffa502',
    red: '#ff4757',
  },

  // BodyMap volume heatmap scale (drive dynamic SVG fills, so inline values).
  // Maps weekly-volume status against MEV/MAV/MRV landmarks to a fill color.
  heatmap: {
    none: '#E0E0E0', // gray — no training data
    under: '#4A90D9', // cool blue — below MEV
    maintenance: '#F5C842', // warm yellow — MEV to MAV
    productive: '#4CAF50', // green — MAV to MRV
    approaching: '#FFA502', // orange — near MRV
    over: '#FF6B35', // red-orange — over MRV
  },

  // Badge border-radius (rounded-sm is 4px, we need 2px)
  badgeRadius: 2,

  // Surface and border colors were removed here: those flip with the theme, so
  // components use the CSS custom properties (var(--color-surface-*/border-*))
  // directly. Only theme-independent data-viz values remain below.

  // Intensity bar specific
  intensity: {
    track: '#333333',
    over1: '#D14343',
    over2: '#A62626',
    over3: '#7A1C1C',
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
