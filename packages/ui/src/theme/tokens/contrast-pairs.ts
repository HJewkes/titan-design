/**
 * TD-231: every foreground/background pair the theme promises, with the contrast
 * floor it owes, in both modes. `token-contrast.test.ts` measures each one, and
 * `scripts/update-contrast-baseline.mjs` records the ones that fail today.
 *
 * Floors are per role, not one blanket 4.5. `text-tertiary` is the de-emphasised
 * role (captions, units), so WCAG's large-text 3:1 is its honest bar; holding it
 * to 4.5 would erase the difference between the three text roles. A label on a
 * fill owes AA, 4.5.
 *
 * TD-739 adds the pairs component states paint (disabled, hover and pressed,
 * error), each citing the class that paints it.
 */
import { compositeOver, contrast } from '../color-checks'
import { DATAVIZ_CATEGORICAL_ROLES } from '../extracted-colors-dataviz'
import { greyRamp } from './primitives'
import { getSemanticColors, type ThemeMode } from './semantic'

export const CONTRAST_MODES: readonly ThemeMode[] = ['dark', 'light']

export interface ContrastPair {
  /** Semantic key drawn on top: a text role, an `on-*` label, or a tone or border painted as one. */
  fg: string
  /** Semantic key or `grey-<step>` primitive it is drawn on. */
  bg: string
  floor: number
  modes: readonly ThemeMode[]
  /** Planes a translucent or faded `bg` is composited over; otherwise ignored. */
  over?: readonly string[]
  /** A disabled control fades label and fill together to this opacity over the plane under it. */
  opacity?: number
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

/** Floor for a disabled state: WCAG 1.4.3 exempts it, 3:1 keeps it discernible (as `text-disabled`). */
const DISABLED = 3
const POPOVER = ['surface-overlay'] as const
const ROW_STATES = ['interactive-hover', 'interactive-active', 'interactive-selected'] as const

// Button `disabled && 'opacity-40'` fades its solid fill and label over the card beneath.
const buttonDisabled: ContrastPair[] = labelsOnSolidFills.map((pair) => ({
  ...pair,
  floor: DISABLED,
  over: CONTENT_PLANES,
  opacity: 0.4,
}))

const otherDisabled: ContrastPair[] = [
  // Input `isDisabled && 'opacity-40'` on the `bg-surface-input` field box.
  {
    fg: 'text-primary',
    bg: 'surface-input',
    floor: DISABLED,
    modes: BOTH,
    over: CONTENT_PLANES,
    opacity: 0.4,
  },
  // Menu item and Select option `opacity-50`, on the popover plane.
  { fg: 'text-primary', bg: 'surface-overlay', floor: DISABLED, modes: BOTH, opacity: 0.5 },
]

const hoverAndPressed: ContrastPair[] = [
  // Button solid `web:hover:bg-brand-primary-dark active:bg-brand-primary-dark`.
  ...BRANDS.map((b) => ({ fg: `on-brand-${b}`, bg: `brand-${b}-dark`, floor: AA, modes: BOTH })),
  // Button outline and ghost wash the label's tone under it: `text-status-error` with
  // `web:hover:bg-status-error-subtle active:bg-status-error-subtle`. IconBox's glyph too.
  ...[...BRANDS.map((b) => `brand-${b}`), ...TONES.map((t) => `status-${t}`)].map((tone) => ({
    fg: tone,
    bg: `${tone}-subtle`,
    floor: AA,
    modes: BOTH,
    over: CONTENT_PLANES,
  })),
  // Menu item and Select option `web:hover:bg-interactive-hover active:bg-interactive-active`,
  // Select `selected && 'bg-interactive-selected'`, all under `text-text-primary`.
  ...ROW_STATES.map((bg) => ({ fg: 'text-primary', bg, floor: 7, modes: BOTH, over: POPOVER })),
  // Select's single-select pick: `text-brand-primary` on `bg-interactive-selected`.
  { fg: 'brand-primary', bg: 'interactive-selected', floor: AA, modes: BOTH, over: POPOVER },
]

const errorStates: ContrastPair[] = [
  // Menu `isDestructive` item: `text-text-error` under the row's hover and press washes.
  ...(['interactive-hover', 'interactive-active'] as const).map((bg) => ({
    fg: 'text-error',
    bg,
    floor: AA,
    modes: BOTH,
    over: POPOVER,
  })),
  // Toast error: `bg-status-error-subtle` on its elevation-5 overlay, under the
  // `text-text-error` glyph, `text-text-primary` title and `text-text-secondary` body.
  ...(['text-error', 'text-primary', 'text-secondary'] as const).map((fg) => ({
    fg,
    bg: 'status-error-subtle',
    floor: TEXT_FLOORS[fg],
    modes: BOTH,
    over: POPOVER,
  })),
  // Input `isInvalid && 'border-border-input-error'`: the outline owes WCAG 1.4.11's 3:1.
  { fg: 'border-input-error', bg: 'surface-input', floor: 3, modes: BOTH },
]

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...textOnPlanes,
  ...toneTextOnPlanes,
  ...statusErrorText,
  ...labelsOnSolidFills,
  ...labelsOnSubtleFills,
  ...labelsOnOtherFills,
  ...buttonDisabled,
  ...otherDisabled,
  ...hoverAndPressed,
  ...errorStates,
]

function resolve(key: string, colors: Colors): string {
  const grey = /^grey-(\d+)$/.exec(key)
  const value = grey ? greyRamp[Number(grey[1]) as keyof typeof greyRamp] : colors[key]
  if (!value) throw new Error(`contrast pair names "${key}", which is not a colour`)
  return value
}

function fadeOver(hex: string, opacity: number, baseHex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return compositeOver(`rgba(${r}, ${g}, ${b}, ${opacity})`, baseHex)
}

function pairId(pair: ContrastPair, plane?: string): string {
  const over = plane ? ` over ${plane}` : ''
  const faded = pair.opacity === undefined ? '' : ` at ${Math.round(pair.opacity * 100)}%`
  return `${pair.fg} on ${pair.bg}${over}${faded}`
}

function measureOne(pair: ContrastPair, colors: Colors, plane?: string): ContrastMeasurement {
  const bgValue = resolve(pair.bg, colors)
  const under = plane ? resolve(plane, colors) : bgValue
  const bg = compositeOver(bgValue, under)
  const fg = compositeOver(resolve(pair.fg, colors), bg)
  const ratio =
    pair.opacity === undefined
      ? contrast(fg, bg)
      : contrast(fadeOver(fg, pair.opacity, under), fadeOver(bg, pair.opacity, under))
  return { id: pairId(pair, plane), ratio, floor: pair.floor }
}

function planesFor(pair: ContrastPair, translucent: boolean): (string | undefined)[] {
  if (pair.over && (translucent || pair.opacity !== undefined)) return [...pair.over]
  return translucent ? ['surface-base'] : [undefined]
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
      return planesFor(pair, translucent).map((plane) => measureOne(pair, colors, plane))
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
