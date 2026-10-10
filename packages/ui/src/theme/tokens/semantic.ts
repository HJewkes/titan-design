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

/**
 * COLOUR FAMILY CELLS (decision 0004) — seven hues and neutral, four cells each, both modes.
 *
 * `tint-{m}-solid` carries `on-tint-{m}`; `tint-{m}-subtle` carries `on-tint-{m}-subtle`. Every
 * value is a ramp step; there is no wash. Light solid is the decision 0003 ladder: hue 600 under
 * white, with orange 500 and amber 500 as the two named exceptions. Light subtle is hue 100 under
 * hue 700. Dark solid is the shipped step under grey 950; dark subtle is hue 900 under hue 300.
 * Neutral is grey 700 / white and grey 200 / grey 800 in light, grey 200 / grey 950 and
 * grey 800 / grey 200 in dark.
 *
 * The six tone roles (brand-primary, brand-secondary, status-success, -warning, -error, -info)
 * alias their hue's cells for `-solid`, `on-*`, `-subtle` and `on-*-subtle`, so a component that
 * reads a role keeps its name and moves with the cell. `family-alias.test.ts` holds the equality.
 */
const familyLight = {
  red: { solid: ramp.red[600], on: p.white, subtle: ramp.red[100], onSubtle: ramp.red[700] },
  orange: {
    solid: ramp.orange[500], // decision 0003 named exception (3.74:1 under white)
    on: p.white,
    subtle: ramp.orange[100],
    onSubtle: ramp.orange[700],
  },
  amber: {
    solid: ramp.amber[500], // decision 0003 named exception (3.63:1 under white)
    on: p.white,
    subtle: ramp.amber[100],
    onSubtle: ramp.amber[700],
  },
  green: {
    solid: ramp.green[600],
    on: p.white,
    subtle: ramp.green[100],
    onSubtle: ramp.green[700],
  },
  cyan: { solid: ramp.cyan[600], on: p.white, subtle: ramp.cyan[100], onSubtle: ramp.cyan[700] },
  blue: { solid: ramp.blue[600], on: p.white, subtle: ramp.blue[100], onSubtle: ramp.blue[700] },
  magenta: {
    solid: ramp.magenta[600],
    on: p.white,
    subtle: ramp.magenta[100],
    onSubtle: ramp.magenta[700],
  },
  neutral: { solid: greyRamp[700], on: p.white, subtle: greyRamp[200], onSubtle: greyRamp[800] },
} as const

const familyDark = {
  red: { solid: ramp.red[500], on: greyRamp[950], subtle: ramp.red[900], onSubtle: ramp.red[300] },
  orange: {
    solid: ramp.orange[400],
    on: greyRamp[950],
    subtle: ramp.orange[900],
    onSubtle: ramp.orange[300],
  },
  amber: {
    solid: ramp.amber[300],
    on: greyRamp[950],
    subtle: ramp.amber[900],
    onSubtle: ramp.amber[300],
  },
  green: {
    solid: ramp.green[300],
    on: greyRamp[950],
    subtle: ramp.green[900],
    onSubtle: ramp.green[300],
  },
  cyan: {
    solid: ramp.cyan[500],
    on: greyRamp[950],
    subtle: ramp.cyan[900],
    onSubtle: ramp.cyan[300],
  },
  blue: {
    solid: ramp.blue[500],
    on: greyRamp[950],
    subtle: ramp.blue[900],
    onSubtle: ramp.blue[300],
  },
  magenta: {
    solid: ramp.magenta[400],
    on: greyRamp[950],
    subtle: ramp.magenta[900],
    onSubtle: ramp.magenta[300],
  },
  neutral: {
    solid: greyRamp[200],
    on: greyRamp[950],
    subtle: greyRamp[800],
    onSubtle: greyRamp[200],
  },
} as const

