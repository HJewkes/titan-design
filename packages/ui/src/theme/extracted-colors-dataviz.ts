/**
 * Data-viz / status / brand fills, sourced from the color foundations.
 */

import { primitiveRamps as ramp } from './tokens/primitives'

/**
 * Semantic roles of the categorical fallback palette shared by Treemap and
 * Scatter. Components resolve them against the active theme and index modulo length.
 */
export const DATAVIZ_CATEGORICAL_ROLES = [
  'dataviz-categorical-0',
  'dataviz-categorical-1',
  'dataviz-categorical-2',
  'dataviz-categorical-3',
  'dataviz-categorical-4',
  'dataviz-categorical-5',
  'dataviz-categorical-6',
] as const

/**
 * MesoCard / MesoStatusCard 3px top-accent gradient stops (dark → primary →
 * light), on the orange ramp that brand-primary (orange-400) lives in.
 */
export const MESO_ACCENT_GRADIENT_DARK = ramp.orange[500]
export const MESO_ACCENT_GRADIENT_LIGHT = ramp.orange[300]

export const WORKOUT_PILL_DELOAD = ramp.magenta[600]
