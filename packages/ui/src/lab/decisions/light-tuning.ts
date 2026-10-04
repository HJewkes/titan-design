import { greyRamp, primitiveRamps } from '../../theme/tokens/primitives'
import { darkThemeCSSVars, lightThemeCSSVars } from '../../theme/config'

/**
 * TD-487: the token values proposed by TD-488..491, as CSS custom property overrides.
 *
 * Nothing here edits a token. A story wraps its subtree in `vars(overrideProperties(set, mode))`, which
 * re-declares the proposed `--color-*` properties below that wrapper only. Every ratio the
 * stories print is measured from these maps, so a value changed here re-measures itself.
 */
export type TokenSet =
  | 'main'
  | 'proposed'
  | 'proposedOrange600'
  | 'accepted'
  | 'r2a'
  | 'r2b'
  | 'r2c'
export type Mode = 'light' | 'dark'

export const TOKEN_SETS: TokenSet[] = [
  'main',
  'proposed',
  'proposedOrange600',
  'accepted',
  'r2a',
  'r2b',
  'r2c',
]

export const SET_LABEL: Record<TokenSet, string> = {
  main: 'main',
  proposed: 'proposed',
  proposedOrange600: 'proposed (orange 600)',
  accepted: 'accepted',
  r2a: 'r2a',
  r2b: 'r2b',
  r2c: 'r2c',
}

/** Round 2 (TD-624) variants build on the round 1 accepted set and are described against it. */
export function baseSet(set: TokenSet): TokenSet {
  return set === 'r2a' || set === 'r2b' || set === 'r2c' ? 'accepted' : 'main'
}

const { orange, green, amber, blue, red, cyan, magenta } = primitiveRamps

const LIGHT_HAIRLINE_DEFAULT = 'rgba(0, 0, 0, 0.15)'

const PROPOSED_LIGHT: Record<string, string> = {
  // TD-488 control outlines
  'border-input': greyRamp[500],
  'border-input-hover': greyRamp[600],
  // TD-489 separators; divider takes the hairline-default value
  'hairline-subtle': 'rgba(0, 0, 0, 0.10)',
  'hairline-default': LIGHT_HAIRLINE_DEFAULT,
  'hairline-strong': 'rgba(0, 0, 0, 0.22)',
  divider: LIGHT_HAIRLINE_DEFAULT,
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
  'brand-secondary-subtle': cyan[50],
  'brand-secondary-muted': cyan[200],
}

// TD-624: solids shared by every round 2 variant. Success solid takes the mark step so a white
// label reads; warning keeps its vivid fill and takes a dark label instead (Alert solid too).
const ROUND2_SOLIDS: Record<string, string> = {
  'status-success-solid': green[600],
  'on-status-warning': greyRamp[950],
}

function round2(fill: 50 | 100 | 200, label: 700 | 800): Record<string, string> {
  return {
    ...PROPOSED_LIGHT,
    ...ROUND2_SOLIDS,
    'status-success-subtle': green[fill],
    'on-status-success-subtle': green[label],
    'status-warning-subtle': amber[fill],
    'on-status-warning-subtle': amber[label],
  }
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
    accepted: PROPOSED_LIGHT,
    r2a: round2(50, 700),
    r2b: round2(100, 700),
    r2c: round2(200, 800),
  },
  dark: {
    main: {},
    proposed: PROPOSED_DARK,
    proposedOrange600: PROPOSED_DARK,
    accepted: PROPOSED_DARK,
    r2a: PROPOSED_DARK,
    r2b: PROPOSED_DARK,
    r2c: PROPOSED_DARK,
  },
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

/**
 * A selected Chip recipe (lab only). `solidFill` paints a solid chip with the on-brand label;
 * otherwise the chip keeps the subtle fill and takes `border` and `label`.
 */
export interface ChipRecipe {
  name: string
  solidFill?: string
  border?: string
  label?: string
}

/** The 600 border and 700 label of the proposed selected Chip (TD-490). */
export const SELECTED_CHIP = {
  name: 'orange[600] edge + orange[700] label',
  border: orange[600],
  label: orange[700],
} as const satisfies ChipRecipe

const ROUND2_CHIPS: Partial<Record<TokenSet, ChipRecipe>> = {
  r2a: { name: 'solid orange[600] fill + on-brand label', solidFill: orange[600] },
  r2b: { name: 'orange[600] edge + grey[900] label', border: orange[600], label: greyRamp[900] },
  r2c: { name: 'orange[600] edge + orange[600] label', border: orange[600], label: orange[600] },
}

/** The selected Chip recipe a set simulates; main renders the Chip as it is today. */
export function chipRecipe(set: TokenSet): ChipRecipe | undefined {
  if (set === 'main') return undefined
  return ROUND2_CHIPS[set] ?? SELECTED_CHIP
}

/** TD-624 fix for the unselected Chip label under the darker hairline-subtle fill. */
export function chipLabelFix(set: TokenSet): string | undefined {
  return baseSet(set) === 'accepted' ? greyRamp[700] : undefined
}

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
  /** A recipe that differs by set (simulated); wins over `proposedFg` / `proposedBg`. */
  recipe?: (set: TokenSet) => { fg?: Paint; bg?: Paint } | undefined
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
  const recipe = simulated ? pair.recipe?.(set) : undefined
  const plane = over(paint(set, mode, pair.plane), [255, 255, 255, 1])
  const bgPaint = recipe?.bg ?? ((simulated && pair.proposedBg) || pair.bg)
  const under = bgPaint ? over(paint(set, mode, bgPaint), plane) : plane
  const fgPaint = recipe?.fg ?? ((simulated && pair.proposedFg) || pair.fg)
  const fg = over(paint(set, mode, fgPaint), under)
  const value =
    pair.metric === 'deltaL' ? Math.abs(lightness(fg) - lightness(under)) : contrast(fg, under)
  return { value, passes: value >= pair.floor }
}

export function formatMeasurement(pair: Pair, m: Measurement): string {
  const prefix = pair.metric === 'deltaL' ? 'ΔL* ' : ''
  const digits = pair.metric === 'deltaL' ? 1 : 2
  return `${prefix}${m.value.toFixed(digits)}${m.passes ? '' : ' ✗'}`
}

export function isSimulated(pair: Pair, set: TokenSet): boolean {
  if (pair.recipe?.(set) !== undefined) return true
  return pair.proposedFg !== undefined || pair.proposedBg !== undefined
}
