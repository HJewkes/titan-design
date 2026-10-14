// Pure state-chip look: every value is f(state, from, progress); nothing reads a clock.
// Imported by file, not through the motion barrel, so the index entry pulls only these three.
import { interpolateColor } from '../motion/color'
import { easeInOut, easeOut, poly } from '../motion/easing'
import { interpolate } from '../motion/interpolate'
import type { ChipState } from './chipState'

/** Entering `met`, the warning fill runs over `[0, FILL_END]` and the turn to success over `[FILL_END, 1]`. */
export const FILL_END = 0.6

/** A state chip's paint at one instant of a transition. */
export interface StateChipLook {
  /** Width fraction of the warning fill, 0..1. Only entering `met` fills. */
  fill: number
  /** Opacity of the target state's face over the `from` face and the fill, 0..1. */
  tint: number
  /** True once the transition has finished, or when there is none. */
  settled: boolean
  /** Dashed while the chip reads unmet, the non-colour signal beside the label. */
  border: 'dashed' | 'solid'
}

const fillEase = easeOut(poly(2))
const turnEase = easeInOut(poly(2))

const borderOf = (state: ChipState) => (state === 'unmet' ? 'dashed' : 'solid')

/**
 * The look of a chip moving from `from` to `state` at `progress` 0..1. Entering `met` fills to
 * the warning tone, then turns to success; any other change cross-fades with no fill. Both
 * curves are monotone and never pass 1, so nothing overshoots.
 */
export function stateChipLook(
  state: ChipState,
  from: ChipState | undefined,
  progress: number
): StateChipLook {
  if (from === undefined || from === state) {
    return { fill: 0, tint: 1, settled: true, border: borderOf(state) }
  }
  const fills = state === 'met'
  const fill = fills ? interpolate(progress, [0, FILL_END], [0, 1], { ease: fillEase }) : 0
  const turnStart = fills ? FILL_END : 0
  const tint = interpolate(progress, [turnStart, 1], [0, 1], { ease: turnEase })
  return { fill, tint, settled: progress >= 1, border: borderOf(tint < 0.5 ? from : state) }
}

/** Mixes two resolved hex colours at `tint` 0..1, in Oklab. */
export function stateChipColor(tint: number, [from, to]: readonly [string, string]): string {
  return interpolateColor(tint, [0, 1], [from, to])
}

/**
 * The label colour for `look`: toward the warning label while the fill runs, then on to the
 * target state's label as the face turns. Takes resolved hex values for one theme mode.
 */
export function stateChipLabelColor(
  look: StateChipLook,
  [from, warning, to]: readonly [string, string, string]
): string {
  if (look.tint > 0) return stateChipColor(look.tint, [look.fill > 0 ? warning : from, to])
  return stateChipColor(look.fill, [from, warning])
}
