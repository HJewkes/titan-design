/**
 * Semantic Design Tokens
 *
 * Meaningful tokens following DTCG (Design Tokens Community Group) naming conventions.
 * Pattern: {category}-{intent}-{variant?}-{state?}
 *
 * Categories:
 * - brand-* : Brand colors (primary, secondary, accent)
 * - status-* : Feedback colors (success, error, warning, info)
 * - result-* : Outcome indicators (improve, degrade, inconclusive, neutral)
 * - data-* : Data visualization colors (chart series)
 * - on-* : Text on colored backgrounds
 * - surface-* : Elevated containers (NOT "paper")
 * - background-* : Page backgrounds
 * - text-* : Text colors
 * - border-* : Border colors
 * - interactive-* : Hover/focus/active/disabled states
 */

import { primitiveColors as p, primitiveRamps as ramp, greyRamp, discreteRainbow } from './primitives'

/**
 * GREY MAPPING (TD-07.14) — how the old cool scales resolved onto `greyRamp`.
 *
 * Every grey below came off `grey` (pure R=G=B) or `neutral` (cool, R−B
 * down to −26). They were snapped by NEAREST L*, not by matching step numbers,
 * because the two old scales were numbered incompatibly: `grey` ran
 * INVERTED and compressed (0 = #6E6E6E lightest, 900 = #101010 darkest), so
 * `grey[400]` and `greyRamp[400]` have nothing to do with each other.
 *
 *   grey 200→800  300→900  400→925  500→950
 *   neutral   50→50   100→100  300→200  400→400  500→600  600→700  900→950
 *
 * Surfaces move ΔE 1.9–4.8 — at or near imperceptible. The TEXT roles move
 * further (8.6–12.8), and that is the intended part of the change: they are
 * picking up the warmth the surfaces already had.
 *
 * Light gets its own column because strict L*-nearest collapsed `neutral[50]`
 * and `[100]` onto one step, flattening surface-elevated into surface-raised.
 * Light is still deferred as a design question — there is no `surfaceRampLight`.
 *
 * `border-default`, `-subtle` and `-strong` are GONE, replaced by `hairline-*`.
 * Once the planes became ramp steps, every value dark enough to read as a
 * border was also a plane's fill. Alpha composites instead of colliding.
 *
 * `text-tertiary` on dark is the one role that ignores L*-nearest; see it.
 */

