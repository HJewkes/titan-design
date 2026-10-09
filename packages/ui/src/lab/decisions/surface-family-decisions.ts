import { contrast, relativeLuminance } from '../../theme/color-checks'
import { greyRamp, primitiveRamps as ramp } from '../../theme/tokens/primitives'
import type { ThemeMode } from '../../theme/tokens/semantic'
import {
  FAMILY_HUES,
  LARGE_TEXT,
  ON_SOLID,
  SOLID_STEP,
  WHITE,
  hueStep,
  planesOf,
  type FamilyHue,
  type RampStep,
  type Swatch,
} from './surface-family'

/** One fill with one label and their measured ratio. */
export interface LabelledFill {
  hue: FamilyHue
  fill: Swatch
  label: Swatch
  ratio: number
}

const pair = (hue: FamilyHue, step: RampStep, label: Swatch): LabelledFill => {
  const fill = hueStep(hue, step)
  return { hue, fill, label, ratio: contrast(label.hex, fill.hex) }
}

/** D2: light brand (orange) and warning (amber) solids, kept at 500 or moved to 600. */
export interface D2Option {
  id: 'keep-500' | 'move-600'
  title: string
  summary: string
  pairs: LabelledFill[]
}

export const D2_OPTIONS: readonly D2Option[] = [
  {
    id: 'keep-500',
    title: 'Keep orange[500] and amber[500] as named exceptions (default)',
    summary:
      'The batch 10 picks. White clears 3:1 (large text) but not 4.5, so both sit in the exception register. Shown as swatches: their labels miss AA.',
    pairs: [pair('orange', 500, WHITE), pair('amber', 500, WHITE)],
  },
  {
    id: 'move-600',
    title: 'Move both to 600, like every other light solid',
    summary: 'No exceptions left in the light solid family; both fills turn browner.',
    pairs: [pair('orange', 600, WHITE), pair('amber', 600, WHITE)],
  },
]

/** The label of the other mode on this mode's family fill, and the best any 3:1 fill step allows. */
export interface CrossModeReading extends LabelledFill {
  best: LabelledFill
}

const STEPS = Object.keys(ramp.red).map(Number) as RampStep[]

function bestStep(hue: FamilyHue, mode: ThemeMode, label: Swatch): LabelledFill {
  const planes = planesOf(mode).map((p) => p.swatch.hex)
  const eligible = STEPS.filter((step) =>
    planes.every((plane) => contrast(ramp[hue][step], plane) >= LARGE_TEXT)
  )
  const readings = eligible.map((step) => pair(hue, step, label))
  return readings.reduce((a, b) => (b.ratio > a.ratio ? b : a))
}

function crossMode(mode: ThemeMode, label: Swatch): CrossModeReading[] {
  return FAMILY_HUES.map((hue) => ({
    ...pair(hue, SOLID_STEP[mode][hue], label),
    best: bestStep(hue, mode, label),
  }))
}

/** D1 reading B: one label hex in both modes, white or grey[950]. */
export function readD1() {
  return {
    whiteInDark: crossMode('dark', ON_SOLID.light),
    grey950InLight: crossMode('light', ON_SOLID.dark),
  }
}

/** D1 reading A: the family as built, each mode with its own on-colour. */
export function readRuleA(mode: ThemeMode): LabelledFill[] {
  return FAMILY_HUES.map((hue) => pair(hue, SOLID_STEP[mode][hue], ON_SOLID[mode]))
}

/** D5: the light subtle step as a function of the page (#800's ramp options). */
export interface D5Page {
  page: Swatch
  context: string
  rows: { hue: FamilyHue; today: D5Reading; rule: D5Reading }[]
}

export interface D5Reading extends LabelledFill {
  /** Fill against the page; above 1 either way, `lighter` says which way. */
  vsPage: number
  lighter: boolean
}

const PAGES: { step: 0 | 100 | 200; context: string; fill: RampStep }[] = [
  { step: 0, context: 'white page (today)', fill: 100 },
  { step: 100, context: 'grey[100] page (option 3b)', fill: 200 },
  { step: 200, context: 'grey[200] page (option 3, the owner’s pick)', fill: 300 },
]

function d5Reading(hue: FamilyHue, fill: RampStep, page: string): D5Reading {
  const labelled = pair(hue, fill, hueStep(hue, (fill + 600) as RampStep))
  return {
    ...labelled,
    vsPage: contrast(labelled.fill.hex, page),
    lighter: relativeLuminance(labelled.fill.hex) > relativeLuminance(page),
  }
}

export function readD5(): D5Page[] {
  return PAGES.map(({ step, context, fill }) => {
    const page: Swatch = step === 0 ? WHITE : { hex: greyRamp[step], label: `grey[${step}]` }
    return {
      page,
      context,
      rows: FAMILY_HUES.map((hue) => ({
        hue,
        today: d5Reading(hue, 100, page.hex),
        rule: d5Reading(hue, fill, page.hex),
      })),
    }
  })
}
