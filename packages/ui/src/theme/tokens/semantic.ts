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
 * - dataviz-* : The three shipped chart palettes (diverging / sequential / categorical)
 * - on-* : Text on colored backgrounds
 * - surface-* : Elevated containers (NOT "paper")
 * - background-* : Page backgrounds
 * - text-* : Text colors
 * - border-* : Border colors
 * - interactive-* : Hover/focus/active/disabled states
 */

import {
  primitiveColors as p,
  primitiveRamps as ramp,
  greyRamp,
  discreteRainbow,
  alertRedVivid,
  resultPaletteColors,
  semanticPins,
  primitiveSizing,
  categoricalPalette,
  divergingScale,
  sequentialEffort,
} from './primitives'

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
  'brand-primary-muted': 'rgba(255, 121, 0, 0.30)',
  'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
  'brand-primary-hover': ramp.orange[500],
  'brand-primary-active': ramp.orange[600],

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': 'rgba(48, 123, 155, 0.08)',
  'brand-secondary-muted': 'rgba(48, 123, 155, 0.30)',
  'brand-secondary-strong': 'rgba(48, 123, 155, 0.50)',
  'brand-secondary-hover': ramp.cyan[700],
  'brand-secondary-active': ramp.cyan[800],

  // Text on brand backgrounds (on-*)
  'on-brand-primary': p.white,
  'on-brand-secondary': p.white,

  // Text ON a `-subtle` fill. Light mode keeps today's pairing (the base token) so
  // nothing moves here: light has the same disease mirrored — a light rung on a
  // near-white ramp[50] fill — but correcting it belongs with the light-mode pass
  // in AW-121, not this one.
  'on-brand-primary-subtle': ramp.orange[400],
  'on-brand-secondary-subtle': ramp.cyan[600],

  // Status colors (status-*)
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': ramp.green[50],
  'status-success-muted': 'rgba(46, 213, 115, 0.30)',
  'status-success-strong': 'rgba(46, 213, 115, 0.50)',

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  'status-error-subtle': ramp.red[50],
  'status-error-muted': 'rgba(209, 67, 67, 0.30)',
  'status-error-strong': 'rgba(209, 67, 67, 0.50)',

  'status-error-vivid': alertRedVivid, // NOT red[600], that is status-error
  'status-error-vivid-light': ramp.red[500],
  'status-error-vivid-dark': ramp.red[700],
  'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',
  'status-error-vivid-muted': 'rgba(255, 71, 87, 0.30)',
  'status-error-vivid-strong': 'rgba(255, 71, 87, 0.50)',

  'status-warning': ramp.amber[300],
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[500],
  'status-warning-subtle': ramp.amber[50],
  'status-warning-muted': 'rgba(249, 180, 21, 0.30)',
  'status-warning-strong': 'rgba(249, 180, 21, 0.50)',

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': ramp.blue[50],
  'status-info-muted': 'rgba(33, 150, 243, 0.30)',
  'status-info-strong': 'rgba(33, 150, 243, 0.50)',

  // Solid-variant fill. Light mode aliases the base tone unchanged: the dark-mode
  // lift and label flip (AW-141) were measured against dark planes only, and light
  // needs its own pass with AW-121. Defined here so no token is mode-incomplete.
  'brand-primary-solid': ramp.orange[400],
  'brand-secondary-solid': ramp.cyan[600],
  'status-success-solid': ramp.green[300],
  'status-error-solid': ramp.red[600],
  'status-warning-solid': ramp.amber[300],
  'status-info-solid': ramp.blue[500],

  // Text ON a `-subtle` fill — see the on-brand-*-subtle note above.
  'on-status-success-subtle': ramp.green[300],
  'on-status-error-subtle': ramp.red[600],
  'on-status-warning-subtle': ramp.amber[300],
  'on-status-info-subtle': ramp.blue[500],

  // Text on status backgrounds (on-status-*)
  'on-status-success': p.white,
  'on-status-error': p.white,
  'on-status-warning': p.white,
  'on-status-info': p.white,

  // Result/outcome indicators (result-*)
  'result-improve': resultPaletteColors.improve, // Green - positive outcome
  'result-improve-light': 'rgba(76, 175, 80, 0.12)',
  'result-improve-dark': resultPaletteColors.improveDark,
  'result-degrade': resultPaletteColors.degrade, // Red - negative outcome
  'result-degrade-light': 'rgba(239, 83, 80, 0.12)',
  'result-degrade-dark': resultPaletteColors.degradeDark,
  'result-inconclusive': resultPaletteColors.inconclusive, // Gray - no clear result
  'result-inconclusive-light': 'rgba(158, 154, 151, 0.12)',
  'result-neutral': greyRamp[600], // Neutral baseline

  // Text on result backgrounds (on-result-*)
  'on-result-improve': p.white,
  'on-result-degrade': p.white,
  'on-result-inconclusive': p.white,

  // Data visualization colors (data-*)
  // First 10 colors from discrete rainbow optimized for charts
  'data-1': discreteRainbow[9], // Blue
  'data-2': discreteRainbow[14], // Green
  'data-3': discreteRainbow[17], // Yellow
  'data-4': discreteRainbow[25], // Red
  'data-5': discreteRainbow[8], // Purple
  'data-6': discreteRainbow[20], // Orange
  'data-7': discreteRainbow[13], // Light Blue
  'data-8': discreteRainbow[15], // Light Green
  'data-9': discreteRainbow[3], // Lavender
  'data-10': discreteRainbow[22], // Dark Orange

  // Chart palettes (dataviz-*) — VW-371 phase 1.
  //
  // The three shipped palettes become theme-aware ROLES instead of primitive
  // literals a chart imports directly. Phase 1 is plumbing only: light and dark
  // point at the same values, so nothing moves on screen. Phase 2 tunes the
  // light column against a decision story — at which point a consumer already
  // reading `getSemanticColors(mode)` picks the change up for free.
  //
  // Index is the ARRAY index of the underlying palette, not a 1-based rank, so
  // `dataviz-diverging-2` is `divergingScale[2]` and the two stay legible
  // against each other. `data-1..10` keeps its 1-based naming; it is superseded
  // and not the model to copy.
  'dataviz-diverging-0': divergingScale[0], // under
  'dataviz-diverging-1': divergingScale[1], // maintenance
  'dataviz-diverging-2': divergingScale[2], // optimal (light center)
  'dataviz-diverging-3': divergingScale[3], // approaching
  'dataviz-diverging-4': divergingScale[4], // over

  'dataviz-sequential-0': sequentialEffort[0],
  'dataviz-sequential-1': sequentialEffort[1],
  'dataviz-sequential-2': sequentialEffort[2],
  'dataviz-sequential-3': sequentialEffort[3],
  'dataviz-sequential-4': sequentialEffort[4],
  'dataviz-sequential-5': sequentialEffort[5],

  // The `default` variant only. The palette's second variant (`dark`, deeper
  // shades for white text on a fill) stays a primitive: whether the THEME should
  // select the variant is exactly the phase-2 question, and promoting both now
  // would prejudge it.
  'dataviz-categorical-0': categoricalPalette.default[0],
  'dataviz-categorical-1': categoricalPalette.default[1],
  'dataviz-categorical-2': categoricalPalette.default[2],
  'dataviz-categorical-3': categoricalPalette.default[3],
  'dataviz-categorical-4': categoricalPalette.default[4],
  'dataviz-categorical-5': categoricalPalette.default[5],
  'dataviz-categorical-6': categoricalPalette.default[6], // extended — pair with a legend

  // Text colors (text-*)
  'text-primary': semanticPins.textPrimaryLight,
  'text-secondary': semanticPins.textSecondaryLight,
  'text-tertiary': greyRamp[400],
  'text-disabled': 'rgba(55, 65, 81, 0.48)',
  'text-inverse': p.white,
  'text-link': ramp.blue[600],
  'text-link-hover': ramp.blue[700],

  // Surface colors (surface-*) - for elevated containers
  'surface-base': p.white,
  'surface-elevated': greyRamp[50], // slightly off-white for elevated cards
  'surface-raised': greyRamp[100], // light gray for raised cards
  'surface-overlay': p.white,
  'surface-input': greyRamp[50], // Input field background (filled variant)

  // Background colors (background-*)
  'background-base': semanticPins.backgroundBaseLight,
  'background-default': p.white,
  'background-subtle': greyRamp[50],
  // Frame/bezel chrome — top bar + side nav shell, one step below
  // `background-base`. Placeholder pairing for light mode, which is deferred.
  'background-frame': greyRamp[400],

  // Border colors (border-*)
  'border-prominent': greyRamp[400], // high-visibility divider
  'border-focus': ramp.blue[600],
  'border-input': greyRamp[200], // Input field border
  'border-input-hover': greyRamp[400], // Input field border on hover
  'border-input-focus': ramp.blue[600], // Input field border on focus
  'border-input-error': ramp.red[600], // Input field border on error

  // Alpha hairline separators (surface-independent — composite toward black on
  // light surfaces, mirroring the dark-mode white-alpha family). See §4/S-2.
  'hairline-subtle': 'rgba(0, 0, 0, 0.06)',
  'hairline-default': 'rgba(0, 0, 0, 0.09)',
  'hairline-strong': 'rgba(0, 0, 0, 0.14)',

  // Scrims (VW-82) — see the dark map for why these are tokens and not
  // `bg-black/50`, and why they do not flip with the theme.
  'scrim-press': 'rgba(0, 0, 0, 0.10)',
  'scrim-press-strong': 'rgba(0, 0, 0, 0.20)',
  'scrim-subtle': 'rgba(0, 0, 0, 0.30)',
  'scrim-default': 'rgba(0, 0, 0, 0.50)',

  // Control chrome and data labels (VW-82). Mode-independent for the same
  // reason the `on-*` white labels are: the plane underneath them is fixed.
  'on-control-idle': semanticPins.onControlIdle,
  'on-control-active': p.white,
  'on-data-strong': semanticPins.onDataStrong,

  // Interactive states (interactive-*)
  'interactive-hover': 'rgba(55, 65, 81, 0.04)',
  'interactive-focus': 'rgba(55, 65, 81, 0.12)',
  'interactive-active': 'rgba(55, 65, 81, 0.16)',
  'interactive-selected': 'rgba(55, 65, 81, 0.08)',
  'interactive-disabled': 'rgba(55, 65, 81, 0.12)',
  'interactive-disabled-text': 'rgba(55, 65, 81, 0.26)',

  // Divider
  divider: semanticPins.dividerLight,

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
  'brand-primary-muted': 'rgba(255, 121, 0, 0.30)',
  'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
  'brand-primary-hover': ramp.orange[300],
  'brand-primary-active': ramp.orange[200],

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': 'rgba(34, 211, 238, 0.12)',
  'brand-secondary-muted': 'rgba(48, 123, 155, 0.30)',
  'brand-secondary-strong': 'rgba(48, 123, 155, 0.50)',
  'brand-secondary-hover': ramp.cyan[500],
  'brand-secondary-active': ramp.cyan[400],

  // Text on a SOLID fill — see the on-status-* note below.
  'on-brand-primary': greyRamp[950],
  'on-brand-secondary': greyRamp[950],

  // Text ON a `-subtle` fill. Its own role: `brand-primary` and friends are tuned to
  // carry a white label as a solid fill, which makes the two deepest of them
  // (cyan[600], red[600]) too dark to read as text on a dark plane. Levelling the
  // family at rung 300 puts every tone within OKLCH L 0.769-0.813 instead of
  // 0.550-0.813. Brand is deliberately left at its own orange[400] (operator, AW-133)
  // so the Voltras tone never drifts; it is the one tone under AA on a raised card.
  'on-brand-primary-subtle': ramp.orange[400],
  'on-brand-secondary-subtle': ramp.cyan[300],

  // Status colors
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': 'rgba(46, 213, 115, 0.12)',
  'status-success-muted': 'rgba(46, 213, 115, 0.30)',
  'status-success-strong': 'rgba(46, 213, 115, 0.50)',

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  // Alpha 0.08, not the family's 0.12: error's label is red[400], a rung darker than
  // its siblings so it reads RED rather than pink (rung 300 has only 0.121 chroma).
  // Thinning the fill buys back the contrast that extra darkness costs. See AW-133.
  'status-error-subtle': 'rgba(247, 113, 117, 0.08)',
  'status-error-muted': 'rgba(209, 67, 67, 0.30)',
  'status-error-strong': 'rgba(209, 67, 67, 0.50)',

  'status-error-vivid': alertRedVivid,
  'status-error-vivid-light': ramp.red[500],
  'status-error-vivid-dark': ramp.red[700],
  'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',
  'status-error-vivid-muted': 'rgba(255, 71, 87, 0.30)',
  'status-error-vivid-strong': 'rgba(255, 71, 87, 0.50)',

  'status-warning': ramp.amber[300],
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[500],
  'status-warning-subtle': 'rgba(249, 180, 21, 0.12)',
  'status-warning-muted': 'rgba(249, 180, 21, 0.30)',
  'status-warning-strong': 'rgba(249, 180, 21, 0.50)',

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': 'rgba(120, 194, 255, 0.12)',
  'status-info-muted': 'rgba(33, 150, 243, 0.30)',
  'status-info-strong': 'rgba(33, 150, 243, 0.50)',

  // SOLID-variant fill. Its own role, for the same reason `on-*-subtle` is: the base
  // tone token is tuned for borders, dots and text, where a deep step is right. Four
  // tones alias it unchanged; `brand-secondary` and `status-error` are lifted one rung
  // because their base steps are too dark to carry a readable dark label — even the
  // darkest step of their own hue only reaches ~3.6 on them. Lifting the FILL is what
  // lets all six share one label, which is the point (AW-141).
  'brand-primary-solid': ramp.orange[400],
  'brand-secondary-solid': ramp.cyan[500],
  'status-success-solid': ramp.green[300],
  'status-error-solid': ramp.red[500],
  'status-warning-solid': ramp.amber[300],
  'status-info-solid': ramp.blue[500],

  // Text on a SOLID fill. Every solid fill is now light enough to carry the dark
  // inverse label, and measured on the `-solid` fills above it clears AA on all six
  // (5.16 to 9.64). White cleared it on none of the bright four — warning was 1.82.
  'on-status-success': greyRamp[950],
  'on-status-error': greyRamp[950],
  'on-status-warning': greyRamp[950],
  'on-status-info': greyRamp[950],

  // Text ON a `-subtle` fill — see the on-brand-*-subtle note above. Error is the
  // second deliberate exception to the rung-300 rule (operator, AW-133): red[300]
  // levelled perfectly but read PINK, because a red that light can only hold 0.121
  // chroma. red[400] carries 0.165 and reads red; its fill is thinned to compensate.
  'on-status-success-subtle': ramp.green[300],
  'on-status-error-subtle': ramp.red[400],
  'on-status-warning-subtle': ramp.amber[300],
  'on-status-info-subtle': ramp.blue[300],

  // Result/outcome indicators (result-*)
  'result-improve': resultPaletteColors.improve,
  'result-improve-light': 'rgba(76, 175, 80, 0.16)',
  'result-improve-dark': resultPaletteColors.improveDark,
  'result-degrade': resultPaletteColors.degrade,
  'result-degrade-light': 'rgba(239, 83, 80, 0.16)',
  'result-degrade-dark': resultPaletteColors.degradeDark,
  'result-inconclusive': resultPaletteColors.inconclusive,
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

  // Chart palettes (dataviz-*) — VW-371 phase 1. Same values as the light map
  // above by design; see it for why, and for why the categorical `dark` variant
  // is deliberately NOT promoted yet.
  'dataviz-diverging-0': divergingScale[0],
  'dataviz-diverging-1': divergingScale[1],
  'dataviz-diverging-2': divergingScale[2],
  'dataviz-diverging-3': divergingScale[3],
  'dataviz-diverging-4': divergingScale[4],

  'dataviz-sequential-0': sequentialEffort[0],
  'dataviz-sequential-1': sequentialEffort[1],
  'dataviz-sequential-2': sequentialEffort[2],
  'dataviz-sequential-3': sequentialEffort[3],
  'dataviz-sequential-4': sequentialEffort[4],
  'dataviz-sequential-5': sequentialEffort[5],

  'dataviz-categorical-0': categoricalPalette.default[0],
  'dataviz-categorical-1': categoricalPalette.default[1],
  'dataviz-categorical-2': categoricalPalette.default[2],
  'dataviz-categorical-3': categoricalPalette.default[3],
  'dataviz-categorical-4': categoricalPalette.default[4],
  'dataviz-categorical-5': categoricalPalette.default[5],
  'dataviz-categorical-6': categoricalPalette.default[6],

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
  'text-link': semanticPins.focusIndigoDark,
  'text-link-hover': ramp.blue[400],

  // Surface colors - dark backgrounds — warm-tapered DERIVED ramp (TD-surface-tokens,
  // S-1, re-spaced S-3). Shipped verbatim from `deriveSurfaceRamp()` — see
  // `surfaceRampDark` in primitives.ts for the full derivation note. `surface-overlay`
  // and `surface-elevated` are distinct (were both #191919 pre-S-1); `surface-input`
  // tracks one plane above `surface-base`, same relative position as before the remap.
  // `background-base` backs `Surface level="background"` (SurfaceContext.SURFACE_LEVEL_TOKEN),
  // so it takes the ramp's shell role. The deepest plane is `background-frame`,
  // which is also the `SurfaceLevel` floor a pressed surface clamps at.
  'surface-base': greyRamp[925], // main surface        (#252321, L*13.9)
  'surface-elevated': greyRamp[900], // elevated surface     (#2C2A28, L*17.2 — nav/rail)
  'surface-raised': greyRamp[875], // raised surface       (#31302F, L*19.9 — cards)
  'surface-overlay': greyRamp[850], // overlay surface      (#373635, L*22.7 — hero/popover)
  'surface-input': greyRamp[900], // input surface        (#2C2A28 — one plane above base)

  // Background colors — same ramp, the frame/shell end of it.
  'background-base': greyRamp[950], // shell                (#1C1916, L*9   — Surface level="background")
  'background-default': greyRamp[925], // main background      (#252321, L*13.9 — matches surface-base)
  'background-subtle': greyRamp[900], // subtle background    (#2C2A28, L*17.2 — matches surface-elevated)
  // Frame/bezel chrome — the top bar + side nav shell, one step BELOW
  // `background-base`. It used to be described as sitting OUTSIDE the ramp; it
  // is simply the ramp's last step now, and the floor `<Surface pressed>` clamps at.
  'background-frame': greyRamp[975], // frame / bezel        (#100D0A, L*3.8)

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
  'border-prominent': greyRamp[800], // high-visibility divider
  'border-focus': semanticPins.focusIndigoDark,
  'border-input': greyRamp[700],
  'border-input-hover': greyRamp[600],
  'border-input-focus': semanticPins.focusIndigoDark,
  'border-input-error': ramp.red[500],

  // Alpha hairline separators — the primary separation cue (§4/S-2). Self-
  // normalizing: composites toward white by ~the same amount on ANY plane, so
  // one family works at every elevation instead of per-surface border tokens.
  // Shadows are demoted to floating-overlay use only (not shipped as a fill
  // separator here — see elevation.ts, follow-up S-4).
  //
  // RETUNED on the wall (VW-99, S-6). The original .06/.09/.14 were set at a
  // desk. On the panel at ~3 m `subtle` rendered but was indiscernible, and
  // `default` — the load-bearing one, with no solid-border fallback since
  // TD-07.14 — went weak on the lightest plane. `strong` read cleanly with room
  // to spare, which is what made raising the whole family viable.
  //
  // Each tier steps up onto the next MEASURED-GOOD rung rather than an
  // interpolated one: the new `subtle` is the old `default`, and the new
  // `default` is the old `strong` — a value just confirmed legible on all four
  // planes. Spacing goes 1 : 1.56 : 2.33, against the original 1 : 1.5 : 2.33.
  //
  // RUN 2 (VW-99): all three tiers were seen on all four planes — the retune
  // worked — but `subtle` was still "a bit hard to read", so the whole family
  // took a further +.01. That is a comfort margin on a passing row, not a fix
  // for a failing one, which is why it is a flat offset: the 1 : 1.56 : 2.33
  // spacing that the run validated is preserved rather than re-derived.
  //
  // Keep these to TWO decimals. react-native-web quantises alpha to 8 bits, so
  // a 3-decimal value silently rounds on the way to the DOM (.135 renders as
  // .13) — the token would say one thing and paint another.
  //
  // DARK ONLY. The light family above composites toward BLACK on light planes,
  // which this run says nothing about — do not mirror these numbers into it
  // without its own verification.
  'hairline-subtle': 'rgba(255, 255, 255, 0.10)',
  'hairline-default': 'rgba(255, 255, 255, 0.15)',
  'hairline-strong': 'rgba(255, 255, 255, 0.22)',

  // Scrims (VW-82) — translucent BLACK laid over arbitrary content: modal and
  // drawer backdrops, the filled Select fill, the Alert close button's press
  // states. Approved from the `Foundations/Color/Proposed VW-82 tokens` story
  // on 2026-09-13.
  //
  // Why tokens and not `bg-black/50`: Tailwind v3 cannot apply an opacity
  // modifier to a `var()` colour — it fails to parse the value and emits NO
  // rule, so the utility silently does nothing. A translucent role therefore
  // has to ship as its own rgba value, exactly as `hairline-*` above does.
  //
  // NOT mirrored per theme. A scrim's job is to darken what is behind it so an
  // overlay reads; that is true on a light page too, where flipping to
  // white-alpha would wash the page out instead of receding it. Same reason
  // `on-status-*` is white in both maps.
  //
  // Two decimals, per the hairline note above: react-native-web quantises alpha
  // to 8 bits, so a third decimal silently rounds on the way to the DOM.
  'scrim-press': 'rgba(0, 0, 0, 0.10)',
  'scrim-press-strong': 'rgba(0, 0, 0, 0.20)',
  'scrim-subtle': 'rgba(0, 0, 0, 0.30)',
  'scrim-default': 'rgba(0, 0, 0, 0.50)',

  // Control chrome and data labels (VW-82), also approved 2026-09-13.
  //
  // `on-control-*` is the label ON a toolbar control face — a grey plane, not a
  // brand or status fill, which is why it is not `on-brand-primary` even though
  // the active value is the same white. `on-data-strong` is the label ON a
  // light categorical data fill (Treemap tiles), where every text-* token is
  // far too light to read.
  'on-control-idle': semanticPins.onControlIdle,
  'on-control-active': p.white,
  'on-data-strong': semanticPins.onDataStrong,

  // Interactive states
  'interactive-hover': 'rgba(255, 255, 255, 0.04)',
  'interactive-focus': 'rgba(255, 255, 255, 0.12)',
  'interactive-active': 'rgba(255, 255, 255, 0.16)',
  'interactive-selected': 'rgba(255, 255, 255, 0.08)',
  'interactive-disabled': 'rgba(255, 255, 255, 0.12)',
  'interactive-disabled-text': 'rgba(255, 255, 255, 0.26)',

  // Divider
  divider: 'rgba(255, 255, 255, 0.09)',

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

