/**
 * Primitive Design Tokens
 *
 * Raw values with no semantic meaning. These are the foundation of the design system
 * and should rarely be used directly in components. Use semantic tokens instead.
 */

export const primitiveColors = {
  // Blue scale (primary brand)
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#5048E5', // Primary main
    700: '#3832A0', // Primary dark
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Green scale (secondary brand)
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#3FC79A', // Secondary light
    500: '#10B981', // Secondary main
    600: '#059669',
    700: '#0B815A', // Secondary dark
    800: '#065F46',
    900: '#064E3B',
  },

  // Teal scale (success)
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#43C6B7', // Success light
    500: '#14B8A6', // Success main
    600: '#0D9488',
    700: '#0E8074', // Success dark
    800: '#115E59',
    900: '#134E4A',
  },

  // Red scale (error)
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#DA6868', // Error light
    500: '#EF4444',
    600: '#D14343', // Error main
    700: '#922E2E', // Error dark
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Vivid green scale (live/go success)
  greenVivid: {
    50: '#E9FBF0',
    100: '#C8F7DA',
    200: '#9FF0BF',
    300: '#6BE79D',
    400: '#47DE84', // Success vivid light
    500: '#2ED573', // Success vivid main
    600: '#22B85F',
    700: '#1A9950', // Success vivid dark
    800: '#157A40',
    900: '#105C30',
  },

  // Vivid red scale (alert)
  redVivid: {
    50: '#FFECEE',
    100: '#FFD6DB',
    200: '#FFB3BC',
    300: '#FF8593',
    400: '#FF6070', // Error vivid light
    500: '#FF4757', // Error vivid main
    600: '#E63548',
    700: '#C42539', // Error vivid dark
    800: '#9E1C2C',
    900: '#7A1520',
  },

  // Amber scale (warning)
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FFBF4C', // Warning light
    500: '#FFB020', // Warning main
    600: '#B27B16', // Warning dark
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Sky/Blue scale (info)
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#64B6F7', // Info light
    500: '#2196F3', // Info main
    600: '#0284C7',
    700: '#0B79D0', // Info dark
    800: '#075985',
    900: '#0C4A6E',
  },

  // Neutral/Gray scale
  neutral: {
    50: '#FAFAFA',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Orange scale (accent/brand color)
  accent: {
    100: '#FFA860',
    200: '#FF9630',
    300: '#FF8500',
    400: '#FF7900',
    500: '#F56C00',
    600: '#E06D10',
    700: '#D0620C',
    800: '#B75500',
    900: '#A34900',
  },

  // Charcoal scale (dark backgrounds)
  charcoal: {
    0: '#6E6E6E',
    50: '#5D5D5D',
    100: '#4C4C4C',
    200: '#3C3C3C',
    300: '#2C2C2C',
    400: '#1F1F1F',
    500: '#1C1C1C',
    600: '#191919',
    700: '#161616',
    800: '#131313',
    900: '#101010',
  },

  // Steel scale (cool accent)
  steel: {
    100: '#8AA4B8',
    200: '#7894A8',
    300: '#678498',
    400: '#557488',
    500: '#406D87',
    600: '#39617A',
    700: '#32556D',
    800: '#243D53',
    900: '#1D3146',
  },

  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

/**
 * Derived tonal ramps (TD-05.09 color foundations)
 *
 * Seven OKLCH-generated hue ramps, 11 perceptual lightness steps each (50 -> 950).
 * Built with hue-torsion + a chroma arc, anchored through existing brand/semantic
 * hexes. Two hues were consolidated where their used colors never collided along
 * the lightness axis: `amber` absorbs the former yellow (lemon light end -> warm
 * amber body), `cyan` absorbs the former steel (vivid cyan -> muted steel dark,
 * brand-secondary at 600). `pin` marks the step each ramp flows through its anchor.
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
  amber: { // yellow-merged: lemon top, warm-rich body
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
  cyan: { // steel-merged: brand-secondary at 600
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
 * the lightest center, the extremes (`under`/`over`) go dark — so the signal
 * reads in lightness (colorblind-robust; worst-case deut/protanopia min ΔE ~13.7)
 * and the direction reads in the blue↔red axis (the CVD-safe hue pair).
 *
 * Fills carry labels: use per-cell best-contrast text — white on the dark
 * extremes (under/over), black on the lighter middle three (see {@link bestTextColor}).
 */
export const divergingScale = [
  primitiveRamps.blue[700], // under
  primitiveRamps.cyan[400], // maintenance
  primitiveRamps.green[300], // optimal (light center)
  primitiveRamps.orange[500], // approaching
  primitiveRamps.red[700], // over
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
