/**
 * Primitive Design Tokens
 *
 * Raw values with no semantic meaning. These are the foundation of the design system
 * and should rarely be used directly in components. Use semantic tokens instead.
 */

/**
 * Absolute colour keywords.
 *
 * This used to hold five scales — `blue`, `red`, `redVivid`, `neutral` and
 * `charcoal`. All five are gone (TD-07.14): the greys folded into `greyRamp`
 * below and the chromatics into the OKLCH `primitiveRamps`. What is left has no
 * scale because these three are not colours you tune, they are keywords.
 */
export const primitiveColors = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

/**
 * Unified warm-neutral grey ramp (TD-07.14)
 *
 * The ONE achromatic scale. Regenerate with `scripts/generate-grey-ramp.mjs` —
 * preserve the generator, not just the hexes.
 *
 * The surface planes ARE steps here rather than a parallel object: `850` is
 * overlay, `975` is the bezel. That is the whole point of the ramp. `grey`,
 * `neutral`, `surfaceRampDark` and `backgroundFrameDark` all resolve into it,
 * which is why every plane step below is byte-identical to the value that
 * shipped in v0.10.0 — the surfaces do not move, only their names.
 *
 * TWO THINGS ABOUT THE NUMBERING, both deliberate and both previously re-derived
 * from scratch more than once because they were never written down:
 *
 * 1. `975` sits BELOW the standard grid. `canonL` — the median L* of the seven
 *    chromatic `primitiveRamps` at each step — ends at L*10.3, which is step
 *    `950`. The bezel is L*3.8, darker than the grid's last rung, so there is
 *    simply no step number left for it and `975` extends past the end.
 * 2. `850`/`875` are quarter-steps because overlay/raised/elevated are only
 *    ~2.7 L* apart and all three collide on `900` at normal resolution. `800`
 *    is a generated bridge between `700` (L*37.9) and overlay (L*22.7) so the
 *    spacing stays even across the join.
 *
 * There is no `inset`. It was retired, not renamed: at ΔE 1.10 from `975` it was
 * an imperceptible duplicate of the frame, which is exactly why `<Surface pressed>`
 * (surface − 1) kept collapsing into it. `975` is the floor.
 *
 * Spec, generator and the rejected v1/v2 cuts:
 * coordination/design-explorations/foundations/warm-grey-ramp/
 */
export const greyRamp = {
  50: '#F9F6F3', //  L*97.0  W6
  100: '#EDEAE7', // L*92.8  W6
  200: '#D4D1CE', // L*84.0  W6  — warm silver
  300: '#BDBAB7', // L*75.7  W6
  400: '#A29F9D', // L*65.7  W5
  500: '#888684', // L*56.0  W4
  600: '#72716F', // L*47.7  W3
  700: '#5A5958', // L*37.9  W2
  800: '#424140', // L*27.6  W2  — generated bridge
  850: '#373635', // L*22.7  W2  — surface overlay
  875: '#31302F', // L*19.9  W2  — surface raised
  900: '#2C2A28', // L*17.2  W4  — surface elevated
  925: '#252321', // L*13.9  W4  — surface base
  950: '#1C1916', // L*9.0   W6  — background base / shell
  975: '#100D0A', // L*3.8   W6  — background frame / bezel
} as const

/**
 * The surface planes, as ramp steps — the mapping `<Surface level>` resolves through.
 *
 * Ordered darkest -> lightest, which is the order `pressedLevel()` walks.
 */
export const SURFACE_PLANE_STEPS = {
  frame: 975,
  background: 950,
  base: 925,
  elevated: 900,
  raised: 875,
  overlay: 850,
} as const

/**
 * Derived tonal ramps (TD-05.09 color foundations)
 *
 * Seven OKLCH-generated hue ramps, 11 perceptual lightness steps each (50 -> 950).
 * Built with hue-torsion + a chroma arc, anchored through existing brand/semantic
 * hexes. `pin` marks the step each ramp flows through its anchor.
 * This is the single source of truth for chromatic hexes — the categorical palette
 * below references these steps rather than duplicating values.
 * See coordination/design-explorations/foundations.
 */
