/**
 * Data-viz / status / brand fills, sourced from the color foundations.
 */

import { categoricalPalette, primitiveRamps as ramp } from './tokens/primitives'

/**
 * Titan categorical fallback palette shared by Treemap and Scatter — the
 * canonical {@link categoricalPalette} (ordered, nested-stable, CVD-safe).
 * Components index into it modulo length, so the 7-color series is sufficient.
 */
export const DATAVIZ_CATEGORICAL_PALETTE = categoricalPalette.default

/**
 * MesoCard / MesoStatusCard 3px top-accent gradient stops (dark → primary →
 * light), on the orange ramp that brand-primary (orange-400) lives in.
 */
export const MESO_ACCENT_GRADIENT_DARK = ramp.orange[500]
export const MESO_ACCENT_GRADIENT_LIGHT = ramp.orange[300]

export const WORKOUT_PILL_DELOAD = ramp.magenta[600]