// Light mode semantic colors (default)
export const semanticColorsLight = {
  // Brand colors (brand-*)
  'brand-primary': ramp.orange[400],
  'brand-primary-light': ramp.orange[300],
  'brand-primary-dark': ramp.orange[500],
  'brand-primary-subtle': 'rgba(255, 121, 0, 0.08)',
  'brand-primary-hover': ramp.orange[500],
  'brand-primary-active': ramp.orange[600],

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': 'rgba(48, 123, 155, 0.08)',
  'brand-secondary-hover': ramp.cyan[700],
  'brand-secondary-active': ramp.cyan[800],

  // Text on brand backgrounds (on-*)
  'on-brand-primary': p.white,
  'on-brand-secondary': p.white,

  // Status colors (status-*)
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': ramp.green[50],

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  'status-error-subtle': ramp.red[50],

  'status-error-vivid': ramp.red[600],     // vivid alert red
  'status-error-vivid-light': ramp.red[500],
  'status-error-vivid-dark': ramp.red[700],
  'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',

  'status-warning': ramp.amber[300],
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[500],
  'status-warning-subtle': ramp.amber[50],

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': ramp.blue[50],

  // Text on status backgrounds (on-status-*)
  'on-status-success': p.white,
  'on-status-error': p.white,
  'on-status-warning': p.white,
  'on-status-info': p.white,

  // Result/outcome indicators (result-*)
  'result-improve': '#4caf50',                // Green - positive outcome
  'result-improve-light': 'rgba(76, 175, 80, 0.12)',
  'result-improve-dark': '#248a24',
  'result-degrade': '#ef5350',                // Red - negative outcome
  'result-degrade-light': 'rgba(239, 83, 80, 0.12)',
  'result-degrade-dark': '#b30000',
  'result-inconclusive': '#9E9A97',           // Gray - no clear result
  'result-inconclusive-light': 'rgba(158, 154, 151, 0.12)',
  'result-neutral': greyRamp[600],           // Neutral baseline

  // Text on result backgrounds (on-result-*)
  'on-result-improve': p.white,
  'on-result-degrade': p.white,
  'on-result-inconclusive': p.white,

  // Data visualization colors (data-*)
  // First 10 colors from discrete rainbow optimized for charts
  'data-1': discreteRainbow[9],               // Blue
  'data-2': discreteRainbow[14],              // Green
  'data-3': discreteRainbow[17],              // Yellow
  'data-4': discreteRainbow[25],              // Red
  'data-5': discreteRainbow[8],               // Purple
  'data-6': discreteRainbow[20],              // Orange
  'data-7': discreteRainbow[13],              // Light Blue
  'data-8': discreteRainbow[15],              // Light Green
  'data-9': discreteRainbow[3],               // Lavender
  'data-10': discreteRainbow[22],             // Dark Orange

  // Text colors (text-*)
  'text-primary': '#121828',
  'text-secondary': '#65748B',
  'text-tertiary': greyRamp[400],
  'text-disabled': 'rgba(55, 65, 81, 0.48)',
  'text-inverse': p.white,
  'text-link': ramp.blue[600],
  'text-link-hover': ramp.blue[700],

  // Surface colors (surface-*) - for elevated containers
  'surface-base': p.white,
  'surface-elevated': greyRamp[50],          // slightly off-white for elevated cards
  'surface-raised': greyRamp[100],           // light gray for raised cards
  'surface-overlay': p.white,
  'surface-input': greyRamp[50],             // Input field background (filled variant)

  // Background colors (background-*)
  'background-base': '#EBEBEB',
  'background-default': p.white,
  'background-subtle': greyRamp[50],
  // Frame/bezel chrome — top bar + side nav shell, one step below
  // `background-base`. Placeholder pairing for light mode, which is deferred.
  'background-frame': greyRamp[400],

  // Border colors (border-*)
  'border-prominent': greyRamp[400],        // high-visibility divider
  'border-focus': ramp.blue[600],
  'border-input': greyRamp[200],             // Input field border
  'border-input-hover': greyRamp[400],       // Input field border on hover
  'border-input-focus': ramp.blue[600],          // Input field border on focus
  'border-input-error': ramp.red[600],           // Input field border on error

  // Alpha hairline separators (surface-independent — composite toward black on
  // light surfaces, mirroring the dark-mode white-alpha family). See §4/S-2.
  'hairline-subtle': 'rgba(0, 0, 0, 0.06)',
  'hairline-default': 'rgba(0, 0, 0, 0.09)',
  'hairline-strong': 'rgba(0, 0, 0, 0.14)',

  // Interactive states (interactive-*)
  'interactive-hover': 'rgba(55, 65, 81, 0.04)',
  'interactive-focus': 'rgba(55, 65, 81, 0.12)',
  'interactive-active': 'rgba(55, 65, 81, 0.16)',
  'interactive-selected': 'rgba(55, 65, 81, 0.08)',
  'interactive-disabled': 'rgba(55, 65, 81, 0.12)',
  'interactive-disabled-text': 'rgba(55, 65, 81, 0.26)',

  // Divider
  'divider': '#E8E9EB',

  // Avatar default
  'avatar-background': greyRamp[600],
  'avatar-text': p.white,
} as const

