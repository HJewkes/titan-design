/**
 * TD-231: every foreground/background pair the theme promises, with the contrast
 * floor it owes, in both modes. `token-contrast.test.ts` measures each one, and
 * `scripts/update-contrast-baseline.mjs` records the ones that fail today.
 *
 * Floors are per role, not one blanket 4.5. `text-tertiary` is the de-emphasised
 * role (captions, units), so WCAG's large-text 3:1 is its honest bar; holding it
 * to 4.5 would erase the difference between the three text roles. A label on a
 * fill owes AA, 4.5.
 */
import { compositeOver, contrast } from '../color-checks'
import { DATAVIZ_CATEGORICAL_ROLES } from '../extracted-colors-dataviz'
import { greyRamp } from './primitives'
import { getSemanticColors, type ThemeMode } from './semantic'

export const CONTRAST_MODES: readonly ThemeMode[] = ['dark', 'light']

export interface ContrastPair {
  /** Semantic key drawn on top: a text role or an `on-*` label. */
  fg: string
  /** Semantic key or `grey-<step>` primitive it is drawn on. */
  bg: string
  floor: number
  modes: readonly ThemeMode[]
  /** Planes a translucent `bg` is composited over; ignored where `bg` is opaque. */
  over?: readonly string[]
  note?: string
}

export interface ContrastMeasurement {
  id: string
  ratio: number
  floor: number
}

type Colors = Record<string, string>

const BOTH = CONTRAST_MODES
const AA = 4.5

/** Every plane text can land on: each `surface-*` and `background-*` key. */
export const TEXT_PLANES = Object.keys(getSemanticColors('dark')).filter((key) =>
  /^(surface|background)-/.test(key)
)

/** The planes a card or pill sits on, where a translucent fill gets composited. */
export const CONTENT_PLANES = [
  'surface-base',
  'surface-elevated',
  'surface-raised',
  'surface-overlay',
] as const

/** Planes a face one step UP from a content plane lands on (`raisedLevel`, clamped at overlay). */
const RAISED_FACE_PLANES = ['surface-elevated', 'surface-raised', 'surface-overlay'] as const

/** Planes a face one step DOWN from a content plane lands on (`pressedLevel`). */
const PRESSED_FACE_PLANES = [
  'background-base',
  'surface-base',
  'surface-elevated',
  'surface-raised',
] as const

const TEXT_FLOORS = {
  'text-primary': 7, // body copy, AAA
  'text-secondary': AA,
  'text-tertiary': 3, // de-emphasised, AA large
  // WCAG 1.4.3 exempts disabled text; 3:1 keeps it discernible as text.
  'text-disabled': 3,
  // Dark pairs baselined: owner q4b-red-conflict r1 (a), 2026-10-07, below AA by decision; TD-416.
  'text-error': AA,
  'text-link': AA,
  'text-link-hover': AA,
} as const

// Declared on the four content planes only; background-frame is a page backdrop no text token here sits on.
const TONE_TEXT = [
  'text-brand',
  'text-brand-secondary',
  'text-success',
  'text-warning',
  'text-info',
] as const

const TONES = ['success', 'error', 'warning', 'info'] as const
const BRANDS = ['primary', 'secondary'] as const

const textOnPlanes: ContrastPair[] = Object.entries(TEXT_FLOORS).flatMap(([fg, floor]) =>
  TEXT_PLANES.map((bg) => ({ fg, bg, floor, modes: BOTH }))
)

const toneTextOnPlanes: ContrastPair[] = TONE_TEXT.flatMap((fg) =>
  CONTENT_PLANES.map((bg) => ({ fg, bg, floor: AA, modes: BOTH }))
)

// Components still draw error text in status-error until TD-249 moves them onto
// text-error (audit finding 14: 2.49 to 2.92:1 on the dark content planes).
const statusErrorText: ContrastPair[] = CONTENT_PLANES.map((bg) => ({
  fg: 'status-error',
  bg,
  floor: AA,
  modes: BOTH,
  note: 'error text until TD-249',
}))

