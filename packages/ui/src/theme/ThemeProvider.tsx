// Cross-platform theme provider (TD native-theming).
//
// Registers titan's semantic color tokens as runtime CSS variables via
// nativewind's `vars()` so that className color tokens (`text-text-secondary`,
// `bg-surface-raised`, `border-border`, …) resolve on NATIVE React Native — the
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
import { vars } from 'nativewind'
import { View, type ViewProps } from 'react-native'
import { darkThemeCSSVars, lightThemeCSSVars } from './config'

export type ThemeProviderMode = 'dark' | 'light'

// Precomputed once — `vars()` is pure, so the same style object is reused across
// renders. Native == web because these are the maps `tokens-css` emits.
const MODE_VARS = {
  dark: vars(darkThemeCSSVars),
  light: vars(lightThemeCSSVars),
}

export interface ThemeProviderProps extends ViewProps {
  /** Theme mode to register. Mobile is dark-only today; defaults to `dark`. */
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
  return (
    <View style={[MODE_VARS[mode], { flex: 1 }, style]} {...props}>
      {children}
    </View>
  )
}
