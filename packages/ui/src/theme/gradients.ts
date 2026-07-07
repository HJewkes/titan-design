import { resolveColor } from './resolve-color'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** A `backgroundImage` style — web-only (RN ignores it); type it loosely for RN style arrays. */
export type GradientStyle = { backgroundImage: string }

/**
 * A linear-gradient `backgroundImage` built from two semantic color tokens.
 *
 * Themeable + native-safe via {@link resolveColor}: on web the stops are CSS
 * variables (light/dark switching keeps working); on native it resolves to hex.
 * `backgroundImage` is a **web-only** paint, so pair this with a solid
 * `bg-*` className fallback for native (see the shell TopBar).
 */
export function linearGradient(
  from: ColorToken,
  to: ColorToken,
  angle = 180,
  mode: ThemeMode = 'dark'
): GradientStyle {
  return {
    backgroundImage: `linear-gradient(${angle}deg, ${resolveColor(from, mode)}, ${resolveColor(to, mode)})`,
  }
}

/**
 * Named surface gradients — the shared substrate for gradient fills. Replaces
 * per-component inline `linear-gradient` strings.
 */
export const surfaceGradient = {
  /** Chrome bands (top bar, headers): elevated → base, a subtle dark wash. */
  chrome: (mode: ThemeMode = 'dark'): GradientStyle =>
    linearGradient('surface-elevated', 'background-base', 180, mode),
}
