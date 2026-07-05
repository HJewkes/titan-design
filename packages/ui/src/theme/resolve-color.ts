import { Platform } from 'react-native'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/**
 * Resolve a semantic color token for an inline style where a nativewind
 * className can't apply — gradients (`backgroundImage`), per-edge borders
 * (`borderTopColor`, …), SVG attributes, and conditional hex/token mixes.
 *
 * The companion to className color tokens: on **web** it returns the CSS
 * variable (`var(--color-…)`), so the dashboard's light/dark switching keeps
 * working exactly as `global.css` intends; on **native** it returns the
 * resolved hex from `getSemanticColors` (mobile is dark-only). This is why
 * these spots stay theme-correct on web while also rendering on-device.
 */
export function resolveColor(token: ColorToken, mode: ThemeMode = 'dark'): string {
  return Platform.OS === 'web' ? `var(--color-${token})` : getSemanticColors(mode)[token]
}
