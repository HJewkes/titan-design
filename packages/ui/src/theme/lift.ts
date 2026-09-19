/**
 * LIFT — the treatment a plane wears when it sits above its neighbour.
 *
 * Tone says which plane a container sits on; lift says it is resting ON the one
 * below. Two cues, both lit from above:
 *
 *   RIM      a crisp 1px top rim-light. The one neumorphism half that survives
 *            near black. paperSheet's hero rim is 0.20 (VW-99 run 2); a card is
 *            not a hero, so the default lift sits one grade quieter at 0.12,
 *            chosen against 0.20 side by side in Lab/Depth (2026-09-08).
 *   AMBIENT  a soft shadow cast onto the plane below, growing with the number of
 *            planes crossed. Content lifts (1–3) are tight; floating lifts (4–5)
 *            are large and soft, describing separation from the page rather than
 *            rank in a stack.
 *
 * Neither cue is a hairline ring: a ring is an edge, not a lift, and stays the
 * divider's job. Web carries the multi-layer boxShadow; native gets the single
 * shadow* set. The tone underneath is load-bearing on its own either way.
 */
import { Platform, type ViewStyle } from 'react-native'
import type { ThemeMode } from './tokens/semantic'
import {
  LIFT_AMBIENT,
  LIFT_AMBIENT_ALPHA_SCALE,
  liftShadow,
  type LiftOptions,
  type LiftStep,
} from './lift-shadow'

export {
  FLOATING_LIFT_MIN,
  LIFT_RIM_ALPHA,
  liftShadow,
  type LiftOptions,
  type LiftStep,
} from './lift-shadow'

/** Platform style for a lift. Compose after `backgroundColor`; never instead of it. */
export function liftStyle(
  step: LiftStep,
  mode: ThemeMode = 'dark',
  opts: LiftOptions = {}
): ViewStyle {
  const deepest = LIFT_AMBIENT[step][LIFT_AMBIENT[step].length - 1]
  return Platform.select({
    web: { boxShadow: liftShadow(step, mode, opts) } as unknown as ViewStyle,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: Math.round(deepest.y / 2) },
      shadowOpacity: deepest.alpha * LIFT_AMBIENT_ALPHA_SCALE[mode],
      shadowRadius: deepest.blur / 2,
      elevation: step,
    },
  }) as ViewStyle
}
