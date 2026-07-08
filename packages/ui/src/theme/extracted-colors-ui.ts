/**
 * UI-atom fills, re-homed onto the color foundations (TD-05.09).
 *
 * Phase 1 extracted these as verbatim hex out of atom components in
 * `components/ui/**`. Phase 2 (this file) repoints them onto the primitive
 * ramps / categorical palette so they participate in the design system rather
 * than floating as orphan hexes.
 */

import { categoricalPalette, primitiveRamps as ramp } from './tokens/primitives'

/**
 * Spinner `color="primary"` fill — re-homed from the orphan indigo #5048E5 onto
 * the brand-secondary cyan (cyan-600), keeping the spinner a cool, on-palette
 * loading accent.
 */
export const SPINNER_PRIMARY = ramp.cyan[600] // #307B9B

/**
 * Spinner `color="secondary"` fill — re-homed from emerald #10B981 onto the
 * green ramp (green-400).
 */
export const SPINNER_SECONDARY = ramp.green[400] // #21C05D

/**
 * Categorical avatar palette — deterministic per-name fill, now the canonical
 * ordered {@link categoricalPalette} (CVD-safe). Order is preserved for stable
 * hashing.
 */
export const AVATAR_CATEGORICAL_COLORS = categoricalPalette.default
