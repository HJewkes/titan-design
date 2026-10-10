import { compositeOver, contrast } from '../../theme/color-checks'
import { getElevationSurface, type ElevationLevel } from '../../theme/elevation'
import { greyRamp, primitiveColors, primitiveRamps as ramp } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

/**
 * Gate 2 foundations frames (FD1, FD3, FD4, FD5), measured on the 3b planes. Nothing here edits
 * a token: every candidate is a `primitiveRamps` or `greyRamp` step named by hue and step, and
 * every ratio a frame prints is computed here (WCAG 2.x).
 */
export const FAMILY_HUES = ['red', 'orange', 'amber', 'green', 'cyan', 'blue', 'magenta'] as const
export type FamilyHue = (typeof FAMILY_HUES)[number]
export type RampStep = keyof (typeof ramp)['red']
type GreyStep = keyof typeof greyRamp

/** A colour as the owner reads it: a ramp step, never a bare hex. */
export interface Swatch {
  hex: string
  label: string
}

export const AA = 4.5
export const NON_TEXT = 3

export const hueStep = (hue: FamilyHue, step: RampStep): Swatch => ({
  hex: ramp[hue][step],
  label: `${hue} ${step}`,
})
export const greyStep = (step: GreyStep): Swatch => ({
  hex: greyRamp[step],
  label: `grey ${step}`,
})
export const WHITE: Swatch = { hex: primitiveColors.white, label: 'white' }

export function nameOf(hex: string): string {
  const upper = hex.toUpperCase()
  if (upper === primitiveColors.white) return 'white'
  const grey = Object.entries(greyRamp).find(([, v]) => v.toUpperCase() === upper)
  if (grey) return `grey ${grey[0]}`
  for (const hue of FAMILY_HUES) {
    const step = Object.entries(ramp[hue]).find(([, v]) => v.toUpperCase() === upper)
    if (step) return `${hue} ${step[0]}`
  }
  return hex
}

const RGBA = /^rgba\((\d+), *(\d+), *(\d+), *([\d.]+)\)$/

/** A token value by ramp step: `red 400`, or `red 400 at 8%` for a wash. */
export function valueName(value: string): string {
  const m = RGBA.exec(value)
  if (!m) return nameOf(value)
  const hex = '#' + [m[1], m[2], m[3]].map((c) => Number(c).toString(16).padStart(2, '0')).join('')
  return `${nameOf(hex)} at ${Math.round(Number(m[4]) * 100)}%`
}

