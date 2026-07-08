/**
 * UI-atom fills, sourced from the color foundations.
 */

import { categoricalPalette, primitiveRamps as ramp } from './tokens/primitives'

/**
 * Spinner `color="primary"` fill — keeps the spinner a cool, on-palette
 * loading accent.
 */
export const SPINNER_PRIMARY = ramp.cyan[600]

export const SPINNER_SECONDARY = ramp.green[400]

/**
 * Categorical avatar palette — deterministic per-name fill, the canonical
 * ordered {@link categoricalPalette} (CVD-safe). Order is preserved for stable
 * hashing.
 */
export const AVATAR_CATEGORICAL_COLORS = categoricalPalette.default
