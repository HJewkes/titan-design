// The rail's chip timeline: pure functions of position, so a seek or a frame-stepped
// capture reproduces every frame.
import { interpolate } from '../motion/interpolate'
import { easeOut, poly } from '../motion/easing'

/** A rail chip's state, announced in its accessibility label. */
export type ProgressStepState = 'done' | 'active' | 'pending'

/** The core grows as the position arrives at a chip, and on to a full disc as it leaves. */
const coreEase = easeOut(poly(2))
/** Core diameter, as a share of the chip, while the position rests on it: a dot in a ring. */
const RESTING_CORE = 50
/**
 * A chip's timeline, in steps of position relative to its anchor: the core grows to the
 * resting dot over `ARRIVE`, fills the chip over `FILL`, then the done colour fades in over
 * `FADE`. Pure functions of position, so a seek or a frame-stepped capture reproduces it.
 */
const ARRIVE = 0.5
const FILL = 0.25
const FADE = 0.25

/** Where a chip's resting point sits: the last step's runs early, so the rail ends done. */
function chipAnchor(index: number, totalSteps: number): number {
  return index === totalSteps - 1 ? index - FILL - FADE : index
}

/** Steps behind the position are done; the step it is moving toward (or resting on) is active. */
function stepStateAt(index: number, position: number, totalSteps: number): ProgressStepState {
  if (index === totalSteps - 1 && position >= totalSteps - 1) return 'done'
  const active = Math.ceil(position)
  if (index < active) return 'done'
  return index === active ? 'active' : 'pending'
}

export interface ChipLook {
  state: ProgressStepState
  /** Brand core diameter, percent of the chip. */
  core: number
  /** Opacity of the done-colour layer over the core. */
  done: number
}

export function chipLook(index: number, position: number, totalSteps: number): ChipLook {
  const anchor = chipAnchor(index, totalSteps)
  const core =
    position <= anchor
      ? interpolate(position, [anchor - ARRIVE, anchor], [0, RESTING_CORE], { ease: coreEase })
      : interpolate(position, [anchor, anchor + FILL], [RESTING_CORE, 100], { ease: coreEase })
  const done = interpolate(position, [anchor + FILL, anchor + FILL + FADE], [0, 1])
  return { state: stepStateAt(index, position, totalSteps), core, done }
}

export function railPosition(position: number, totalSteps: number, reducedMotion: boolean): number {
  const clamped = Math.min(Math.max(position, 0), Math.max(totalSteps - 1, 0))
  // Reduced motion shows where each transition ends: the active step reached, connectors full.
  return reducedMotion ? Math.ceil(clamped) : clamped
}
