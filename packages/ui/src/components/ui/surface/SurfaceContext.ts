// On-surface colour context (TD-05.12).
//
// A <Surface> owns a background from a small elevation scale AND publishes the
// current theme mode so descendant text/icons resolve their colour from "what
// surface am I on" instead of a `text-*` className. Those classNames silently
// fail to black when the tree renders as raw RN in the standalone wall SPA
// (no global.css, no nativewind) — the bug class this primitive retires.
import { createContext, useContext } from 'react'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/**
 * A Surface's depth on the dark surface ramp. Each addressable level maps to an
 * EXISTING semantic surface/background token (already grounded in the derived
 * surface ramp — TD-surface-tokens S-1 — and theme-aware) — Surface introduces
 * no new hexes. Darkest → lightest:
 *   inset (#13100D) < background (#1C1916) < base (#252321) < elevated (#2A2827) < raised (#2D2C2B) < overlay (#302F2E)
 *
 * `frame` is the bezel the ramp sits inside — the top bar / side nav chrome —
 * and the floor a `<Surface pressed>` clamps at (see {@link pressedLevel}).
 *
 * It replaced a separate `inset` level in TD-07.14. That level was RETIRED, not
 * renamed: at ΔE 1.10 from the frame it was an imperceptible duplicate, which is
 * exactly why pressed (surface − 1) kept collapsing into it.
 */
export type SurfaceLevel = 'frame' | 'background' | 'base' | 'elevated' | 'raised' | 'overlay'

/** On-surface neutral text roles, resolved for the current surface + theme. */
export type OnSurfaceRole = 'primary' | 'secondary' | 'tertiary'

// Which semantic token backs each level. Values live in `semantic.ts` and stay
// in sync with the grey ramp — this map never carries literal hexes. Every level
// is present now: swapping `inset` (which had no token) for `frame` (which does)
// is what made this a total map and removed `surfaceBackground`'s special case.
export const SURFACE_LEVEL_TOKEN = {
  frame: 'background-frame',
  background: 'background-base',
  base: 'surface-base',
  elevated: 'surface-elevated',
  raised: 'surface-raised',
  overlay: 'surface-overlay',
} as const satisfies Record<SurfaceLevel, ColorToken>

// Darkest → lightest. A `<Surface pressed>` renders one index DOWN from its
// parent's level and clamps at `frame` (index 0). Kept in lockstep with the grey
// ramp and the surface.contract.test PLANE_ORDER.
const PRESSED_RAMP = ['frame', 'background', 'base', 'elevated', 'raised', 'overlay'] as const

const ON_SURFACE_TOKEN = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
} as const satisfies Record<OnSurfaceRole, ColorToken>

export interface SurfaceContextValue {
  /** Active theme mode. Defaults to dark (the wall). */
  mode: ThemeMode
  /** Depth of the nearest enclosing Surface. */
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
 * `getSemanticColors` (literal hex — the TempoBar pattern), never `resolveColor`
 * (which returns `var()` under the RNW vitest alias), so values stay real in
 * tested component code and on raw-RN surfaces alike.
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

/** The background hex for a surface level under a theme mode (literal hex). */
export function surfaceBackground(level: SurfaceLevel, mode: ThemeMode): string {
  return getSemanticColors(mode)[SURFACE_LEVEL_TOKEN[level]]
}

/**
 * The level a `<Surface pressed>` resolves to: its parent's level stepped one
 * index DOWN the ramp — the symmetric twin of a raised surface stepping up —
 * clamped at the `frame` floor so a pressed surface never underflows the bezel.
 *   overlay→raised, raised→elevated, elevated→base, base→background,
 *   background→frame, frame→frame (clamped).
 * Pressed exposes ONE level of depth only (no pressed-2).
 */
export function pressedLevel(parent: SurfaceLevel): SurfaceLevel {
  const index = PRESSED_RAMP.indexOf(parent)
  const down = Math.max(0, index - 1)
  return PRESSED_RAMP[down]
}
