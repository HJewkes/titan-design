// Cross-platform theme provider (TD native-theming).
//
// Registers titan's semantic color tokens as runtime CSS variables via
// nativewind's `vars()` so that className color tokens (`text-text-secondary`,
// `bg-surface-raised`, `border-hairline`, …) resolve on NATIVE React Native — the
// native equivalent of the `:root {}` block `global.css` provides on web.
//
// Why this exists: titan's Workout organisms reference semantic colors as CSS
// variables. On web (the dashboard, react-native-web) those come from
// `global.css`. On native (the mobile app) nothing defined them, so any titan
// component using a `--color-*` token rendered with an unresolved (black) color.
// Wrap the mobile app root in `<ThemeProvider>` and the tokens resolve on-device.
//
// The var maps are the SAME canonical `darkThemeCSSVars` / `lightThemeCSSVars`
// that generate `global.css`, so native and web resolve to identical values.
//
// It also seeds the on-surface colour context (`<Surface>`'s mode), so titan's
// JS-resolved on-surface colours track the same theme as the className tokens.
import { vars, useColorScheme } from 'nativewind'
import { View, type ViewProps } from 'react-native'
import { SurfaceContext } from '../components/ui/surface/SurfaceContext'
import { darkThemeCSSVars, lightThemeCSSVars } from './config'

/** `'system'` follows nativewind's `useColorScheme()` (mobile light/dark flip). */
export type ThemeProviderMode = 'dark' | 'light' | 'system'

// Precomputed once — `vars()` is pure, so the same style object is reused across
// renders. Native == web because these are the maps `tokens-css` emits.
const MODE_VARS = {
  dark: vars(darkThemeCSSVars),
  light: vars(lightThemeCSSVars),
}

export interface ThemeProviderProps extends ViewProps {
  /**
   * Theme mode to register. `'system'` bridges nativewind's `useColorScheme()`
   * so mobile follows the OS light/dark flip; `'dark'`/`'light'` pin it. Mobile
   * is dark-only today, so this defaults to `dark`.
   */
  mode?: ThemeProviderMode
}

/**
 * Wrap the app root so descendant titan components' `--color-*` className tokens
 * resolve on native. Fills its parent (`flex: 1`) by default; pass `style` to
 * override. On web it is harmless (the dashboard already loads `global.css`).
 */
export function ThemeProvider({
  mode = 'dark',
  style,
  children,
  ...props
}: ThemeProviderProps): React.JSX.Element {
  // `'system'` → follow nativewind's applied scheme, falling back to dark when
  // no scheme is set. `useColorScheme` runs unconditionally (rules of hooks);
  // its result is only used in the `'system'` branch.
  const { colorScheme } = useColorScheme()
  const resolved = mode === 'system' ? (colorScheme ?? 'dark') : mode

  return (
    <SurfaceContext.Provider value={{ mode: resolved, level: 'base' }}>
      <View style={[MODE_VARS[resolved], { flex: 1 }, style]} {...props}>
        {children}
      </View>
    </SurfaceContext.Provider>
  )
}