export const primitiveRamps = {
  red: {
    50: '#FFF4F4',
    100: '#FFE3E5',
    200: '#FFC2C5',
    300: '#FF9A9D',
    400: '#F77175',
    500: '#E05254',
    600: '#D14343', // pin
    700: '#A4221C',
    800: '#7E1002',
    900: '#5A0900',
    950: '#3D0400',
  },
  orange: {
    50: '#FFF5ED',
    100: '#FFE6D4',
    200: '#FFC7A2',
    300: '#FFA063',
    400: '#FF7900', // pin
    500: '#DA5F00',
    600: '#B94A00',
    700: '#983804',
    800: '#6F290F',
    900: '#4E1C0C',
    950: '#331107',
  },
  amber: {
    50: '#FFF7DD',
    100: '#FFEAA9',
    200: '#FFD352',
    300: '#F9B415', // pin
    400: '#E08C00',
    500: '#C27400',
    600: '#A45E00',
    700: '#814D14',
    800: '#5B3A1A',
    900: '#442503',
    950: '#301500',
  },
  green: {
    50: '#E3FFEE',
    100: '#B5FFD2',
    200: '#58F69E',
    300: '#2ED573', // pin
    400: '#21C05D',
    500: '#22A444',
    600: '#298732',
    700: '#2B6B25',
    800: '#264D1C',
    900: '#1B3515',
    950: '#11220D',
  },
  cyan: {
    50: '#E6FBFF',
    100: '#C2F6FF',
    200: '#62EAFF',
    300: '#22D3EE', // pin
    400: '#01B5D1',
    500: '#2697B7',
    600: '#307B9B',
    700: '#2A617F',
    800: '#22465F',
    900: '#0B3149',
    950: '#001F36',
  },
  blue: {
    50: '#EFF8FF',
    100: '#D9EFFF',
    200: '#ACDBFF',
    300: '#78C2FF',
    400: '#3CA8FF',
    500: '#2196F3', // pin
    600: '#1072CB',
    700: '#135AA8',
    800: '#14407E',
    900: '#112C5A',
    950: '#091B3C',
  },
  magenta: {
    50: '#FFF3F9',
    100: '#FFE2F1',
    200: '#FFBDE2',
    300: '#FF8FD5',
    400: '#ED69C3',
    500: '#D548AF',
    600: '#BA2996',
    700: '#9C0D7A', // pin
    800: '#77005A',
    900: '#56003F',
    950: '#3B0029',
  },
} as const

/**
 * Categorical (qualitative) palette — an ordered, CVD-safe series expressed as
 * references into {@link primitiveRamps} (one source of truth; the palette moves
 * with the ramps).
 *
 * Design: a single canonical hue order (blue, magenta, red, orange, green, cyan,
 * amber), with steps chosen vivid-midtone-first and fanned lighter/darker as the
 * series grows to preserve separation. The sequence is nested-stable — a chart
 * with N series uses the first N colors, and the series index is stable as N
 * changes. Colorblind-safe worst-case deuteranopia/protanopia floor 8 holds
 * through {@link CATEGORICAL_CVD_SAFE_MAX} colors; the 7th is an extended color
 * that should be paired with a legend or other secondary encoding.
 *
 * Two variants: `default` (vivid, sits on neutral/light surfaces, legible under
 * black text) and `dark` (deeper shades legible under white text on a fill). A
 * separate "light" variant was dropped — the vivid `default` picks already clear
 * black-text contrast, so it doubles as the light-context palette.
 */
