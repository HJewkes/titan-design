// The on-surface context object (TD-05.12), kept in the theme tier so
// `ThemeProvider` can seed it without importing a component (TD-511).
// `components/ui/surface/SurfaceContext` re-exports it for existing callers.
import { useContext } from 'react'
import { sharedContext } from './shared-context'
import type { ThemeMode } from './tokens/semantic'
import type { SurfaceLevel } from './surface-planes'

export interface SurfaceContextValue {
  /** Active theme mode. Defaults to dark (the wall). */
  mode: ThemeMode
  /** Plane of the nearest enclosing Surface. */
  level: SurfaceLevel
}

// Default context: dark 'base' plane, so descendants OUTSIDE any Surface still
// resolve to real dark colours (never black) on the dark-only wall.
const DEFAULT_CONTEXT: SurfaceContextValue = { mode: 'dark', level: 'base' }

// Shared, so a root `Surface` or the /theme `ThemeProvider` reaches readers bundled into
// /workout, /pages and /bodymap.
export const SurfaceContext = sharedContext<SurfaceContextValue>('SurfaceContext', DEFAULT_CONTEXT)

/** The nearest surface context ({ mode, level }); default dark 'base'. */
export function useSurface(): SurfaceContextValue {
  return useContext(SurfaceContext)
}

/** The active theme mode from the nearest Surface/provider (default dark). */
export function useSurfaceMode(): ThemeMode {
  return useContext(SurfaceContext).mode
}
