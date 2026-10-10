import { contrast } from '../../theme/color-checks'
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

/**
 * The lit zone against each faded neighbour, WCAG contrast. The owner called amber 500 beside
 * red 600 (1.26:1) too samey. 1.5:1 is the highest floor every zone can meet in light while its
 * neighbours stay visible: amber 300 is 1.82:1 on white, so the faintest orange above the plane
 * floor, orange 100, reaches only 1.51:1 against it.
 */
export const ADJACENT_FLOOR = 1.5

/**
 * A faded zone against `surface-base`. Palette B's faintest step, green 100 on white at 1.15:1,
 * still read as a zone to the owner; 1.1:1 keeps the near-plane ramp ends (50 on white, 900 and
 * 950 on dark) out of the palette.
 */
export const PLANE_FLOOR = 1.1

/** Palette B, two steps toward the plane, is the owner's pick over one step, so no zone fades less. */
const MIN_FADE_STEPS = 2

export type PaletteId = 'adjacentFloor' | 'darkFurther' | 'lightCoolFurther'

export interface FadedPalette {
  title: string
  /** How the palette picks each faded step, for the owner. */
  note: string
  fade: (zones: RampColor[], mode: ThemeMode) => RampColor[]
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

const planeOf = (mode: ThemeMode) => getSemanticColors(mode)['surface-base']

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

/** Every step from the minimum fade to the ramp's plane end, nearest the zone first. */
function fadeCandidates(zone: RampColor, mode: ThemeMode): RampColor[] {
  const candidates: RampColor[] = []
  for (let steps = MIN_FADE_STEPS; steps < STEPS.length; steps++) {
    const next = stepDown(zone, mode, steps)
    if (candidates[candidates.length - 1]?.step === next.step) break
    candidates.push(next)
  }
  return candidates
}

/**
 * Per zone, the nearest step at least two down that clears the floor against both neighbours'
 * lit colours and stays visible on the plane. A zone with no such step keeps palette B's step,
 * and the story shows the miss.
 */
function floorFade(zones: RampColor[], mode: ThemeMode): RampColor[] {
  const plane = planeOf(mode)
  return zones.map((zone, i) => {
    const neighbours = [zones[i - 1], zones[i + 1]].filter((n): n is RampColor => n != null)
    const candidates = fadeCandidates(zone, mode)
    const clears = (c: RampColor) =>
      contrast(c.hex, plane) >= PLANE_FLOOR &&
      neighbours.every((n) => contrast(c.hex, n.hex) >= ADJACENT_FLOOR)
    return candidates.find(clears) ?? candidates[0]
  })
}

/** Palette B, with one more step for the zones `applies` picks in `extraMode`. */
const paletteBPlus =
  (extraMode: ThemeMode, applies: (zone: RampColor) => boolean) =>
  (zones: RampColor[], mode: ThemeMode): RampColor[] =>
    zones.map((zone) => {
      const extra = mode === extraMode && applies(zone) ? 1 : 0
      return stepDown(zone, mode, MIN_FADE_STEPS + extra)
    })

export const PALETTES: Record<PaletteId, FadedPalette> = {
  adjacentFloor: {
    title: `Chosen: lit vs adjacent faded at least ${ADJACENT_FLOOR}:1`,
    note:
      `Each zone fades at least two steps (palette B), and further only until the lit zone on ` +
      `either side clears ${ADJACENT_FLOOR}:1 against it, while it stays at least ` +
      `${PLANE_FLOOR}:1 on the plane.`,
    fade: floorFade,
  },
  darkFurther: {
    title: 'Owner alternative: one more step down in dark',
    note: 'Dark: every zone three steps down. Light: palette B (two steps).',
    fade: paletteBPlus('dark', () => true),
  },
  lightCoolFurther: {
    title: 'Owner alternative: cyan and blue one more shade down in light',
    note: 'Light: cyan and blue three steps down, the rest two. Dark: palette B (two steps).',
    fade: paletteBPlus('light', (zone) => zone.ramp === 'cyan' || zone.ramp === 'blue'),
  },
}

export interface ZoneReading {
  color: RampColor
  lit: boolean
  /** WCAG contrast against the lit zone, set only on the lit zone's faded neighbours. */
  vsLit?: number
  /** WCAG contrast against `surface-base`. */
  vsPlane: number
}

/** The zones with only `lit` at full colour, each measured against the lit zone and the plane. */
export function highlightZones(
  palette: PaletteId,
  scale: ScaleId,
  mode: ThemeMode,
  lit: number
): ZoneReading[] {
  const zones = scaleZones(scale, mode)
  const faded = PALETTES[palette].fade(zones, mode)
  const plane = planeOf(mode)
  return zones.map((zone, i) => {
    const color = i === lit ? zone : faded[i]
    const adjacent = Math.abs(i - lit) === 1
    return {
      color,
      lit: i === lit,
      vsLit: adjacent ? contrast(color.hex, zones[lit].hex) : undefined,
      vsPlane: contrast(color.hex, plane),
    }
  })
}

/** The faded step each zone takes in a palette. */
export function fadedPalette(palette: PaletteId, scale: ScaleId, mode: ThemeMode): RampColor[] {
  return PALETTES[palette].fade(scaleZones(scale, mode), mode)
}
