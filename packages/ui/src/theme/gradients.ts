import { resolveColor } from './resolve-color'
import { hexToRgb } from './color-utils'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** A gradient stop: a bare token, or a token with its own alpha. */
export type GradientStop = ColorToken | { token: ColorToken; alpha?: number }

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
  return linearGradientStops([from, to], angle, mode)
}

function withAlpha(value: string, a: number): string {
  const rgb = hexToRgb(value)
  // A var() carries no channels to apply alpha to, so a non-hex value passes through.
  if (!rgb) return value
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, Math.max(0, a))})`
}

function stopPaint(stop: GradientStop, mode: ThemeMode): string {
  if (typeof stop === 'string') return resolveColor(stop, mode)
  if (stop.alpha === undefined) return resolveColor(stop.token, mode)
  return withAlpha(getSemanticColors(mode)[stop.token], stop.alpha)
}

/**
 * The n-stop form of {@link linearGradient}, for ramps that need a midpoint.
 *
 * A bare token follows the CSS theme on web (a `var()`); a `{ token, alpha }`
 * stop resolves to `rgba()` against the `mode` argument instead. A list of only
 * bare tokens is positionless (CSS spaces the stops evenly); once any stop is an
 * object, every stop prints its even position.
 */
export function linearGradientStops(
  stops: readonly GradientStop[],
  angle = 180,
  mode: ThemeMode = 'dark'
): GradientStyle {
  const positioned = stops.some((stop) => typeof stop !== 'string')
  const paint = stops
    .map((stop, i) => {
      const colour = stopPaint(stop, mode)
      return positioned ? `${colour} ${(i / (stops.length - 1)) * 100}%` : colour
    })
    .join(', ')
  return { backgroundImage: `linear-gradient(${angle}deg, ${paint})` }
}

/**
 * Named surface gradients — the shared substrate for gradient fills. Replaces
 * per-component inline `linear-gradient` strings.
 */
export const surfaceGradient = {
  /** Chrome bands (top bar, headers): elevated → base, a subtle dark wash. */
  chrome: (mode: ThemeMode = 'dark'): GradientStyle =>
    linearGradient('surface-elevated', 'background-base', 180, mode),
  /** Volume track (MEV → MRV): under → on-target → over, left to right. */
  volumeTrack: (mode: ThemeMode = 'dark'): GradientStyle =>
    linearGradientStops(['status-info', 'status-success', 'status-error'], 90, mode),
}
