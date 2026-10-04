import { greyRamp, primitiveRamps } from '../../theme/tokens/primitives'
import { darkThemeCSSVars, lightThemeCSSVars } from '../../theme/config'

/**
 * TD-487: the token values proposed by TD-488..491, as CSS custom property overrides.
 *
 * Nothing here edits a token. A story wraps its subtree in `vars(overrideProperties(set, mode))`, which
 * re-declares the proposed `--color-*` properties below that wrapper only. Every ratio the
 * stories print is measured from these maps, so a value changed here re-measures itself.
 */
export type TokenSet = 'main' | 'proposed' | 'proposedOrange600'
export type Mode = 'light' | 'dark'

export const TOKEN_SETS: TokenSet[] = ['main', 'proposed', 'proposedOrange600']

export const SET_LABEL: Record<TokenSet, string> = {
  main: 'main',
  proposed: 'proposed',
  proposedOrange600: 'proposed (orange 600)',
}

const { orange, green, amber, blue, red, cyan, magenta } = primitiveRamps

const PROPOSED_LIGHT: Record<string, string> = {
  // TD-488 control outlines
  'border-input': greyRamp[500],
  'border-input-hover': greyRamp[600],
  // TD-489 separators; divider takes the hairline-default value
  'hairline-subtle': 'rgba(0, 0, 0, 0.10)',
  'hairline-default': 'rgba(0, 0, 0, 0.15)',
  'hairline-strong': 'rgba(0, 0, 0, 0.22)',
  divider: 'rgba(0, 0, 0, 0.15)',
  // TD-490 tone marks; brand-primary stays orange[400] as a printed exception
  'status-success': green[600],
  'status-info': blue[600],
  'status-warning': amber[500],
  // TD-491 snaps
  'background-base': greyRamp[100],
  'on-control-idle': greyRamp[200],
  'text-link': blue[700],
  'brand-primary-subtle': orange[50],
  'brand-primary-muted': orange[200],
}

const PROPOSED_DARK: Record<string, string> = {
  'border-input': greyRamp[500],
  'border-input-hover': greyRamp[400],
  'border-prominent': 'rgba(255, 255, 255, 0.30)',
  divider: darkThemeCSSVars['--color-hairline-default'],
  'status-error': red[500],
  'brand-secondary': cyan[500],
  'status-deload': magenta[500],
  'text-link': blue[300],
}

const OVERRIDES: Record<Mode, Record<TokenSet, Record<string, string>>> = {
  light: {
    main: {},
    proposed: PROPOSED_LIGHT,
    proposedOrange600: { ...PROPOSED_LIGHT, 'brand-primary': orange[600] },
  },
  dark: { main: {}, proposed: PROPOSED_DARK, proposedOrange600: PROPOSED_DARK },
}

const BASE: Record<Mode, Record<string, string>> = {
  light: lightThemeCSSVars,
  dark: darkThemeCSSVars,
}

/** The value a `--color-{token}` property resolves to under a set. */
export function resolveToken(set: TokenSet, mode: Mode, token: string): string {
  const value = OVERRIDES[mode][set][token] ?? BASE[mode][`--color-${token}`]
  if (value === undefined) throw new Error(`light-tuning: no --color-${token} in ${mode}`)
  return value
}

/** Tokens a set overrides, for listing on the page. */
export function overriddenTokens(set: TokenSet, mode: Mode): string[] {
  return Object.keys(OVERRIDES[mode][set])
}

/** The set's overrides as `--color-*` properties, for nativewind `vars()` on a wrapper. */
export function overrideProperties(set: TokenSet, mode: Mode): Record<string, string> {
  const entries = Object.entries(OVERRIDES[mode][set]).map(([k, v]) => [`--color-${k}`, v])
  return Object.fromEntries(entries)
}

/** The 700 step the mirror rule gives tone-as-text in light (TD-491). */
export const TONE_TEXT_700 = {
  brand: orange[700],
  success: green[700],
  info: blue[700],
  warning: amber[700],
} as const

/** The 600 border and 700 label of the proposed selected Chip (TD-490). */
export const SELECTED_CHIP = { border: orange[600], label: orange[700] } as const

// --- measurement -----------------------------------------------------------------------

type Rgba = [number, number, number, number]

function parseColor(color: string): Rgba {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
    const channel = (i: number) => parseInt(full.slice(i, i + 2), 16)
    return [channel(0), channel(2), channel(4), 1]
  }
  const match = /rgba?\(([^)]+)\)/.exec(color)
  if (!match) throw new Error(`light-tuning: cannot measure ${color}`)
  const [r, g, b, a = 1] = match[1].split(',').map((part) => parseFloat(part))
  return [r, g, b, a]
}

function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg[3]
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1) as Rgba
}

function luminance([r, g, b]: Rgba): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function lightness(color: Rgba): number {
  const y = luminance(color)
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** A token name, or a ramp value for a recipe no token expresses yet. */
export type Paint = string | { raw: string }

export type Metric = 'ratio' | 'deltaL'

export interface Pair {
  label: string
  /** The mark or label being measured. */
  fg: Paint
  /** A fill between `fg` and the plane (composited over the plane first). */
  bg?: Paint
  /** The plane the sample sits on. */
  plane: string
  /** 4.5 text, 3 marks and boundaries; ΔL* 7 / 12 / 18 for separators. */
  floor: number
  metric?: Metric
  /** A light recipe the proposal changes in the component, not in a token: simulated in the lab. */
  proposedFg?: Paint
  proposedBg?: Paint
}

export interface Measurement {
  value: number
  passes: boolean
}

function paint(set: TokenSet, mode: Mode, p: Paint): Rgba {
  return parseColor(typeof p === 'string' ? resolveToken(set, mode, p) : p.raw)
}

/** Whether a set's simulated component recipes apply: they are light-mode proposals only. */
export function simulates(set: TokenSet, mode: Mode): boolean {
  return set !== 'main' && mode === 'light'
}

export function measure(pair: Pair, set: TokenSet, mode: Mode): Measurement {
  const simulated = simulates(set, mode)
  const plane = over(paint(set, mode, pair.plane), [255, 255, 255, 1])
  const bgPaint = (simulated && pair.proposedBg) || pair.bg
  const under = bgPaint ? over(paint(set, mode, bgPaint), plane) : plane
  const fg = over(paint(set, mode, (simulated && pair.proposedFg) || pair.fg), under)
  const value =
    pair.metric === 'deltaL' ? Math.abs(lightness(fg) - lightness(under)) : contrast(fg, under)
  return { value, passes: value >= pair.floor }
}

export function formatMeasurement(pair: Pair, m: Measurement): string {
  const prefix = pair.metric === 'deltaL' ? 'ΔL* ' : ''
  const digits = pair.metric === 'deltaL' ? 1 : 2
  return `${prefix}${m.value.toFixed(digits)}${m.passes ? '' : ' ✗'}`
}

export function isSimulated(pair: Pair): boolean {
  return pair.proposedFg !== undefined || pair.proposedBg !== undefined
}
