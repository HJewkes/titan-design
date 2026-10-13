import { insetFieldFill } from '../../components/ui/surface/insetField'
import { contrast, deltaE } from '../../theme/color-checks'
import { pressedLevel, surfaceBackground, type SurfaceLevel } from '../../theme/surface-planes'
import { greyRamp } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

export const MODES: ThemeMode[] = ['light', 'dark']

/** The five planes a filled field sits on, darkest level first. */
export const PLANES = [
  'background',
  'base',
  'elevated',
  'raised',
  'overlay',
] as const satisfies readonly SurfaceLevel[]
export type Plane = (typeof PLANES)[number]

export type WellOptionKey = 'asBuilt' | 'planeColour' | 'raisedWell' | 'rampStep'

export interface WellOption {
  key: WellOptionKey
  name: string
  note: string
  well: (plane: Plane, mode: ThemeMode) => string
}

// White, then the grey ramp from light to dark: the light ramp's planes include white, which is
// not a ramp step.
const LIGHT_TO_DARK = ['#FFFFFF', ...Object.values(greyRamp)]

/** One step darker on the grey ramp than the plane's own colour. */
function rampStepBelow(plane: Plane, mode: ThemeMode): string {
  const index = LIGHT_TO_DARK.indexOf(surfaceBackground(plane, mode))
  return LIGHT_TO_DARK[index + 1]
}

export const WELL_OPTIONS: WellOption[] = [
  {
    key: 'asBuilt',
    name: 'As built in batch 10: one plane down by level',
    note:
      'The well is the plane one level down (pressedLevel). Dark is monotonic. Light planes repeat ' +
      'colours, so the two #EDEAE7 planes get different wells (grey 400 on background, #F9F6F3 on raised).',
    well: (plane, mode) => surfaceBackground(pressedLevel(plane), mode),
  },
  {
    key: 'planeColour',
    name: "Option 1, the owner's (1): the well is the plane's own colour in light (ships)",
    note:
      'Light: overlay’s #EDEAE7 well moves to the #EDEAE7 planes (background, raised), the white well ' +
      'to the white planes (base, overlay), #F9F6F3 to elevated, so a lighter plane has a lighter well ' +
      'and the recess alone draws the inset. Dark keeps one plane down, already monotonic. The PR ships this.',
    well: insetFieldFill,
  },
  {
    key: 'raisedWell',
    name: "Option 2, the owner's (2): every well is the raised plane's well",
    note:
      'One well on every plane: #F9F6F3 in light, #2C2A28 in dark. On the darker planes the well is ' +
      'lighter than the plane it is cut into.',
    well: (_plane, mode) => surfaceBackground(pressedLevel('raised'), mode),
  },
  {
    key: 'rampStep',
    name: 'Option 3, mine: one grey-ramp step darker than the plane colour (needs the owner)',
    note:
      'Keyed by colour, so equal planes get equal wells, and every well keeps a visible step (native ' +
      'has no recess). Dark is identical to as built. Light background and raised take grey 200 ' +
      '#D4D1CE, an existing ramp step that no plane uses: shipping it needs a new well token.',
    well: rampStepBelow,
  },
]

export interface WellMeasure {
  plane: string
  well: string
  /** WCAG contrast of the well against the plane. */
  againstPlane: number
  /** OKLab ΔE × 100 of the well from the plane. */
  deltaE: number
  /** text-primary on the well. */
  text: number
}

export function measureWell(option: WellOption, plane: Plane, mode: ThemeMode): WellMeasure {
  const planeHex = surfaceBackground(plane, mode)
  const well = option.well(plane, mode)
  return {
    plane: planeHex,
    well,
    againstPlane: contrast(well, planeHex),
    deltaE: deltaE(well, planeHex),
    text: contrast(getSemanticColors(mode)['text-primary'], well),
  }
}

export function modeColorProperties(mode: ThemeMode): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getSemanticColors(mode)).map(([token, value]) => [`--color-${token}`, value])
  )
}
