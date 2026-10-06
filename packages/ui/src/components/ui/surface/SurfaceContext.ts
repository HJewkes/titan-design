// On-surface colour context (TD-05.12).
//
// A <Surface> owns a background from the surface ramp AND publishes the current
// theme mode so descendant text/icons resolve their colour from "what surface am
// I on" instead of a `text-*` className. Those classNames silently fail to black
// when the tree renders as raw RN in the standalone wall SPA (no global.css, no
// nativewind), which is the bug class this primitive retires.
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../../theme/surface-context'

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
// The context object lives in the theme so `ThemeProvider` can seed it without
// importing a component (TD-511).
export {
  SurfaceContext,
  useSurface,
  useSurfaceMode,
  type SurfaceContextValue,
} from '../../../theme/surface-context'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** On-surface neutral text roles, resolved for the current surface + theme. */
export type OnSurfaceRole = 'primary' | 'secondary' | 'tertiary'

const ON_SURFACE_TOKEN = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
} as const satisfies Record<OnSurfaceRole, ColorToken>

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
