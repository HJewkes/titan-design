/**
 * The surface planes: the grey-ramp steps a container can sit on, darkest first.
 *
 * Every background a `<Surface>` or `<Card>` paints resolves through this list,
 * so a container can only ever land ON the ramp. Stepping up (a lifted card) or
 * down (a pressed well) is indexing `PLANE_ORDER`, clamped at both ends.
 *
 * `frame` is the bezel the ramp sits inside and the floor a pressed surface
 * clamps at. It replaced a separate `inset` level in TD-07.14: at ΔE 1.10 from
 * the frame that level was an imperceptible duplicate.
 */
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

export type SurfaceLevel = 'frame' | 'background' | 'base' | 'elevated' | 'raised' | 'overlay'

// Which semantic token backs each plane. Values live in `semantic.ts` and stay
// in sync with the grey ramp; this map never carries literal hexes.
export const SURFACE_LEVEL_TOKEN = {
  frame: 'background-frame',
  background: 'background-base',
  base: 'surface-base',
  elevated: 'surface-elevated',
  raised: 'surface-raised',
  overlay: 'surface-overlay',
} as const satisfies Record<SurfaceLevel, ColorToken>

/** Darkest → lightest. Kept in lockstep with the grey ramp and surface.contract.test. */
export const PLANE_ORDER = [
  'frame',
  'background',
  'base',
  'elevated',
  'raised',
  'overlay',
] as const satisfies readonly SurfaceLevel[]

/** The background hex for a plane under a theme mode (literal hex, never a var()). */
export function surfaceBackground(level: SurfaceLevel, mode: ThemeMode): string {
  return getSemanticColors(mode)[SURFACE_LEVEL_TOKEN[level]]
}

function stepPlane(from: SurfaceLevel, delta: number): SurfaceLevel {
  const index = PLANE_ORDER.indexOf(from)
  const clamped = Math.min(PLANE_ORDER.length - 1, Math.max(0, index + delta))
  return PLANE_ORDER[clamped]
}

/**
 * The plane a `<Surface pressed>` resolves to: its parent's plane stepped one
 * index DOWN the ramp, clamped at the `frame` floor.
 *   overlay→raised, raised→elevated, elevated→base, base→background,
 *   background→frame, frame→frame (clamped).
 */
export function pressedLevel(parent: SurfaceLevel): SurfaceLevel {
  return stepPlane(parent, -1)
}

/**
 * The plane a lifted surface resolves to: its parent's plane stepped `steps`
 * UP the ramp, clamped at `overlay`. The clamp is what makes raised-on-raised
 * unrepresentable: a card inside an overlay stays on the overlay and relies on
 * its lift treatment, never on a lighter grey that is not on the ramp.
 */
export function raisedLevel(parent: SurfaceLevel, steps: number): SurfaceLevel {
  return stepPlane(parent, Math.max(0, steps))
}
