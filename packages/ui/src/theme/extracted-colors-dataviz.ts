/**
 * Data-viz / status / brand fills, re-homed onto the color foundations (TD-05.09).
 *
 * Phase 1 extracted these as verbatim hex out of custom Workout / Treemap /
 * Scatter components. Phase 2 (this file) repoints them onto the canonical
 * tokens — the ordered categorical palette and the primitive ramps — so they
 * move with the system instead of drifting as private constants.
 */

import { categoricalPalette, primitiveRamps as ramp } from './tokens/primitives'

/**
 * Titan categorical fallback palette shared by Treemap and Scatter — now the
 * canonical {@link categoricalPalette} (ordered, nested-stable, CVD-safe).
 * Components index into it modulo length, so the 7-color series is sufficient.
 */
export const DATAVIZ_CATEGORICAL_PALETTE = categoricalPalette.default

/**
 * MesoCard / MesoStatusCard 3px top-accent gradient stops (dark → primary →
 * light), on the orange ramp that brand-primary (orange-400) lives in.
 */
export const MESO_ACCENT_GRADIENT_DARK = ramp.orange[500] // #DA5F00
export const MESO_ACCENT_GRADIENT_LIGHT = ramp.orange[300] // #FFA063

/**
 * WorkoutPill "deload" status color — re-homed from the orphan violet #9333EA
 * onto magenta-600 (the deload hue in the categorical redesign).
 */
export const WORKOUT_PILL_DELOAD = ramp.magenta[600] // #BA2996