function wash(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const fmt = (n: number) => n.toFixed(2)

// ── FD1: the plane set ────────────────────────────────────────────────────────

export interface Plane {
  /** `-2` … `+5`, or `input`. */
  level: string
  token: string
  swatch: Swatch
  carriesText: boolean
}

const LEVEL_TOKEN: Record<ElevationLevel, string> = {
  [-2]: 'background-frame',
  [-1]: 'background-base',
  0: 'surface-base',
  1: 'surface-elevated',
  2: 'surface-raised',
  3: 'surface-overlay',
  4: 'surface-overlay',
  5: 'surface-overlay',
}
const LEVELS: ElevationLevel[] = [-2, -1, 0, 1, 2, 3, 4, 5]
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

/** The ramp -2..+5 plus input; FD1's default: every level but the frame (-2) carries text. */
export function planeLadder(mode: ThemeMode): Plane[] {
  const levels = LEVELS.map((level) => {
    const hex = getElevationSurface(level, mode)
    return {
      level: signed(level),
      token: LEVEL_TOKEN[level],
      swatch: { hex, label: nameOf(hex) },
      carriesText: level !== -2,
    }
  })
  const input = getSemanticColors(mode)['surface-input']
  const inputPlane = { level: 'input', token: 'surface-input', carriesText: true }
  return [...levels, { ...inputPlane, swatch: { hex: input, label: nameOf(input) } }]
}

/** The distinct text-bearing planes a tone is measured on: -1 through +3 (+4, +5 and input repeat). */
export function textPlanes(mode: ThemeMode): Plane[] {
  return planeLadder(mode).filter((p) => ['-1', '0', '+1', '+2', '+3'].includes(p.level))
}

export const TEXT_TIERS = ['text-primary', 'text-secondary', 'text-tertiary'] as const

export function tierRatios(plane: Plane, mode: ThemeMode) {
  const colors = getSemanticColors(mode)
  return TEXT_TIERS.map((tier) => ({ tier, ratio: contrast(colors[tier], plane.swatch.hex) }))
}

// ── Cells and readings ────────────────────────────────────────────────────────

/** A fill and the label set on it. `fill` is a hex, or an rgba wash composited per plane. */
export interface Cell {
  name: string
  fill: string
  fillLabel: string
  on: Swatch
}

export interface Reading {
  plane: Plane
  /** The label on the fill as painted over this plane. */
  label: number
  /** The fill against the plane. */
  fill: number
}

export function readOn(cell: Cell, plane: Plane): Reading {
  const painted = compositeOver(cell.fill, plane.swatch.hex)
  return {
    plane,
    label: contrast(cell.on.hex, painted),
    fill: contrast(painted, plane.swatch.hex),
  }
}

export const readAll = (cell: Cell, mode: ThemeMode) =>
  textPlanes(mode).map((plane) => readOn(cell, plane))

export const worst = (readings: Reading[], key: 'label' | 'fill') =>
  Math.min(...readings.map((r) => r[key]))

// ── FD4: the subtle packages ──────────────────────────────────────────────────

export const TONES = ['brand', 'brand-secondary', 'success', 'warning', 'error', 'info'] as const
export type Tone = (typeof TONES)[number]

export const TONE_HUE: Record<Tone, FamilyHue> = {
  brand: 'orange',
  'brand-secondary': 'cyan',
  success: 'green',
  warning: 'amber',
  error: 'red',
  info: 'blue',
}

const TONE_ROLE: Record<Tone, string> = {
  brand: 'brand-primary',
  'brand-secondary': 'brand-secondary',
  success: 'status-success',
  warning: 'status-warning',
  error: 'status-error',
  info: 'status-info',
}

export type PackageId = 'opaque' | 'today' | 'alpha'

export interface SubtlePackage {
  id: PackageId
  title: string
  rule: Record<ThemeMode, string>
}

export const SUBTLE_PACKAGES: SubtlePackage[] = [
  {
    id: 'opaque',
    title: 'Package 1 · opaque ramp steps in both modes',
    rule: {
      light: 'Fill hue 200, label hue 800. One fixed value per cell, the same on every plane.',
      dark: 'Fill hue 900 (the candidate deep step), label hue 300. One fixed value per cell.',
    },
  },
  {
    id: 'today',
    title: 'Package 2 · today',
    rule: {
      light: 'Fill hue 100, label hue 700: the shipped *-subtle and on-*-subtle tokens.',
      dark: 'Alpha washes (8-12%) of the base tone, labels hue 300-400: the shipped tokens.',
    },
  },
  {
    id: 'alpha',
    title: 'Package 3 · alpha in both modes',
    rule: {
      light: 'Fill hue 500 at 12% over the plane, label hue 800. The label is read per plane.',
      dark: 'Fill hue 300 at 12% over the plane, label hue 300. The label is read per plane.',
    },
  },
]

/** The candidate wash alpha of package 3. */
export const SUBTLE_ALPHA = 0.12

function todayCell(tone: Tone, mode: ThemeMode): Cell {
  const colors = getSemanticColors(mode) as Record<string, string>
  const role = TONE_ROLE[tone]
  const fill = colors[`${role}-subtle`]
  const on = colors[`on-${role}-subtle`]
  return { name: tone, fill, fillLabel: valueName(fill), on: { hex: on, label: nameOf(on) } }
}

function opaqueCell(name: string, hue: FamilyHue, mode: ThemeMode): Cell {
  const [fill, on] = mode === 'light' ? [200, 800] : [900, 300]
  const swatch = hueStep(hue, fill as RampStep)
  return { name, fill: swatch.hex, fillLabel: swatch.label, on: hueStep(hue, on as RampStep) }
}

function alphaCell(tone: Tone, mode: ThemeMode): Cell {
  const hue = TONE_HUE[tone]
  const step = mode === 'light' ? 500 : 300
  const fill = wash(ramp[hue][step], SUBTLE_ALPHA)
  const on = hueStep(hue, mode === 'light' ? 800 : 300)
  return { name: tone, fill, fillLabel: `${hue} ${step} at 12%`, on }
}

export function subtleCell(pkg: PackageId, tone: Tone, mode: ThemeMode): Cell {
  if (pkg === 'today') return todayCell(tone, mode)
  if (pkg === 'alpha') return alphaCell(tone, mode)
  return opaqueCell(tone, TONE_HUE[tone], mode)
}

// ── FD5: the family ───────────────────────────────────────────────────────────

export type FamilyMember = FamilyHue | 'neutral'
export const FAMILY_MEMBERS: FamilyMember[] = [...FAMILY_HUES, 'neutral']

/** The one on-colour of a solid per mode. */
export const ON_SOLID: Record<ThemeMode, Swatch> = { light: WHITE, dark: greyStep(950) }

/** FD3's light ladder (600, with brand and warning kept at 500) and the shipped dark steps. */
export const SOLID_STEP: Record<ThemeMode, Record<FamilyHue, RampStep>> = {
  light: { red: 600, orange: 500, amber: 500, green: 600, cyan: 600, blue: 600, magenta: 600 },
  dark: { red: 500, orange: 400, amber: 300, green: 300, cyan: 500, blue: 500, magenta: 400 },
}

/** The light solids FD3 keeps at 500: owner picks, large-text AA. */
export const NAMED_EXCEPTIONS: FamilyHue[] = ['orange', 'amber']

const NEUTRAL_SOLID: Record<ThemeMode, Swatch> = { light: greyStep(700), dark: greyStep(200) }

/** Neutral by the same subtle rule: light grey 200 + 800; dark one step above every plane. */
const NEUTRAL_SUBTLE: Record<ThemeMode, [Swatch, Swatch]> = {
  light: [greyStep(200), greyStep(800)],
  dark: [greyStep(800), greyStep(200)],
}

export function solidCell(member: FamilyMember, mode: ThemeMode): Cell {
  const fill =
    member === 'neutral' ? NEUTRAL_SOLID[mode] : hueStep(member, SOLID_STEP[mode][member])
  return { name: member, fill: fill.hex, fillLabel: fill.label, on: ON_SOLID[mode] }
}

export function familySubtleCell(member: FamilyMember, mode: ThemeMode): Cell {
  if (member !== 'neutral') return opaqueCell(member, member, mode)
  const [fill, on] = NEUTRAL_SUBTLE[mode]
  return { name: member, fill: fill.hex, fillLabel: fill.label, on }
}

const HUE_ROLE: Partial<Record<FamilyHue, string>> = {
  red: 'status-error',
  orange: 'brand-primary',
  amber: 'status-warning',
  green: 'status-success',
  cyan: 'brand-secondary',
  blue: 'status-info',
}

/** What ships today under the member's role, against the family value. */
export function shippedLine(member: FamilyMember, kind: 'solid' | 'subtle', mode: ThemeMode) {
  const role = member === 'neutral' ? undefined : HUE_ROLE[member]
  if (!role) return 'today: no token'
  const token = `${role}-${kind}`
  const shipped = valueName((getSemanticColors(mode) as Record<string, string>)[token])
  const family = kind === 'solid' ? solidCell(member, mode) : familySubtleCell(member, mode)
  return shipped === family.fillLabel ? `today: ${token} (same)` : `today: ${token} is ${shipped}`
}

// ── FD3: the light solid ladder (record) ──────────────────────────────────────

export interface LadderRung {
  tone: Tone
  cell: Cell
  isException: boolean
  /** The edge against the -1 plane, grey 200: the worst light text plane. */
  edgeOnInset: number
}

export function lightLadder(): LadderRung[] {
  const inset = textPlanes('light')[0]
  return TONES.map((tone) => {
    const cell = solidCell(TONE_HUE[tone], 'light')
    return {
      tone,
      cell,
      isException: NAMED_EXCEPTIONS.includes(TONE_HUE[tone]),
      edgeOnInset: readOn(cell, inset).fill,
    }
  })
}
