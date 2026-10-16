/**
 * TD-789: the dark and light elevation ramps, level -2 to +5, per option. Pure data and
 * measurements; `ElevationRampsView.tsx` paints them. Every light option is a set of hexes
 * drawn from the existing grey ramp; `today` pins the light ramp the owner judged, so the
 * record survives the ramp that #800 ships.
 */
import { contrast, relativeLuminance } from '../../theme/color-checks'
import { getElevationShadow, getElevationSurface, type ElevationLevel } from '../../theme/elevation'
import { LIFT_AMBIENT, LIFT_RIM_ALPHA, type LiftStep } from '../../theme/lift-shadow'
import { greyRamp, primitiveColors } from '../../theme/tokens/primitives'
import type { ThemeMode } from '../../theme/tokens/semantic'

export const LEVELS: ElevationLevel[] = [-2, -1, 0, 1, 2, 3, 4, 5]

export const LEVEL_ROLE: Record<ElevationLevel, string> = {
  [-2]: 'frame (inset)',
  [-1]: 'background (inset)',
  [0]: 'base: the page',
  [1]: 'elevated',
  [2]: 'raised: Card default',
  [3]: 'overlay',
  [4]: 'overlay, floating',
  [5]: 'overlay, floating',
}

/** Levels 3-5 share the overlay plane by design (elevation-planes.ts): the lift separates them. */
const SHARED_PLANE_STEPS = new Set<ElevationLevel>([4, 5])

export type OptionKey = 'today' | 'q5c' | 'monotonic' | 'q5cInsets'
type Planes = Record<ElevationLevel, string>

export interface RampOption {
  key: OptionKey
  title: string
  summary: string
  /** Light planes per level. Dark is today's ramp in every option. */
  light: Planes
  /** Light lift: `today` is liftShadow(step, 'light'); the others the crisp rim-0.9 lift. */
  lightLift: 'today' | 'crisp'
  /** Levels whose light value the option does not define, with what was assumed. */
  assumed?: Partial<Record<ElevationLevel, string>>
}

const g = greyRamp
const white = primitiveColors.white

function planesFrom(hexes: [string, string, string, string, string, string]): Planes {
  const [frame, background, base, elevated, raised, overlay] = hexes
  return {
    [-2]: frame,
    [-1]: background,
    [0]: base,
    [1]: elevated,
    [2]: raised,
    [3]: overlay,
    [4]: overlay,
    [5]: overlay,
  }
}

function todayPlanes(mode: ThemeMode): Planes {
  return Object.fromEntries(LEVELS.map((l) => [l, getElevationSurface(l, mode)])) as Planes
}

export const OPTIONS: RampOption[] = [
  {
    key: 'today',
    title: '1 · Today on main',
    summary:
      'Light: frame grey[400], background grey[100], base white, elevated grey[50], raised grey[100], overlay white.',
    light: planesFrom([g[400], g[100], white, g[50], g[100], white]),
    lightLift: 'today',
  },
  {
    key: 'q5c',
    title: '2 · Q5 C as picked',
    summary:
      'surface-base grey[100], surface-elevated grey[50], surface-raised and surface-overlay white, under the crisp rim-0.9 lift.',
    light: planesFrom([g[400], g[100], g[100], g[50], white, white]),
    lightLift: 'crisp',
    assumed: {
      [-2]: 'Q5 C does not define background-frame; kept today’s grey[400].',
      [-1]: 'Q5 C does not define background-base; kept today’s grey[100].',
    },
  },
  {
    key: 'monotonic',
    title: '3 · Fully monotonic light',
    summary:
      'Lighter at every step up, as dark is: frame grey[400], background grey[300], base grey[200], elevated grey[100], raised grey[50], overlay white. Six planes, six existing steps, so the page drops to grey[200].',
    light: planesFrom([g[400], g[300], g[200], g[100], g[50], white]),
    lightLift: 'crisp',
  },
  {
    key: 'q5cInsets',
    title: '3b · Monotonic on Q5 C’s grey[100] page',
    summary:
      'Q5 C above the page, with the insets stepped down: frame grey[300], background grey[200]. Raised and overlay both stay white: a lighter overlay needs a value above white, which is no primitive (needs the owner).',
    light: planesFrom([g[300], g[200], g[100], g[50], white, white]),
    lightLift: 'crisp',
    assumed: {
      [3]: 'Needs the owner: no primitive is lighter than white, so overlay repeats raised.',
    },
  },
]

/** The crisp rim-0.9 light lift the owner picked (decisions-r3 L8): LIFT_AMBIENT scaled. */
export function crispLift(step: LiftStep): string {
  const layers = LIFT_AMBIENT[step].map(
    ({ y, blur, alpha }) =>
      `0 ${Math.round(y * 0.6)}px ${Math.round(blur * 0.6)}px rgba(0,0,0,${(alpha * 0.5).toFixed(2)})`
  )
  return [
    `inset 0 1px 0 rgba(255,255,255,${LIFT_RIM_ALPHA.light.toFixed(2)})`,
    '0 0 0 1px rgba(0,0,0,0.08)',
    ...layers,
  ].join(', ')
}

/** The boxShadow a level wears, as the browser receives it ('' for the flat page). */
export function liftFor(option: RampOption, level: ElevationLevel, mode: ThemeMode): string {
  if (mode === 'light' && option.lightLift === 'crisp' && level > 0) {
    return crispLift(level as LiftStep)
  }
  const style = getElevationShadow(level, mode) as { boxShadow?: string }
  return style.boxShadow ?? ''
}

export type StepVerdict = 'up' | 'shared' | 'flat' | 'down'

export interface LevelReading {
  level: ElevationLevel
  hex: string
  lift: string
  vsBelow?: number
  vsAbove?: number
  vsPage: number
  /** How this level steps from the one below it. */
  step?: StepVerdict
  assumed?: string
}

function verdict(level: ElevationLevel, hex: string, below: string): StepVerdict {
  const delta = relativeLuminance(hex) - relativeLuminance(below)
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return SHARED_PLANE_STEPS.has(level) ? 'shared' : 'flat'
}

export function planesFor(option: RampOption, mode: ThemeMode): Planes {
  return mode === 'light' ? option.light : todayPlanes('dark')
}

export function readRamp(option: RampOption, mode: ThemeMode): LevelReading[] {
  const planes = planesFor(option, mode)
  return LEVELS.map((level, i) => {
    const hex = planes[level]
    const below = i > 0 ? planes[LEVELS[i - 1]] : undefined
    const above = i < LEVELS.length - 1 ? planes[LEVELS[i + 1]] : undefined
    return {
      level,
      hex,
      lift: liftFor(option, level, mode),
      vsBelow: below === undefined ? undefined : contrast(hex, below),
      vsAbove: above === undefined ? undefined : contrast(hex, above),
      vsPage: contrast(hex, planes[0]),
      step: below === undefined ? undefined : verdict(level, hex, below),
      assumed: mode === 'light' ? option.assumed?.[level] : undefined,
    }
  })
}

/** The ramp step a hex sits on, by name. */
export function stepName(hex: string): string {
  if (hex.toUpperCase() === white) return 'white'
  const entry = Object.entries(greyRamp).find(([, v]) => v.toUpperCase() === hex.toUpperCase())
  return entry ? `grey[${entry[0]}]` : 'off-ramp'
}