// Dark mode semantic colors
export const semanticColorsDark = {
  // Brand colors stay the same in dark mode
  'brand-primary': ramp.orange[400],
  'brand-primary-light': ramp.orange[300],
  'brand-primary-dark': ramp.orange[500],
  'brand-primary-subtle': 'rgba(255, 121, 0, 0.12)',
  'brand-primary-hover': ramp.orange[300],
  'brand-primary-active': ramp.orange[200],

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': 'rgba(48, 123, 155, 0.12)',
  'brand-secondary-hover': ramp.cyan[500],
  'brand-secondary-active': ramp.cyan[400],

  // Text on brand backgrounds
  'on-brand-primary': p.white,
  'on-brand-secondary': p.white,

  // Status colors
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': 'rgba(46, 213, 115, 0.12)',

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  'status-error-subtle': 'rgba(209, 67, 67, 0.12)',

  'status-error-vivid': ramp.red[600],
  'status-error-vivid-light': ramp.red[500],
  'status-error-vivid-dark': ramp.red[700],
  'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',

  'status-warning': ramp.amber[300],
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[500],
  'status-warning-subtle': 'rgba(249, 180, 21, 0.12)',

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': 'rgba(33, 150, 243, 0.12)',

  // Text on status backgrounds
  'on-status-success': p.white,
  'on-status-error': p.white,
  'on-status-warning': p.white,
  'on-status-info': p.white,

  // Result/outcome indicators (result-*)
  'result-improve': '#4caf50',
  'result-improve-light': 'rgba(76, 175, 80, 0.16)',
  'result-improve-dark': '#248a24',
  'result-degrade': '#ef5350',
  'result-degrade-light': 'rgba(239, 83, 80, 0.16)',
  'result-degrade-dark': '#b30000',
  'result-inconclusive': '#9E9A97',
  'result-inconclusive-light': 'rgba(158, 154, 151, 0.16)',
  'result-neutral': greyRamp[400],

  // Text on result backgrounds
  'on-result-improve': p.white,
  'on-result-degrade': p.white,
  'on-result-inconclusive': p.white,

  // Data visualization colors (same in dark mode for consistency)
  'data-1': discreteRainbow[9],
  'data-2': discreteRainbow[14],
  'data-3': discreteRainbow[17],
  'data-4': discreteRainbow[25],
  'data-5': discreteRainbow[8],
  'data-6': discreteRainbow[20],
  'data-7': discreteRainbow[13],
  'data-8': discreteRainbow[15],
  'data-9': discreteRainbow[3],
  'data-10': discreteRainbow[22],

  // Text colors - inverted for dark mode
  'text-primary': greyRamp[50],
  'text-secondary': greyRamp[400],
  // Deliberately ONE step lighter than the L*-nearest match (`greyRamp[600]`).
  // The colour this replaced failed WCAG large-text outright on the three
  // lightest planes — 2.96 / 2.72 / 2.49 against elevated / raised / overlay —
  // and `600` carried that failure forward almost exactly (2.93 / 2.70 / 2.47).
  // `500` clears 3:1 everywhere (3.32–5.34). Contrast beats colour fidelity for
  // text roles; borders and surfaces still use strict L*-nearest. See
  // semantic-contrast.test.ts, which fails if this is moved back down.
  'text-tertiary': greyRamp[500],
  'text-disabled': 'rgba(255, 255, 255, 0.38)',
  'text-inverse': greyRamp[950],
  'text-link': '#828DF8',
  'text-link-hover': ramp.blue[400],

  // Surface colors - dark backgrounds — warm-tapered DERIVED ramp (TD-surface-tokens,
  // S-1, re-spaced S-3). Shipped verbatim from `deriveSurfaceRamp()` — see
  // `surfaceRampDark` in primitives.ts for the full derivation note. `surface-overlay`
  // and `surface-elevated` are distinct (were both #191919 pre-S-1); `surface-input`
  // tracks one plane above `surface-base`, same relative position as before the remap.
  // `background-base` backs `Surface level="background"` (SurfaceContext.SURFACE_LEVEL_TOKEN),
  // so it takes the ramp's shell role. The deepest plane is `background-frame`,
  // which is also the `SurfaceLevel` floor a pressed surface clamps at.
  'surface-base': greyRamp[925],           // main surface        (#252321, L*13.9)
  'surface-elevated': greyRamp[900],       // elevated surface     (#2C2A28, L*17.2 — nav/rail)
  'surface-raised': greyRamp[875],         // raised surface       (#31302F, L*19.9 — cards)
  'surface-overlay': greyRamp[850],        // overlay surface      (#373635, L*22.7 — hero/popover)
  'surface-input': greyRamp[900],          // input surface        (#2C2A28 — one plane above base)

  // Background colors — same ramp, the frame/shell end of it.
  'background-base': greyRamp[950],        // shell                (#1C1916, L*9   — Surface level="background")
  'background-default': greyRamp[925],     // main background      (#252321, L*13.9 — matches surface-base)
  'background-subtle': greyRamp[900],      // subtle background    (#2C2A28, L*17.2 — matches surface-elevated)
  // Frame/bezel chrome — the top bar + side nav shell, one step BELOW
  // `background-base`. It used to be described as sitting OUTSIDE the ramp; it
  // is simply the ramp's last step now, and the floor `<Surface pressed>` clamps at.
  'background-frame': greyRamp[975],       // frame / bezel        (#100D0A, L*3.8)

  // Border colors — solid dark borders are RETIRED (TD-07.14). Not a preference — a structural
  // consequence of one ramp. Every step from 850 to 975 is now a surface plane,
  // so a solid border dark enough to read as a border necessarily equals some
  // plane's fill, which is exactly the collision `surface.contract.test.ts` R2
  // forbids. The only non-plane steps left in that band are 800 and 700, and
  // borders there jump from L*~10-25 to L*~28-38 — a restyle, not a migration.
  //
  // So separation moves to the alpha hairlines, which dark mode already called
  // "the primary separation cue". Being alpha, they composite against whatever
  // plane they land on and cannot collide with any of them — the problem stops
  // existing rather than being re-solved per plane. The three solid tokens were
  // deleted outright; consumers point at the `hairline-*` family below.
  //
  // `border-prominent` stays SOLID: it is the one border meant to be seen
  // outright (4 call sites, high-visibility dividers), and grey-800 is not a
  // plane, so it keeps its job without collision.
  'border-prominent': greyRamp[800],     // high-visibility divider
  'border-focus': '#828DF8',
  'border-input': greyRamp[700],
  'border-input-hover': greyRamp[600],
  'border-input-focus': '#828DF8',
  'border-input-error': ramp.red[500],

  // Alpha hairline separators — the primary separation cue (§4/S-2). Self-
  // normalizing: composites toward white by ~the same amount on ANY plane, so
  // one family works at every elevation instead of per-surface border tokens.
  // Shadows are demoted to floating-overlay use only (not shipped as a fill
  // separator here — see elevation.ts, follow-up S-4).
  'hairline-subtle': 'rgba(255, 255, 255, 0.06)',
  'hairline-default': 'rgba(255, 255, 255, 0.09)',
  'hairline-strong': 'rgba(255, 255, 255, 0.14)',

  // Interactive states
  'interactive-hover': 'rgba(255, 255, 255, 0.04)',
  'interactive-focus': 'rgba(255, 255, 255, 0.12)',
  'interactive-active': 'rgba(255, 255, 255, 0.16)',
  'interactive-selected': 'rgba(255, 255, 255, 0.08)',
  'interactive-disabled': 'rgba(255, 255, 255, 0.12)',
  'interactive-disabled-text': 'rgba(255, 255, 255, 0.26)',

  // Divider
  'divider': 'rgba(255, 255, 255, 0.09)',

  // Avatar default
  'avatar-background': greyRamp[700],
  'avatar-text': p.white,
} as const

