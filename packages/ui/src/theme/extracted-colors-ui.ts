/**
 * Extracted UI-atom colors (color-foundations audit — Phase 1)
 *
 * Chromatic data/status/brand/accent fills that were hardcoded inside atom
 * components in `components/ui/**` and had NO clean semantic-token equivalent
 * at their current rendered value. They are centralized here VERBATIM (no
 * value change) so a later phase can decide their canonical tokens.
 *
 * These are intentionally NOT theme-switching: each atom currently renders a
 * fixed hex regardless of light/dark, so referencing a theme-aware semantic
 * token (via `resolveColor`) would change behavior on web. Keep them as static
 * hex until the redesign phase reassigns them.
 *
 * Chromatic values that DID match a stable semantic token were referenced via
 * `resolveColor(...)` in-place instead and do not appear here.
 */

/**
 * Spinner `color="primary"` fill.
 * Provenance: `components/ui/spinner/Spinner.tsx` colorMap.primary.
 * Equals primitive `blue.600` (#5048E5). Used in semantic tokens only in LIGHT
 * mode (text-link / border-focus); dark mode maps those to #828DF8, so no
 * dark-default token reproduces this static value.
 */
export const SPINNER_PRIMARY = '#5048E5'

/**
 * Spinner `color="secondary"` fill.
 * Provenance: `components/ui/spinner/Spinner.tsx` colorMap.secondary.
 * Equals primitive `green.500` (#10B981, emerald). No semantic token resolves
 * to this — the vivid/teal success tokens are different greens.
 */
export const SPINNER_SECONDARY = '#10B981'

/**
 * Categorical avatar palette — deterministic per-name fill.
 * Provenance: `utils/avatar-color.ts` AVATAR_COLORS.
 * A 7-color qualitative set (order preserved for stable hashing). None of these
 * map to existing semantic/data tokens; centralized as a candidate canonical
 * categorical set for the redesign phase.
 */
export const AVATAR_CATEGORICAL_COLORS = [
  '#FF6B6B', // coral / red
  '#4ECDC4', // turquoise
  '#45B7D1', // sky blue
  '#96CEB4', // sage green
  '#FFEAA7', // pale yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
] as const
