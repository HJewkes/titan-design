// Web test stub for `nativewind`.
//
// The real `nativewind` pulls react-native-css-interop → RN's Flow-typed
// sources, which the jsdom/react-native-web test environment can't parse
// ("Unexpected token 'typeof'"). Only `ThemeProvider` imports nativewind (for
// `vars()`), and only for its NATIVE behavior — on web the color tokens resolve
// from `global.css`, so an identity `vars()` is a faithful web stand-in.
// Aliased in `vitest.config.ts`; the real package is used at build/native.

/** Identity stand-in for nativewind's `vars()` — returns the token map as-is. */
export function vars(values: Record<string, string>): Record<string, string> {
  return values
}

/**
 * Stand-in for nativewind's `useColorScheme()`. Under the web test env there is
 * no nativewind theme applied, so it reports `undefined` (the "no explicit
 * scheme" signal) — matching ThemeProvider's dark fallback for `mode="system"`.
 */
export function useColorScheme(): {
  colorScheme: 'light' | 'dark' | undefined
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void
  toggleColorScheme: () => void
} {
  return { colorScheme: undefined, setColorScheme: () => {}, toggleColorScheme: () => {} }
}