// Typography tokens matching existing app
export const semanticTypography = {
  // Headings (Space Grotesk)
  h1: {
    fontFamily: 'heading',
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h2: {
    fontFamily: 'heading',
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h3: {
    fontFamily: 'heading',
    fontSize: '2.25rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h4: {
    fontFamily: 'heading',
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h5: {
    fontFamily: 'heading',
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.375,
  },
  h6: {
    fontFamily: 'heading',
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.375,
  },

  // Body text (Nunito Sans)
  body1: {
    fontFamily: 'body',
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontFamily: 'body',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.57,
  },
  subtitle1: {
    fontFamily: 'body',
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.75,
  },
  subtitle2: {
    fontFamily: 'body',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
  },
  caption: {
    fontFamily: 'body',
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
  },
  overline: {
    fontFamily: 'body',
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 2.5,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: 'sans',
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
  },
} as const

// Button size tokens
export const buttonSizes = {
  sm: {
    paddingX: '16px',
    paddingY: '6px',
    fontSize: '0.875rem',
  },
  md: {
    paddingX: '20px',
    paddingY: '8px',
    fontSize: '0.875rem',
  },
  lg: {
    paddingX: '24px',
    paddingY: '11px',
    fontSize: '1rem',
  },
} as const

// Export type for theme mode
export type ThemeMode = 'light' | 'dark'

// Helper to get semantic colors based on mode
export function getSemanticColors(mode: ThemeMode) {
  return mode === 'dark' ? semanticColorsDark : semanticColorsLight
}
