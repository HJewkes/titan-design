/**
 * Extracted data-viz / status / brand colors (Phase 1 audit staging).
 *
 * These are chromatic fills that were previously inlined as raw hex literals
 * inside custom Workout / Treemap / Scatter / Gauge components and do NOT map
 * to an existing semantic token. They are captured here at their EXACT current
 * values (a provable no-op) so the color-foundations redesign can audit and
 * re-home them next. Values that DO map to a semantic token were referenced
 * directly (via `getSemanticColors('dark')[…]`) instead of duplicated here, and
 * values already centralized in `workout-tokens.ts` (scale / intensity /
 * heatmap) continue to be referenced from `WORKOUT_TOKENS`.
 *
 * Do not redesign these values here — extraction only.
 */

/**
 * Titan categorical fallback palette shared verbatim by Treemap and Scatter.
 * NOTE: the components labelled this "data-1..data-8", but the values are a
 * private palette that does NOT match the `data-*` semantic tokens
 * (data-1 = #1965B0, etc.). Three entries coincide with existing tokens
 * (#14B8A6 = status-success, #406D87 = brand-secondary, #43C6B7 =
 * status-success-light); they are kept inline so the categorical scale stays a
 * single cohesive unit. Future candidate: promote to a canonical `dataviz-cat-*`
 * scale (or reconcile with `data-*`).
 */
export const DATAVIZ_CATEGORICAL_PALETTE = [
  '#5B9BD5', // blue
  '#14B8A6', // teal  (== status-success)
  '#F4A736', // amber-orange (== data-6 token value)
  '#F83030', // red
  '#823CA0', // purple
  '#D4A520', // gold
  '#406D87', // steel (== brand-secondary)
  '#43C6B7', // light teal (== status-success-light)
] as const

/**
 * MesoCard / MesoStatusCard 3px top-accent gradient stops (dark -> primary ->
 * light). The dark and light stops are bespoke orange shades that do NOT match
 * the brand-primary-dark (#D0620C) or brand-primary-light (#FF9630) tokens; the
 * middle stop is brand-primary (#FF7900) and is referenced from the token.
 * Future candidate: a `brand-primary-gradient-{dark,light}` token pair.
 */
export const MESO_ACCENT_GRADIENT_DARK = '#C45E00'
export const MESO_ACCENT_GRADIENT_LIGHT = '#FFB066'

/**
 * WorkoutPill "deload" status color — a purple with no semantic equivalent.
 * Also appears as rgba(147,51,234,…) tints for the pill bg/border (left inline).
 * Future candidate: a `status-deload` (or `result-deload`) token.
 */
export const WORKOUT_PILL_DELOAD = '#9333ea'