const labelsOnSolidFills: ContrastPair[] = [
  ...BRANDS.map((b) => ({ fg: `on-brand-${b}`, bg: `brand-${b}-solid`, floor: AA, modes: BOTH })),
  ...TONES.map((t) => ({ fg: `on-status-${t}`, bg: `status-${t}-solid`, floor: AA, modes: BOTH })),
]

const labelsOnSubtleFills: ContrastPair[] = [
  ...BRANDS.map((b) => `brand-${b}-subtle`),
  ...TONES.map((t) => `status-${t}-subtle`),
].map((bg) => ({ fg: `on-${bg}`, bg, floor: AA, modes: BOTH, over: CONTENT_PLANES }))

const labelsOnOtherFills: ContrastPair[] = [
  ...(['improve', 'degrade', 'inconclusive'] as const).map((r) => ({
    fg: `on-result-${r}`,
    bg: `result-${r}`,
    floor: AA,
    modes: BOTH,
  })),
  // ToolbarButton's faces are ramp planes one step up (idle) or down (active) from
  // the toolbar's plane (TD-265), so each label owes AA on every plane it can land on.
  ...RAISED_FACE_PLANES.map((bg) => ({ fg: 'on-control-idle', bg, floor: AA, modes: BOTH })),
  ...PRESSED_FACE_PLANES.map((bg) => ({ fg: 'on-control-active', bg, floor: AA, modes: BOTH })),
  // The inverted plane is the primary ink: a tooltip, a neutral pill.
  { fg: 'text-inverse', bg: 'text-primary', floor: AA, modes: BOTH },
  // Treemap falls back to on-data-strong on its categorical tiles.
  ...DATAVIZ_CATEGORICAL_ROLES.map((bg) => ({ fg: 'on-data-strong', bg, floor: AA, modes: BOTH })),
]

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...textOnPlanes,
  ...toneTextOnPlanes,
  ...statusErrorText,
  ...labelsOnSolidFills,
  ...labelsOnSubtleFills,
  ...labelsOnOtherFills,
]

function resolve(key: string, colors: Colors): string {
  const grey = /^grey-(\d+)$/.exec(key)
  const value = grey ? greyRamp[Number(grey[1]) as keyof typeof greyRamp] : colors[key]
  if (!value) throw new Error(`contrast pair names "${key}", which is not a colour`)
  return value
}

function measureOne(pair: ContrastPair, colors: Colors, plane?: string): ContrastMeasurement {
  const bgValue = resolve(pair.bg, colors)
  const bg = plane ? compositeOver(bgValue, resolve(plane, colors)) : bgValue
  const fg = compositeOver(resolve(pair.fg, colors), bg)
  const id = `${pair.fg} on ${pair.bg}${plane ? ` over ${plane}` : ''}`
  return { id, ratio: contrast(fg, bg), floor: pair.floor }
}

/** Every pair that applies in `mode`, measured; a translucent fill once per `over` plane. */
export function measureContrastPairs(
  mode: ThemeMode,
  pairs: readonly ContrastPair[] = CONTRAST_PAIRS,
  colors: Colors = getSemanticColors(mode)
): ContrastMeasurement[] {
  return pairs
    .filter((pair) => pair.modes.includes(mode))
    .flatMap((pair) => {
      const translucent = !resolve(pair.bg, colors).startsWith('#')
      const planes = translucent ? (pair.over ?? ['surface-base']) : [undefined]
      return planes.map((plane) => measureOne(pair, colors, plane))
    })
}

/** Ids of the pairs that fall below their floor in `mode`, sorted. */
export function failingContrastPairs(
  mode: ThemeMode,
  pairs: readonly ContrastPair[] = CONTRAST_PAIRS,
  colors: Colors = getSemanticColors(mode)
): string[] {
  return measureContrastPairs(mode, pairs, colors)
    .filter(({ ratio, floor }) => ratio < floor)
    .map(({ id }) => id)
    .sort()
}