export const categoricalPalette = {
  default: [
    primitiveRamps.blue[500],
    primitiveRamps.magenta[500],
    primitiveRamps.red[500],
    primitiveRamps.orange[400],
    primitiveRamps.green[300],
    primitiveRamps.cyan[300],
    primitiveRamps.amber[600], // extended (7th) — pair with a legend
  ],
  dark: [
    primitiveRamps.blue[600],
    primitiveRamps.magenta[600],
    primitiveRamps.red[500],
    primitiveRamps.orange[600],
    primitiveRamps.green[800],
    primitiveRamps.cyan[800],
    primitiveRamps.amber[500], // extended (7th) — pair with a legend
  ],
} as const

/** Largest series count that holds the CVD floor without a legend. */
export const CATEGORICAL_CVD_SAFE_MAX = 6

/**
 * Categorical palette variant.
 * - `default` : vivid; neutral/light surfaces, legible under black text
 * - `dark`    : deeper shades, legible under white text on a filled swatch
 */
export type CategoricalVariant = keyof typeof categoricalPalette

/**
 * Get a color from the ordered categorical palette by series index.
 * The palette is nested-stable, so the color for a given index does not change
 * with the total series count; `index` simply wraps past the end.
 *
 * @param index - 0-based series index (wraps past the end)
 * @param variant - `default` (black-text / light surfaces) or `dark` (white text)
 * @returns The hex color string
 */
export function getCategoricalColor(index: number, variant: CategoricalVariant = 'default'): string {
  const palette = categoricalPalette[variant]
  index = Math.max(0, Math.floor(index))
  return palette[index % palette.length]
}

/**
 * Diverging status scale (BodyMap training-status: under → optimal → over) as
 * references into {@link primitiveRamps}. A true diverging shape — `optimal` is
 * the lightest center, the extremes go darker — so the signal reads in lightness
 * (colorblind-robust; worst-case deut/protanopia min ΔE ~10.9) and the direction
 * reads in the blue↔red axis (the CVD-safe hue pair).
 *
 * Tuned so every stop is dark enough for the fill yet light enough that BLACK
 * text clears 4.5:1 on all five — no per-cell white/black flipping. The value
 * valley is symmetric: the two mid-arms (maintenance / approaching) sit at equal
 * lightness (both ~0.53 relative luminance), the ends darker.
 */
export const divergingScale = [
  primitiveRamps.blue[500], // under
  primitiveRamps.cyan[300], // maintenance
  primitiveRamps.green[200], // optimal (light center)
  primitiveRamps.amber[300], // approaching
  primitiveRamps.red[600], // over
] as const

/**
 * Sequential "effort" scale (low → high intensity: green → yellow → orange → red)
 * as references into {@link primitiveRamps}. A 6-stop ordinal palette; the
 * velocity/RPE strip sub-samples it. Every adjacent pair clears the CVD floor
 * (min deut/protan ΔE ≥ 4.5), and within that the hue walk is kept smooth —
 * the amber-200 → amber-300 → orange-400 run steps the yellow→orange transition
 * gradually rather than lurching. Order encodes magnitude, so it tolerates the
 * green↔red CVD pair. Stops 0–3 take black text; the dark reds take white.
 */
export const sequentialEffort = [
  primitiveRamps.green[300],
  primitiveRamps.amber[200],
  primitiveRamps.amber[300],
  primitiveRamps.orange[400],
  primitiveRamps.red[600],
  primitiveRamps.red[700],
] as const

/**
 * Best-contrast text color (black or white) for a solid fill — for labels sitting
 * on categorical/diverging/effort swatches. Uses the WCAG relative-luminance ratio.
 */
export function bestTextColor(hex: string): '#000000' | '#FFFFFF' {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255
    return c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
  })
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000000' : '#FFFFFF'
}

/**
 * Discrete rainbow palette for data visualization
 * Based on Paul Tol's color schemes: https://personal.sron.nl/~pault/#fig:scheme_rainbow_discrete
 */
