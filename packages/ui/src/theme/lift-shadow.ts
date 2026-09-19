/**
 * The pure half of LIFT: shadow geometry and the web boxShadow string. No
 * react-native import, so the token CSS generator can load it in plain Node.
 * The treatment itself is documented in `lift.ts`.
 */
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

export const LIFT_AMBIENT: Record<LiftStep, ShadowLayer[]> = {
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
export const LIFT_AMBIENT_ALPHA_SCALE: Record<ThemeMode, number> = { dark: 1, light: 0.4 }

export interface LiftOptions {
  /** Override the rim alpha. `0` drops the rim and leaves the ambient shadow alone. */
  rim?: number
}

function ambientLayers(step: LiftStep, mode: ThemeMode): string[] {
  const scale = LIFT_AMBIENT_ALPHA_SCALE[mode]
  return LIFT_AMBIENT[step].map(
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
