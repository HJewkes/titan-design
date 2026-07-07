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
