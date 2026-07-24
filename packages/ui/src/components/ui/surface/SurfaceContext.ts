// On-surface colour context (TD-05.12).
//
// A <Surface> owns a background from a small elevation scale AND publishes the
// current theme mode so descendant text/icons resolve their colour from "what
// surface am I on" instead of a `text-*` className. Those classNames silently
// fail to black when the tree renders as raw RN in the standalone wall SPA
// (no global.css, no nativewind) — the bug class this primitive retires.
import { createContext, useContext } from 'react'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { surfaceRampDark } from '../../../theme/tokens/primitives'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/**
 * A Surface's depth on the dark surface ramp. Each addressable level maps to an
 * EXISTING semantic surface/background token (already grounded in the derived
 * surface ramp — TD-surface-tokens S-1 — and theme-aware) — Surface introduces
 * no new hexes. Darkest → lightest:
 *   inset (#13100D) < background (#1C1916) < base (#252321) < elevated (#2A2827) < raised (#2D2C2B) < overlay (#302F2E)
 *
 * `inset` is the ramp's deepest pit — the sub-shell well. It's the floor a
 * `<Surface pressed>` clamps at (see {@link pressedLevel}); it has no shipped
 * semantic token yet, so {@link surfaceBackground} resolves it from the
 * `surface-inset` token when present, else the `surfaceRampDark.inset` primitive.
 */
export type SurfaceLevel = 'inset' | 'background' | 'base' | 'elevated' | 'raised' | 'overlay'

/** On-surface neutral text roles, resolved for the current surface + theme. */
export type OnSurfaceRole = 'primary' | 'secondary' | 'tertiary'

// Which semantic token backs each ADDRESSABLE level. Values live in `semantic.ts`
// and stay in sync with the charcoal ramp — this map never carries literal hexes.
// `inset` is intentionally absent: it has no shipped semantic token yet, so it's
// resolved separately (token-or-primitive) in `surfaceBackground`.
export const SURFACE_LEVEL_TOKEN = {
  background: 'background-base',
  base: 'surface-base',
  elevated: 'surface-elevated',
  raised: 'surface-raised',
  overlay: 'surface-overlay',
} as const satisfies Record<Exclude<SurfaceLevel, 'inset'>, ColorToken>

// Darkest → lightest, INCLUDING the inset floor. A `<Surface pressed>` renders
// one index DOWN from its parent's level and clamps at `inset` (index 0). Kept
// in lockstep with the derived ramp and the surface.contract.test PLANE_ORDER.
const PRESSED_RAMP = ['inset', 'background', 'base', 'elevated', 'raised', 'overlay'] as const

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

/**
 * The inset floor hex — the ramp's deepest pit that a pressed surface clamps at.
 * Prefers the `surface-inset` semantic token (theme-aware; being promoted in a
 * parallel token change) and falls back to the `surfaceRampDark.inset` primitive
 * (#13100D, dark-ramp only) until that token ships.
 */
function insetFloor(mode: ThemeMode): string {
  const colors = getSemanticColors(mode) as Record<string, string>
  return colors['surface-inset'] ?? surfaceRampDark.inset
}

/** The background hex for a surface level under a theme mode (literal hex). */
export function surfaceBackground(level: SurfaceLevel, mode: ThemeMode): string {
  if (level === 'inset') return insetFloor(mode)
  return getSemanticColors(mode)[SURFACE_LEVEL_TOKEN[level]]
}

/**
 * The level a `<Surface pressed>` resolves to: its parent's level stepped one
 * index DOWN the ramp — the symmetric twin of a raised surface stepping up —
 * clamped at the `inset` floor so a pressed surface never underflows the pit.
 *   overlay→raised, raised→elevated, elevated→base, base→background,
 *   background→inset, inset→inset (clamped).
 * Pressed exposes ONE level of depth only (no pressed-2).
 */
export function pressedLevel(parent: SurfaceLevel): SurfaceLevel {
  const index = PRESSED_RAMP.indexOf(parent)
  const down = Math.max(0, index - 1)
  return PRESSED_RAMP[down]
}
