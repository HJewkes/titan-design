import {
  contrast,
  cvdDelta,
  deltaE,
  grayOfValue,
  minAdjacent,
  minPairwise,
  toOklab,
} from '../../theme/color-checks'
import { CATEGORICAL_CVD_SAFE_MAX } from '../../theme/tokens/primitives'
import { planeColors, setColors, type CategoricalSet } from './categorical-revisit.candidates'

/** WCAG 1.4.11 non-text floor; a plane under it gets a cross in the story. */
export const PLANE_FLOOR = 3

export interface SlotMeasurement {
  hex: string
  /** OKLab lightness. */
  lightness: number
  grey: string
  /** Contrast against each of `CATEGORICAL_PLANES`, in order. */
  planes: number[]
  worst: number
}

/**
 * A CVD ΔE under both conventions: `gate` is `cvdDelta` as `token-cvd.test.ts` runs it
 * (simulation unclamped); `plan` zeroes negative simulated channels, as the TD-756 plan's
 * appendix A script does. They differ where a simulated colour leaves the gamut.
 */
export interface CvdFigure {
  gate: number
  plan: number
}

export interface SetMeasurement {
  slots: SlotMeasurement[]
  /** All-pairs worst deutan/protan ΔE through the CVD-safe slots (the original gate, floor 8). */
  cvdSafe: CvdFigure
  /** All-pairs CVD ΔE including the extended 7th slot (not gated). */
  cvdWithExtended: CvdFigure
  /** Neighbouring CVD ΔE, the VW-371 rule. */
  cvdAdjacent: CvdFigure
  /** All-pairs tritan ΔE through the CVD-safe slots, printed only. */
  tritanSafe: CvdFigure
  /** Neighbouring normal-vision ΔE, the VW-371 rule (floor 15). */
  normalAdjacent: number
}

type Metric = (a: string, b: string) => number
const RED_GREEN = ['deutan', 'protan'] as const

function figure(
  measure: (metric: Metric) => number,
  kinds: Parameters<typeof cvdDelta>[2]
): CvdFigure {
  return {
    gate: measure((a, b) => cvdDelta(a, b, kinds)),
    plan: measure((a, b) => cvdDelta(a, b, kinds, { clampNegative: true })),
  }
}

function measureSlot(hex: string, planes: string[]): SlotMeasurement {
  const ratios = planes.map((plane) => contrast(hex, plane))
  return {
    hex,
    lightness: toOklab(hex)[0],
    grey: grayOfValue(hex),
    planes: ratios,
    worst: Math.min(...ratios),
  }
}

export function measureSet(set: CategoricalSet): SetMeasurement {
  const colors = setColors(set)
  const safe = colors.slice(0, CATEGORICAL_CVD_SAFE_MAX)
  const planes = planeColors(set.mode)
  return {
    slots: colors.map((hex) => measureSlot(hex, planes)),
    cvdSafe: figure((metric) => minPairwise(safe, metric), RED_GREEN),
    cvdWithExtended: figure((metric) => minPairwise(colors, metric), RED_GREEN),
    cvdAdjacent: figure((metric) => minAdjacent(colors, metric), RED_GREEN),
    tritanSafe: figure((metric) => minPairwise(safe, metric), ['tritan']),
    normalAdjacent: minAdjacent(colors, deltaE),
  }
}
