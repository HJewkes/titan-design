// On-surface colour context (TD-05.12).
//
// A <Surface> owns a background from the surface ramp AND publishes the current
// theme mode so descendant text/icons resolve their colour from "what surface am
// I on" instead of a `text-*` className. Those classNames silently fail to black
// when the tree renders as raw RN in the standalone wall SPA (no global.css, no
// nativewind), which is the bug class this primitive retires.
import { createContext, useContext } from 'react'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import type { SurfaceLevel } from '../../../theme/surface-planes'

// The plane vocabulary lives in the theme so `elevation.ts` can resolve levels
// to planes without importing a component. Re-exported here for callers that
// reached it through the Surface module.
export {
  SURFACE_LEVEL_TOKEN,
  PLANE_ORDER,
  surfaceBackground,
  pressedLevel,
  raisedLevel,
  type SurfaceLevel,
} from '../../../theme/surface-planes'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** On-surface neutral text roles, resolved for the current surface + theme. */
export type OnSurfaceRole = 'primary' | 'secondary' | 'tertiary'

const ON_SURFACE_TOKEN = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
} as const satisfies Record<OnSurfaceRole, ColorToken>

export interface SurfaceContextValue {
  /** Active theme mode. Defaults to dark (the wall). */
  mode: ThemeMode
  /** Plane of the nearest enclosing Surface. */
  level: SurfaceLevel
}

// Default context: dark 'base' plane, so descendants OUTSIDE any Surface still
// resolve to real dark colours (never black) on the dark-only wall.
const DEFAULT_CONTEXT: SurfaceContextValue = { mode: 'dark', level: 'base' }

export const SurfaceContext = createContext<SurfaceContextValue>(DEFAULT_CONTEXT)

/** The nearest surface context ({ mode, level }); default dark 'base'. */
export function useSurface(): SurfaceContextValue {
  return useContext(SurfaceContext)
}

/** The active theme mode from the nearest Surface/provider (default dark). */
export function useSurfaceMode(): ThemeMode {
  return useContext(SurfaceContext).mode
}

/**
 * Literal-hex on-surface neutral text colours for a theme mode. Uses
 * `getSemanticColors` (literal hex), never `resolveColor` (which returns `var()`
 * under the RNW vitest alias), so values stay real in tested component code and
 * on raw-RN surfaces alike.
 */
export function onSurfaceColors(mode: ThemeMode): Record<OnSurfaceRole, string> {
  const c = getSemanticColors(mode)
  return {
    primary: c[ON_SURFACE_TOKEN.primary],
    secondary: c[ON_SURFACE_TOKEN.secondary],
    tertiary: c[ON_SURFACE_TOKEN.tertiary],
  }
}

/** Resolve one on-surface text colour for descendants of a Surface. */
export function useOnSurfaceColor(role: OnSurfaceRole = 'primary'): string {
  return getSemanticColors(useSurfaceMode())[ON_SURFACE_TOKEN[role]]
}