// Light mode semantic colors (default)
export const semanticColorsLight = {
  // Brand colors (brand-*)
  'brand-primary': ramp.orange[400],
  'brand-primary-light': ramp.orange[300],
  'brand-primary-dark': ramp.orange[500],
  'brand-primary-subtle': familyLight.orange.subtle, // decision 0004: the orange subtle cell
  'brand-primary-muted': ramp.orange[200],
  'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
  'brand-primary-hover': ramp.orange[600], // TD-774: one rung below the orange[500] solid
  'brand-primary-active': ramp.orange[700], // TD-774: one rung below hover

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': familyLight.cyan.subtle, // decision 0004: the cyan subtle cell
  'brand-secondary-muted': ramp.cyan[200],
  'brand-secondary-strong': 'rgba(48, 123, 155, 0.50)',
  'brand-secondary-hover': ramp.cyan[700],
  'brand-secondary-active': ramp.cyan[800],

  // Text on brand backgrounds (on-*): the family's white label (decision 0004)
  'on-brand-primary': familyLight.orange.on,
  'on-brand-secondary': familyLight.cyan.on,

  // Text ON a `-subtle` fill. Light pairs a ramp[700] label with a ramp[100] fill:
  // the base rung on a near-white ramp[50] fill read 1.7 to 4.4:1. Every tone now
  // clears 4.5:1 (subtle-label.light.test.ts). Decision 0004 makes the pair the
  // hue's subtle cell; the values are unchanged.
  'on-brand-primary-subtle': familyLight.orange.onSubtle,
  'on-brand-secondary-subtle': familyLight.cyan.onSubtle,

  // Status colors (status-*)
  'status-success': ramp.green[700], // TD-789 3b: green 600 missed 3:1 on the grey 200 rail
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[800], // TD-789 3b: one step past the base, as error-dark is
  'status-success-subtle': familyLight.green.subtle, // decision 0004: the green subtle cell
  'status-success-muted': 'rgba(46, 213, 115, 0.30)',
  'status-success-strong': 'rgba(46, 213, 115, 0.50)',

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  // Deload: the magenta WorkoutPill and WeekRow have washed by hand since VW-0; a role of
  // its own, so a deload week reads the same wherever it is drawn. Callers alpha it.
  'status-deload': ramp.magenta[700], // TD-789 3b: magenta 600 labels miss 4.5:1 on grey 100

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  'status-error-subtle': familyLight.red.subtle, // decision 0004: the red subtle cell
  'status-error-muted': 'rgba(209, 67, 67, 0.30)',
  'status-error-strong': 'rgba(209, 67, 67, 0.50)',

  'status-error-vivid': ramp.red[700], // TD-789 3b: the pin missed 3:1; red 600 is status-error
  'status-error-vivid-light': ramp.red[500],
  'status-error-vivid-dark': ramp.red[700],
  'status-error-vivid-subtle': 'rgba(164, 34, 28, 0.12)', // TD-789 3b: red 700, the base above
  'status-error-vivid-muted': 'rgba(164, 34, 28, 0.30)',
  'status-error-vivid-strong': 'rgba(164, 34, 28, 0.50)',

  'status-warning': ramp.amber[600], // TD-789 3b: amber 500 missed 3:1 on the light planes
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[700], // TD-789 3b: one step past the base
  'status-warning-subtle': familyLight.amber.subtle, // decision 0004: the amber subtle cell
  'status-warning-muted': 'rgba(249, 180, 21, 0.30)',
  'status-warning-strong': 'rgba(249, 180, 21, 0.50)',

  'status-info': ramp.blue[700], // TD-789 3b: blue 600 missed 3:1 on its Progress track on grey 200
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[800], // TD-789 3b: one step past the base
  'status-info-subtle': familyLight.blue.subtle, // decision 0004: the blue subtle cell
  'status-info-muted': 'rgba(33, 150, 243, 0.30)',
  'status-info-strong': 'rgba(33, 150, 243, 0.50)',

  // Solid-variant fill: each role's hue solid cell (decision 0004), which is the
  // decision 0003 ladder. White on green[600] clears 4.5:1; amber[500] keeps the
  // white label at 3.6:1 and orange[500] at 3.74:1, the two named exceptions
  // declared in contrast-baseline.json. Info moves to the ladder step, blue[600].
  'brand-primary-solid': familyLight.orange.solid, // TD-774: decision 0003, named exception
  'brand-secondary-solid': familyLight.cyan.solid,
  'status-success-solid': familyLight.green.solid,
  'status-error-solid': familyLight.red.solid,
  'status-warning-solid': familyLight.amber.solid, // decision 0003, named exception
  'status-info-solid': familyLight.blue.solid, // decision 0004: blue 600, was blue 500

  // Text ON a `-subtle` fill — see the on-brand-*-subtle note above.
  'on-status-success-subtle': familyLight.green.onSubtle,
  'on-status-error-subtle': familyLight.red.onSubtle,
  'on-status-warning-subtle': familyLight.amber.onSubtle,
  'on-status-info-subtle': familyLight.blue.onSubtle,

  // Text on status backgrounds (on-status-*): the family's white label
  'on-status-success': familyLight.green.on,
  'on-status-error': familyLight.red.on,
  'on-status-warning': familyLight.amber.on,
  'on-status-info': familyLight.blue.on,

  // Colour family cells (tint-*), decision 0004: a hue with no status meaning
  // (a tool family, a tag, a zone). Light solid is hue 600 under white, subtle is
  // hue 100 under hue 700; neutral is grey 700 / white and grey 200 / grey 800.
  'tint-red-solid': familyLight.red.solid, // hue 600
  'on-tint-red': familyLight.red.on, // white
  'tint-red-subtle': familyLight.red.subtle, // hue 100
  'on-tint-red-subtle': familyLight.red.onSubtle, // hue 700
  'tint-orange-solid': familyLight.orange.solid, // hue 500, decision 0003 exception
  'on-tint-orange': familyLight.orange.on, // white
  'tint-orange-subtle': familyLight.orange.subtle, // hue 100
  'on-tint-orange-subtle': familyLight.orange.onSubtle, // hue 700
  'tint-amber-solid': familyLight.amber.solid, // hue 500, decision 0003 exception
  'on-tint-amber': familyLight.amber.on, // white
  'tint-amber-subtle': familyLight.amber.subtle, // hue 100
  'on-tint-amber-subtle': familyLight.amber.onSubtle, // hue 700
  'tint-green-solid': familyLight.green.solid, // hue 600
  'on-tint-green': familyLight.green.on, // white
  'tint-green-subtle': familyLight.green.subtle, // hue 100
  'on-tint-green-subtle': familyLight.green.onSubtle, // hue 700
  'tint-cyan-solid': familyLight.cyan.solid, // hue 600
  'on-tint-cyan': familyLight.cyan.on, // white
  'tint-cyan-subtle': familyLight.cyan.subtle, // hue 100
  'on-tint-cyan-subtle': familyLight.cyan.onSubtle, // hue 700
  'tint-blue-solid': familyLight.blue.solid, // hue 600
  'on-tint-blue': familyLight.blue.on, // white
  'tint-blue-subtle': familyLight.blue.subtle, // hue 100
  'on-tint-blue-subtle': familyLight.blue.onSubtle, // hue 700
  'tint-magenta-solid': familyLight.magenta.solid, // hue 600
  'on-tint-magenta': familyLight.magenta.on, // white
  'tint-magenta-subtle': familyLight.magenta.subtle, // hue 100
  'on-tint-magenta-subtle': familyLight.magenta.onSubtle, // hue 700, equals status-deload
  'tint-neutral-solid': familyLight.neutral.solid, // grey 700
  'on-tint-neutral': familyLight.neutral.on, // white
  'tint-neutral-subtle': familyLight.neutral.subtle, // grey 200
  'on-tint-neutral-subtle': familyLight.neutral.onSubtle, // grey 800

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

  // Chart palettes (dataviz-*) — VW-371.
  //
  // The three shipped palettes are theme-aware ROLES instead of primitive
  // literals a chart imports directly. Phase 1 made them roles with light and
  // dark on the same values; phase 2 (2026-09-17) tuned this light column
  // against `Lab/Decisions/Dataviz Light Palettes`, which keeps the candidates,
  // the measurements and the sets that were not chosen. Dark still tracks the
  // primitive arrays. A consumer reading `getSemanticColors(mode)` follows the
  // theme; one importing the primitive arrays keeps painting the dark values.
  //
  // Index is the ARRAY index of the underlying palette, not a 1-based rank, so
  // `dataviz-diverging-2` is `divergingScale[2]` and the two stay legible
  // against each other. `data-1..10` keeps its 1-based naming; it is superseded
  // and not the model to copy.
  //
  // Diverging, set C': the inner stops sit one step darker than dark so they hold
  // on a light plane; the centre stays the lightest stop. Slot 0 takes a black label.
  'dataviz-diverging-0': ramp.blue[500], // under (dark: same step)
  'dataviz-diverging-1': ramp.cyan[400], // maintenance (dark: cyan[300])
  'dataviz-diverging-2': ramp.green[300], // optimal, light centre (dark: green[200])
  'dataviz-diverging-3': ramp.amber[400], // approaching (dark: amber[300])
  'dataviz-diverging-4': ramp.red[600], // over (dark: same step)

  // Sequential, set S1: dark's hues through step 3, lifting at step 1 as dark
  // does, then strictly darker (ΔL ≥ 0.05) into a red tail that stays saturated.
  'dataviz-sequential-0': ramp.green[300], // dark: same step
  'dataviz-sequential-1': ramp.amber[300], // dark: amber[200]
  'dataviz-sequential-2': ramp.orange[400], // dark: amber[300]
  'dataviz-sequential-3': ramp.orange[500], // dark: orange[400]
  'dataviz-sequential-4': ramp.red[700], // dark: red[600]
  'dataviz-sequential-5': ramp.red[800], // dark: red[700]

  // Categorical, set B: the `default` variant's hues, with red and green taking
  // the darker slots so orange[400] keeps its brightness. The palette's `dark`
  // variant stays a primitive.
  'dataviz-categorical-0': ramp.blue[500], // dark: same step
  'dataviz-categorical-1': ramp.magenta[600], // dark: magenta[500]
  'dataviz-categorical-2': ramp.red[600], // dark: red[500]
  'dataviz-categorical-3': ramp.orange[400], // dark: same step
  'dataviz-categorical-4': ramp.green[600], // dark: green[300]
  'dataviz-categorical-5': ramp.cyan[400], // dark: cyan[300]
  'dataviz-categorical-6': ramp.amber[600], // extended — pair with a legend (dark: same step)

  // Text colors (text-*)
  'text-primary': semanticPins.textPrimaryLight,
  'text-secondary': greyRamp[800], // TD-789 3b: one step past tertiary
  'text-tertiary': greyRamp[700], // TD-789 3b: grey 600 missed 4.5:1 on grey 200
  'text-disabled': 'rgba(55, 65, 81, 0.48)',
  'text-inverse': p.white,
  'text-error': ramp.red[700], // one rung darker than status-error to clear 4.5:1 on every light plane
  'text-brand': ramp.orange[700], // rung 700 clears 4.5:1 on every light plane
  'text-brand-secondary': ramp.cyan[800], // TD-789 3b: rung 800 clears 4.5:1 on every light plane
  'text-success': ramp.green[800], // TD-789 3b: rung 800 clears 4.5:1 on every light plane
  'text-warning': ramp.amber[700], // rung 700 clears 4.5:1 on every light plane
  'text-info': ramp.blue[700], // rung 700 clears 4.5:1 on every light plane
  'text-link': ramp.blue[700],
  'text-link-hover': ramp.blue[700],

  // Surface colors (surface-*) - for elevated containers
  // TD-789 3b: the page grey 100 up to elevated grey 50; raised and overlay share white,
  // and the lift separates them.
  'surface-base': greyRamp[100], // the page
  'surface-elevated': greyRamp[50],
  'surface-raised': p.white, // Card default
  'surface-overlay': p.white,
  'surface-input': greyRamp[50], // Input field background (filled variant)

  // Background colors (background-*)
  'background-base': greyRamp[200], // one step below surface-base
  'background-default': greyRamp[100], // matches surface-base
  'background-subtle': greyRamp[50], // matches surface-elevated
  // Frame/bezel chrome — top bar + side nav shell, one step below `background-base`.
  'background-frame': greyRamp[300],

  // Border colors (border-*)
  'border-prominent': greyRamp[400], // high-visibility divider
  'border-focus': ramp.blue[600],
  'border-input': greyRamp[600], // Input field border, 3:1 on every content plane (TD-488, TD-789)
  'border-input-hover': greyRamp[700], // Input field border on hover
  'border-input-focus': ramp.blue[600], // Input field border on focus
  'border-input-error': ramp.red[600], // Input field border on error

  // Alpha hairline separators (surface-independent — composite toward black on
  // light surfaces, mirroring the dark-mode white-alpha family). See §4/S-2.
  'hairline-subtle': 'rgba(0, 0, 0, 0.10)',
  'hairline-default': 'rgba(0, 0, 0, 0.16)', // TD-789 3b: ΔL* 12 on grey 200
  'hairline-strong': 'rgba(0, 0, 0, 0.24)', // TD-789 3b: ΔL* 18 on grey 200

  // Scrims (VW-82) — see the dark map for why these are tokens and not
  // `bg-black/50`, and why they do not flip with the theme.
  'scrim-press': 'rgba(0, 0, 0, 0.10)',
  'scrim-press-strong': 'rgba(0, 0, 0, 0.20)',
  'scrim-subtle': 'rgba(0, 0, 0, 0.30)',
  'scrim-default': 'rgba(0, 0, 0, 0.50)',

  // Toolbar control faces (TD-264): a white raised face, pressed into a warm
  // silver. greyRamp[50] and [100] sit within ΔE 3 of other light roles. The
  // labels flip with the faces, since the face under them now does.
  'control-face': p.white,
  'control-face-active': greyRamp[200],
  'control-face-disabled': 'rgba(0, 0, 0, 0.06)',
  'on-control-idle': greyRamp[700], // 7.0:1 on control-face
  'on-control-active': greyRamp[950], // 11.5:1 on control-face-active
  'on-data-strong': semanticPins.onDataStrong,

  // Interactive states (interactive-*)
  'interactive-hover': 'rgba(55, 65, 81, 0.04)',
  'interactive-focus': 'rgba(55, 65, 81, 0.12)',
  'interactive-active': 'rgba(55, 65, 81, 0.16)',
  'interactive-selected': 'rgba(55, 65, 81, 0.08)',
  'interactive-disabled': 'rgba(55, 65, 81, 0.12)',
  'interactive-disabled-text': 'rgba(55, 65, 81, 0.26)',

  // Divider
  divider: 'rgba(0, 0, 0, 0.16)', // the hairline-default value (TD-489)

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
  'brand-primary-subtle': familyDark.orange.subtle, // decision 0004: orange 900, was a 12% wash
  'brand-primary-muted': 'rgba(255, 121, 0, 0.30)',
  'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
  'brand-primary-hover': ramp.orange[300],
  'brand-primary-active': ramp.orange[200],

  'brand-secondary': ramp.cyan[500], // lifted from cyan 600 to clear 3:1 on every dark plane (item 42 d4)
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': familyDark.cyan.subtle, // decision 0004: cyan 900, was a 12% wash
  'brand-secondary-muted': 'rgba(48, 123, 155, 0.30)',
  'brand-secondary-strong': 'rgba(48, 123, 155, 0.50)',
  'brand-secondary-hover': ramp.cyan[500],
  'brand-secondary-active': ramp.cyan[400],

  // Text on a SOLID fill — see the on-status-* note below.
  'on-brand-primary': familyDark.orange.on,
  'on-brand-secondary': familyDark.cyan.on,

  // Text ON a `-subtle` fill. Its own role: `brand-primary` and friends are tuned to
  // carry a white label as a solid fill, which makes the two deepest of them
  // (cyan[600], red[600]) too dark to read as text on a dark plane. Levelling the
  // family at rung 300 puts every tone within OKLCH L 0.769-0.813 instead of
  // 0.550-0.813. AW-133 had left brand at its own orange[400] so the brand tone never
  // drifted; decision 0004 levels it with the family at orange[300] on the opaque
  // orange[900] subtle cell (7.00:1), where the wash had read under AA on a raised card.
  'on-brand-primary-subtle': familyDark.orange.onSubtle, // decision 0004: orange 300, was 400
  'on-brand-secondary-subtle': familyDark.cyan.onSubtle,

  // Status colors
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': familyDark.green.subtle, // decision 0004: green 900, was a 12% wash
  'status-success-muted': 'rgba(46, 213, 115, 0.30)',
  'status-success-strong': 'rgba(46, 213, 115, 0.50)',

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  // Deload: the magenta WorkoutPill and WeekRow have washed by hand since VW-0; a role of
  // its own, so a deload week reads the same wherever it is drawn. Callers alpha it.
  'status-deload': ramp.magenta[600],

  'status-error': ramp.red[500], // equals text-error; red 600 missed 3:1 on the upper planes (item 42 d3)
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  // AW-133 thinned this wash to 0.08 to carry a red[400] label; decision 0004 makes it
  // the opaque red[900] cell under red[300], levelled with the family (7.03:1).
  'status-error-subtle': familyDark.red.subtle, // decision 0004: red 900, was an 8% wash
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
  'status-warning-subtle': familyDark.amber.subtle, // decision 0004: amber 900, was a 12% wash
  'status-warning-muted': 'rgba(249, 180, 21, 0.30)',
  'status-warning-strong': 'rgba(249, 180, 21, 0.50)',

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': familyDark.blue.subtle, // decision 0004: blue 900, was a 12% wash
  'status-info-muted': 'rgba(33, 150, 243, 0.30)',
  'status-info-strong': 'rgba(33, 150, 243, 0.50)',

  // SOLID-variant fill: each role's hue solid cell (decision 0004), the shipped step.
  // Its own role, for the same reason `on-*-subtle` is: the base tone token is tuned
  // for borders, dots and text, where a deep step is right. Four tones alias it
  // unchanged; `brand-secondary` and `status-error` are lifted one rung because their
  // base steps are too dark to carry a readable dark label — even the darkest step of
  // their own hue only reaches ~3.6 on them. Lifting the FILL is what lets all six
  // share one label, which is the point (AW-141).
  // Item 42 later lifted those two dark base tones to rung 500 as well, so here the
  // fill equals its base tone; the fill must not follow either back to rung 600.
  'brand-primary-solid': familyDark.orange.solid,
  'brand-secondary-solid': familyDark.cyan.solid,
  'status-success-solid': familyDark.green.solid,
  'status-error-solid': familyDark.red.solid,
  'status-warning-solid': familyDark.amber.solid,
  'status-info-solid': familyDark.blue.solid,

  // Text on a SOLID fill. Every solid fill is now light enough to carry the dark
  // inverse label, and measured on the `-solid` fills above it clears AA on all six
  // (5.16 to 9.64). White cleared it on none of the bright four — warning was 1.82.
  'on-status-success': familyDark.green.on,
  'on-status-error': familyDark.red.on,
  'on-status-warning': familyDark.amber.on,
  'on-status-info': familyDark.blue.on,

  // Text ON a `-subtle` fill — see the on-brand-*-subtle note above. AW-133 had held
  // error at red[400], a rung darker than its siblings, because red[300] read PINK on
  // the thin wash (a red that light holds only 0.121 chroma). Decision 0004 levels it
  // at red[300] on the opaque red[900] cell, where the deep fill carries the hue.
  'on-status-success-subtle': familyDark.green.onSubtle,
  'on-status-error-subtle': familyDark.red.onSubtle, // decision 0004: red 300, was 400
  'on-status-warning-subtle': familyDark.amber.onSubtle,
  'on-status-info-subtle': familyDark.blue.onSubtle,

  // Colour family cells (tint-*), decision 0004: a hue with no status meaning
  // (a tool family, a tag, a zone). Dark solid is the shipped step under grey 950,
  // subtle is hue 900 under hue 300; neutral is grey 200 / grey 950 and
  // grey 800 / grey 200.
  'tint-red-solid': familyDark.red.solid, // hue 500
  'on-tint-red': familyDark.red.on, // grey 950
  'tint-red-subtle': familyDark.red.subtle, // hue 900
  'on-tint-red-subtle': familyDark.red.onSubtle, // hue 300
  'tint-orange-solid': familyDark.orange.solid, // hue 400
  'on-tint-orange': familyDark.orange.on, // grey 950
  'tint-orange-subtle': familyDark.orange.subtle, // hue 900
  'on-tint-orange-subtle': familyDark.orange.onSubtle, // hue 300
  'tint-amber-solid': familyDark.amber.solid, // hue 300
  'on-tint-amber': familyDark.amber.on, // grey 950
  'tint-amber-subtle': familyDark.amber.subtle, // hue 900
  'on-tint-amber-subtle': familyDark.amber.onSubtle, // hue 300
  'tint-green-solid': familyDark.green.solid, // hue 300
  'on-tint-green': familyDark.green.on, // grey 950
  'tint-green-subtle': familyDark.green.subtle, // hue 900
  'on-tint-green-subtle': familyDark.green.onSubtle, // hue 300
  'tint-cyan-solid': familyDark.cyan.solid, // hue 500
  'on-tint-cyan': familyDark.cyan.on, // grey 950
  'tint-cyan-subtle': familyDark.cyan.subtle, // hue 900
  'on-tint-cyan-subtle': familyDark.cyan.onSubtle, // hue 300
  'tint-blue-solid': familyDark.blue.solid, // hue 500
  'on-tint-blue': familyDark.blue.on, // grey 950
  'tint-blue-subtle': familyDark.blue.subtle, // hue 900
  'on-tint-blue-subtle': familyDark.blue.onSubtle, // hue 300
  'tint-magenta-solid': familyDark.magenta.solid, // hue 400
  'on-tint-magenta': familyDark.magenta.on, // grey 950
  'tint-magenta-subtle': familyDark.magenta.subtle, // hue 900
  'on-tint-magenta-subtle': familyDark.magenta.onSubtle, // hue 300
  'tint-neutral-solid': familyDark.neutral.solid, // grey 200
  'on-tint-neutral': familyDark.neutral.on, // grey 950
  'tint-neutral-subtle': familyDark.neutral.subtle, // grey 800
  'on-tint-neutral-subtle': familyDark.neutral.onSubtle, // grey 200

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

  // Chart palettes (dataviz-*) — VW-371. Dark tracks the primitive arrays; the
  // light map above carries its own tuned steps (phase 2) and explains why.
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
  // token-contrast.test.ts, which fails if this is moved back down.
  'text-tertiary': greyRamp[500],
  'text-disabled': 'rgba(255, 255, 255, 0.38)',
  'text-inverse': greyRamp[950],
  'text-error': ramp.red[500], // owner chose red 500 below 4.5:1 knowingly, round q4b-red-conflict r1 (a)
  'text-brand': ramp.orange[400], // clears 4.5:1 on every dark plane
  'text-brand-secondary': ramp.cyan[300], // clears 4.5:1 on every dark plane
  'text-success': ramp.green[400], // clears 4.5:1 on every dark plane
  'text-warning': ramp.amber[300], // clears 4.5:1 on every dark plane
  'text-info': ramp.blue[300], // clears 4.5:1 on every dark plane
  'text-link': ramp.blue[300], // on the ramp; border-focus keeps the indigo pin (item 42 d5)
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
  // `border-prominent` is the one border meant to be seen outright (4 call
  // sites, high-visibility dividers). It was solid grey-800, which read weaker
  // than `hairline-default`; it is now white alpha like the hairlines, so it
  // cannot collide with a plane either.
  'border-prominent': 'rgba(255, 255, 255, 0.30)', // high-visibility divider, one step above hairline-strong (item 42 d2)
  'border-focus': semanticPins.focusIndigoDark,
  'border-input': greyRamp[500], // Input field border, matches light (TD-674)
  'border-input-hover': greyRamp[400], // grey 600 missed 3:1 on every dark plane (item 42 d1)
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
  //
  // `control-face*` is the toolbar control face itself (TD-264), the values
  // ToolbarButton painted before it read tokens.
  'control-face': greyRamp[800],
  'control-face-active': greyRamp[900],
  'control-face-disabled': 'rgba(255, 255, 255, 0.12)',
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
