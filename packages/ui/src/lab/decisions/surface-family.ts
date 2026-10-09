import { compositeOver, contrast } from '../../theme/color-checks'
import { greyRamp, primitiveColors, primitiveRamps as ramp } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

/**
 * Surface-system plan S2: the solid and subtle surface family for every ramp hue, per mode, with
 * one on-colour (solid) or one ramp-relative label rule (subtle) per mode. Nothing here edits a
 * token; every value is a `primitiveRamps` or `greyRamp` step, and every ratio is measured here.
 */
export const FAMILY_HUES = ['red', 'orange', 'amber', 'green', 'cyan', 'blue', 'magenta'] as const
export type FamilyHue = (typeof FAMILY_HUES)[number]
export type RampStep = keyof (typeof ramp)['red']
type GreyStep = keyof typeof greyRamp

/** A colour as the owner reads it: a ramp step, never a bare hex (item 136). */
export interface Swatch {
  hex: string
  label: string
}

export const AA = 4.5
export const LARGE_TEXT = 3

export const hueStep = (hue: FamilyHue, step: RampStep): Swatch => ({
  hex: ramp[hue][step],
  label: `${hue}[${step}]`,
})
export const greyStep = (step: GreyStep): Swatch => ({
  hex: greyRamp[step],
  label: `grey[${step}]`,
})
export const WHITE: Swatch = { hex: primitiveColors.white, label: 'white' }

/** The one on-colour of the solid family per mode (plan §2.1, §2.2): reading A of D1. */
export const ON_SOLID: Record<ThemeMode, Swatch> = { light: WHITE, dark: greyStep(950) }

/** Solid fill steps per mode. Light is hue[600] throughout; dark keeps the shipped status steps. */
export const SOLID_STEP: Record<ThemeMode, Record<FamilyHue, RampStep>> = {
  light: { red: 600, orange: 600, amber: 600, green: 600, cyan: 600, blue: 600, magenta: 600 },
  dark: { red: 500, orange: 400, amber: 300, green: 300, cyan: 500, blue: 500, magenta: 400 },
}

/** The neutral member of the solid family (TD-777): grey[700] in light, grey[200] in dark. */
export const NEUTRAL_SOLID: Record<ThemeMode, Swatch> = {
  light: greyStep(700),
  dark: greyStep(200),
}

/** What already ships under another name at the family's value (plan §2.1-§2.4). */
export const EXISTING: Record<FamilyHue, string> = {
  red: 'status-error',
  orange: 'brand-primary',
  amber: 'status-warning',
  green: 'status-success',
  cyan: 'brand-secondary',
  blue: 'status-info',
  magenta: 'new (no token)',
}

/** The dark subtle wash: hue[300] at this alpha over the plane, label hue[300] (plan §2.4). */
export const DARK_WASH_ALPHA = 0.12

export interface Plane {
  token: string
  swatch: Swatch
}

type PlaneToken = 'surface-base' | 'surface-elevated' | 'surface-raised' | 'surface-overlay'

const PLANE_TOKENS: Record<ThemeMode, readonly PlaneToken[]> = {
  light: ['surface-base', 'surface-elevated', 'surface-raised'],
  dark: ['surface-base', 'surface-elevated', 'surface-raised', 'surface-overlay'],
}

export function nameOf(hex: string): string {
  if (hex.toUpperCase() === primitiveColors.white) return 'white'
  const grey = Object.entries(greyRamp).find(([, v]) => v.toUpperCase() === hex.toUpperCase())
  return grey ? `grey[${grey[0]}]` : hex
}

/** The content planes of a mode (light: white, grey[50], grey[100]; dark: base to overlay). */
export function planesOf(mode: ThemeMode): Plane[] {
  const colors = getSemanticColors(mode)
  return PLANE_TOKENS[mode].map((token) => ({
    token,
    swatch: { hex: colors[token], label: nameOf(colors[token]) },
  }))
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface SurfacePair {
  hue: FamilyHue | 'neutral'
  /** The fill as painted: a hex, or an rgba wash for dark subtle. */
  fill: string
  fillLabel: string
  on: Swatch
}

export function solidPair(hue: FamilyHue, mode: ThemeMode): SurfacePair {
  const fill = hueStep(hue, SOLID_STEP[mode][hue])
  return { hue, fill: fill.hex, fillLabel: fill.label, on: ON_SOLID[mode] }
}

export function neutralSolidPair(mode: ThemeMode): SurfacePair {
  const fill = NEUTRAL_SOLID[mode]
  return { hue: 'neutral', fill: fill.hex, fillLabel: fill.label, on: ON_SOLID[mode] }
}

export function subtlePair(hue: FamilyHue, mode: ThemeMode): SurfacePair {
  if (mode === 'light') {
    return { hue, fill: ramp[hue][100], fillLabel: `${hue}[100]`, on: hueStep(hue, 700) }
  }
  const wash = rgba(ramp[hue][300], DARK_WASH_ALPHA)
  return { hue, fill: wash, fillLabel: `${hue}[300] at 12%`, on: hueStep(hue, 300) }
}

export interface PlaneReading {
  plane: Plane
  /** Label on the fill as painted over this plane. */
  label: number
  /** Fill against the plane (the non-text floor; subtle has none). */
  fill: number
}

export function readOnPlanes(pair: SurfacePair, mode: ThemeMode): PlaneReading[] {
  return planesOf(mode).map((plane) => {
    const painted = compositeOver(pair.fill, plane.swatch.hex)
    return {
      plane,
      label: contrast(pair.on.hex, painted),
      fill: contrast(painted, plane.swatch.hex),
    }
  })
}

export const worst = (readings: PlaneReading[], key: 'label' | 'fill') =>
  Math.min(...readings.map((r) => r[key]))

export const fmt = (n: number) => n.toFixed(2)
