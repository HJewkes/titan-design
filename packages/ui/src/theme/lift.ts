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

export type LiftStep = 1 | 2 | 3 | 4 | 5

/** The lowest lift that is FLOATING (menu, popover, toast) rather than content. */
export const FLOATING_LIFT_MIN: LiftStep = 4

/** Rim-light alpha per mode. Light mode is a placeholder pending its own pass. */
export const LIFT_RIM_ALPHA: Record<ThemeMode, number> = { dark: 0.12, light: 0.9 }

interface ShadowLayer {
  y: number
  blur: number
  alpha: number
}

const AMBIENT: Record<LiftStep, ShadowLayer[]> = {
  1: [
    { y: 1, blur: 2, alpha: 0.35 },
    { y: 2, blur: 6, alpha: 0.3 },
  ],
  2: [
    { y: 1, blur: 2, alpha: 0.35 },
    { y: 4, blur: 12, alpha: 0.32 },
  ],
  3: [
    { y: 2, blur: 4, alpha: 0.35 },
    { y: 8, blur: 22, alpha: 0.35 },
  ],
  4: [
    { y: 1, blur: 2, alpha: 0.35 },
    { y: 10, blur: 24, alpha: 0.3 },
    { y: 24, blur: 48, alpha: 0.2 },
  ],
  5: [
    { y: 2, blur: 4, alpha: 0.4 },
    { y: 16, blur: 32, alpha: 0.35 },
    { y: 32, blur: 64, alpha: 0.25 },
  ],
}

/** A light surface casts a lighter shadow: same geometry, scaled alpha. */
const AMBIENT_ALPHA_SCALE: Record<ThemeMode, number> = { dark: 1, light: 0.4 }

export interface LiftOptions {
  /** Override the rim alpha. `0` drops the rim and leaves the ambient shadow alone. */
  rim?: number
}

function ambientLayers(step: LiftStep, mode: ThemeMode): string[] {
  const scale = AMBIENT_ALPHA_SCALE[mode]
  return AMBIENT[step].map(
    ({ y, blur, alpha }) => `0 ${y}px ${blur}px rgba(0,0,0,${(alpha * scale).toFixed(2)})`
  )
}

/** The web boxShadow string for a lift: rim first, then the ambient layers. */
export function liftShadow(step: LiftStep, mode: ThemeMode = 'dark', opts: LiftOptions = {}) {
  const rim = opts.rim ?? LIFT_RIM_ALPHA[mode]
  const layers = ambientLayers(step, mode)
  if (rim > 0) layers.unshift(`inset 0 1px 0 rgba(255,255,255,${rim.toFixed(2)})`)
  return layers.join(', ')
}

/** Platform style for a lift. Compose after `backgroundColor`; never instead of it. */
export function liftStyle(
  step: LiftStep,
  mode: ThemeMode = 'dark',
  opts: LiftOptions = {}
): ViewStyle {
  const deepest = AMBIENT[step][AMBIENT[step].length - 1]
  return Platform.select({
    web: { boxShadow: liftShadow(step, mode, opts) } as unknown as ViewStyle,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: Math.round(deepest.y / 2) },
      shadowOpacity: deepest.alpha * AMBIENT_ALPHA_SCALE[mode],
      shadowRadius: deepest.blur / 2,
      elevation: step,
    },
  }) as ViewStyle
}