/**
 * Semantic spacing (AW-142) — the situational layer over the 4px numeric scale.
 *
 * Every value here is a cluster the spacing audit MEASURED in the shipped
 * components, so adopting a key changes no pixels. Each is defined once and
 * exposed twice from this one object: as `--space-*` custom properties (via
 * `theme/config.ts` into `global.css` and `dist/tokens.css`) and as Tailwind
 * keys that reference those properties, so a future density mode remaps the
 * variables without touching a component.
 *
 * Which key to reach for: a component's OWN padding is `control` (a pressable),
 * `inset` (a surface, card or panel) or `squish` (a pill-shaped atom). Page
 * rhythm is `section` (between unrelated blocks) and `gutter` (from the
 * container edge). Gaps between siblings are `stack` (vertical) and `inline`
 * (horizontal). The raw numeric scale stays legal everywhere.
 *
 * `stack` doubles at every level so adjacent levels never read as ambiguous.
 *
 * `squish` and `control` carry an explicit axis (`squish-x-md`, `control-y-md`)
 * because `px-` and `py-` share one Tailwind namespace: a single `squish-md`
 * key could not hold 12 horizontally and 4 vertically.
 */
export const space = {
  inset: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  squish: {
    x: { xs: 4, sm: 8, md: 12, lg: 16 },
    y: { xs: 1, sm: 2, md: 4, lg: 6 },
  },
  stack: { sm: 4, md: 8, lg: 16, xl: 24 },
  inline: { sm: 4, md: 8, lg: 12 },
  control: {
    x: { sm: 16, md: 20, lg: 24 },
    y: { sm: 6, md: 8, lg: 10 },
  },
  section: { sm: 24, md: 32, lg: 48 },
  gutter: { sm: 16, md: 24 },
} as const

/**
 * Semantic sizing — a control's height and the icon ramp, straight off the
 * primitives. Control heights are also Tailwind `h-*` / `min-h-*` keys.
 */
export const size = {
  control: primitiveSizing.control,
  icon: primitiveSizing.icon,
} as const

// Export type for theme mode
export type ThemeMode = 'light' | 'dark'

// Helper to get semantic colors based on mode
export function getSemanticColors(mode: ThemeMode) {
  return mode === 'dark' ? semanticColorsDark : semanticColorsLight
}
