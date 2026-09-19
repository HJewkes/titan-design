/**
 * The pure data behind elevation: which ramp plane each level sits on, and the
 * glow scale. No react-native import, so the token CSS generator can load it in
 * plain Node. Behaviour and rationale are documented in `elevation.ts`.
 */
import type { SurfaceLevel } from './surface-planes'

export type ElevationLevel = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5

export const ELEVATION_PLANE: Record<ElevationLevel, SurfaceLevel> = {
  [-2]: 'frame',
  [-1]: 'background',
  [0]: 'base',
  [1]: 'elevated',
  [2]: 'raised',
  [3]: 'overlay',
  [4]: 'overlay',
  [5]: 'overlay',
}

export type GlowIntensity = 'tight' | 'subtle' | 'medium' | 'strong'

// Four fixed intensities, chosen by EMPHASIS rather than by the element's size:
// a caller says how loud the glow should be, not how big the thing is. `tight`
// is the close halo a small indicator wore before glows were centralised; it is
// kept as a rung on the scale so that look stays reachable.
export const GLOW_CONFIG: Record<GlowIntensity, { blur: number; spread: number; opacity: number }> = {
  tight: { blur: 4, spread: 0, opacity: 0.4 },
  subtle: { blur: 12, spread: 0, opacity: 0.25 },
  medium: { blur: 20, spread: 2, opacity: 0.4 },
  strong: { blur: 30, spread: 4, opacity: 0.55 },
}
