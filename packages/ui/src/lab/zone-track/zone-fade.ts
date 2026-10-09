import { compositeOver, contrast } from '../../theme/color-checks'
import { primitiveRamps } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { WORKOUT_TOKENS, heatmapColors } from '../../theme/workout-tokens'

type RampName = keyof typeof primitiveRamps
type RampStep = keyof (typeof primitiveRamps)['red']

const STEPS = Object.keys(primitiveRamps.red).map(Number) as RampStep[]

/** A zone colour named by the ramp step it is, so the story labels steps rather than hex. */
export interface RampColor {
  ramp: RampName
  step: RampStep
  hex: string
}

export type ScaleId = 'effort' | 'diverging'

export const SCALES: Record<ScaleId, string> = {
  effort: 'Effort (WORKOUT_TOKENS.scale, FatigueMeter)',
  diverging: 'Diverging (dataviz-diverging, VolumeLandmarkBar)',
}

export type PaletteId = 'stepOne' | 'stepTwo' | 'scrim'

/** Black at 15%: no scrim token has this alpha (scrim-press is 10%, scrim-press-strong 20%). */
const LIGHT_SCRIM_ALPHA = 0.15

export interface FadedPalette {
  title: string
  /** Owner-facing caveat, e.g. a value that is not a token yet. */
  note: string
  fade: (zone: RampColor, mode: ThemeMode) => FadedColor
}

export interface FadedColor {
  label: string
  hex: string
}

export function rampColor(hex: string): RampColor {
  for (const ramp of Object.keys(primitiveRamps) as RampName[]) {
    for (const step of STEPS) {
      if (primitiveRamps[ramp][step].toLowerCase() === hex.toLowerCase()) {
        return { ramp, step, hex: primitiveRamps[ramp][step] }
      }
    }
  }
  throw new Error(`${hex} is not a ramp step`)
}

export const rampLabel = ({ ramp, step }: Pick<RampColor, 'ramp' | 'step'>) => `${ramp} ${step}`

/** The zone colours each scale paints today, read from the same tokens the components read. */
export function scaleZones(scale: ScaleId, mode: ThemeMode): RampColor[] {
  if (scale === 'effort') {
    const { green, yellow, orange, red } = WORKOUT_TOKENS.scale
    return [green, yellow, orange, red].map(rampColor)
  }
  const heat = heatmapColors(mode)
  return [heat.under, heat.maintenance, heat.productive, heat.approaching, heat.over].map(rampColor)
}

/**
 * Steps toward the plane's end of the ramp: darker (toward 950) on the dark plane, lighter
 * (toward 50) on the light plane, so "down" always means closer to the background.
 */
export function stepDown(zone: RampColor, mode: ThemeMode, steps: number): RampColor {
  const from = STEPS.indexOf(zone.step)
  const to = mode === 'dark' ? from + steps : from - steps
  const step = STEPS[Math.min(Math.max(to, 0), STEPS.length - 1)]
  return { ramp: zone.ramp, step, hex: primitiveRamps[zone.ramp][step] }
}

const rampFade =
  (steps: number) =>
  (zone: RampColor, mode: ThemeMode): FadedColor => {
    const faded = stepDown(zone, mode, steps)
    return { label: rampLabel(faded), hex: faded.hex }
  }

function scrimFor(mode: ThemeMode): { label: string; color: string } {
  if (mode === 'dark') {
    return { label: 'scrim-subtle 30%', color: getSemanticColors('dark')['scrim-subtle'] }
  }
  return { label: 'black 15%', color: `rgba(0, 0, 0, ${LIGHT_SCRIM_ALPHA})` }
}

export const PALETTES: Record<PaletteId, FadedPalette> = {
  stepOne: {
    title: 'A. One ramp step down',
    note: 'Each zone one step toward the plane on its own ramp. No new token.',
    fade: rampFade(1),
  },
  stepTwo: {
    title: 'B. Two ramp steps down',
    note: 'Each zone two steps toward the plane on its own ramp. No new token.',
    fade: rampFade(2),
  },
  scrim: {
    title: 'C. Scrim',
    note:
      'Dark: scrim-subtle (black 30%, existing token). Light: black 15%, NEW alpha for the owner ' +
      '(the nearest tokens are scrim-press 10% and scrim-press-strong 20%).',
    fade: (zone, mode) => {
      const scrim = scrimFor(mode)
      return {
        label: `${rampLabel(zone)} + ${scrim.label}`,
        hex: compositeOver(scrim.color, zone.hex),
      }
    },
  },
}

export interface ZoneFadeMeasurement {
  bright: RampColor
  faded: FadedColor
  /** WCAG contrast of the faded colour against the bright one it replaces. */
  vsBright: number
  /** WCAG contrast of the faded colour against `surface-base`. */
  vsPlane: number
}

export function measureFade(
  palette: PaletteId,
  scale: ScaleId,
  mode: ThemeMode
): ZoneFadeMeasurement[] {
  const plane = getSemanticColors(mode)['surface-base']
  return scaleZones(scale, mode).map((bright) => {
    const faded = PALETTES[palette].fade(bright, mode)
    return {
      bright,
      faded,
      vsBright: contrast(faded.hex, bright.hex),
      vsPlane: contrast(faded.hex, plane),
    }
  })
}

/** Zone colours with only `lit` at full colour; every other zone takes the faded palette. */
export function highlightZones(
  palette: PaletteId,
  scale: ScaleId,
  mode: ThemeMode,
  lit: number
): string[] {
  return measureFade(palette, scale, mode).map((m, i) => (i === lit ? m.bright.hex : m.faded.hex))
}