export const discreteRainbow = [
  '#E8ECFB',
  '#D9CCE3',
  '#D1BBD7',
  '#CAACCB',
  '#BA8DB4',
  '#AE76A3',
  '#AA6F9E',
  '#994F88',
  '#882E72',
  '#1965B0',
  '#437DBF',
  '#5289C7',
  '#6195CF',
  '#7BAFDE',
  '#4EB265',
  '#90C987',
  '#CAE0AB',
  '#F7F056',
  '#F7CB45',
  '#F6C141',
  '#F4A736',
  '#F1932D',
  '#EE8026',
  '#E8601C',
  '#E65518',
  '#DC050C',
  '#A5170E',
  '#72190E',
  '#42150A',
] as const

/**
 * Palette indices for discrete rainbow colors at different palette sizes.
 * For a given palette size (index + 1), returns the indices of colors to use.
 */
const discreteRainbowPalettes: number[][] = [
  [10],
  [10, 26],
  [10, 18, 26],
  [10, 15, 18, 26],
  [10, 14, 15, 18, 26],
  [10, 14, 15, 17, 18, 26],
  [9, 10, 14, 15, 17, 18, 26],
  [9, 10, 14, 15, 17, 18, 23, 26],
  [9, 10, 14, 15, 17, 18, 23, 26, 28],
  [9, 10, 14, 15, 17, 18, 21, 24, 26, 28],
  [9, 10, 12, 14, 15, 17, 18, 21, 24, 26, 28],
  [3, 6, 9, 10, 12, 14, 15, 17, 18, 21, 24, 26],
  [3, 6, 9, 10, 12, 14, 15, 16, 17, 18, 21, 24, 26],
  [3, 6, 9, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 26],
  [3, 6, 9, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28],
  [3, 5, 7, 9, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28],
  [3, 5, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28],
  [3, 5, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 26, 27, 28],
  [2, 4, 5, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 26, 27, 28],
  [2, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 27, 28],
  [2, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 21, 23, 25, 26, 27, 28],
  [2, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 21, 23, 25, 26, 27, 28, 29],
  [1, 2, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 21, 23, 25, 26, 27, 28, 29],
]

/**
 * Get a color from the discrete rainbow palette for a given index and palette size.
 * Colors are optimized for visual distinction at each palette size.
 *
 * @param index - The index of the color in the series (0-based)
 * @param size - The total number of colors needed (1-23)
 * @returns The hex color string
 */
export function getDiscreteRainbowColor(index: number, size: number): string {
  index = Math.max(0, index)
  size = Math.min(Math.max(1, size), discreteRainbowPalettes.length)

  const palette = discreteRainbowPalettes[size - 1]
  if (index >= palette.length) index = index % palette.length

  return discreteRainbow[palette[index] - 1]
}

export const primitiveTypography = {
  fontFamilies: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
    body: ['Nunito Sans', 'sans-serif'],
    heading: ['Space Grotesk', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', 'monospace'],
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '2.25rem', // 36px
    '4xl': '3rem',    // 48px
    '5xl': '3.5rem',  // 56px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    none: 1,
    tight: 1.375,
    snug: 1.5,
    normal: 1.57,
    relaxed: 1.66,
    loose: 1.75,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.5px',
  },
} as const

export const primitiveSpacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
} as const

export const primitiveBorderRadius = {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const

export const primitiveShadows = {
  none: 'none',
  sm: '0px 1px 2px rgba(100, 116, 139, 0.12)',
  DEFAULT: '0px 1px 3px rgba(100, 116, 139, 0.12), 0px 1px 2px rgba(100, 116, 139, 0.24)',
  md: '0px 4px 6px rgba(100, 116, 139, 0.12)',
  lg: '0px 10px 15px rgba(100, 116, 139, 0.12)',
  xl: '0px 20px 25px rgba(100, 116, 139, 0.12)',
  '2xl': '0px 25px 50px rgba(100, 116, 139, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const

export const primitiveBreakpoints = {
  xs: 0,
  sm: 600,
  md: 1000,
  lg: 1200,
  xl: 1920,
} as const

export const primitiveZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  drawer: 1100,
  banner: 1200,
  appBar: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const
