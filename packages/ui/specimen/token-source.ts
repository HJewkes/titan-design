import { darkThemeCSSVars, lightThemeCSSVars } from '../src/theme/config'

/**
 * Shared source of truth for the token-resolution specimen + Playwright test.
 * The color tokens whose runtime `var()` value the test asserts against the
 * theme maps in `src/theme/config.ts`. Excludes `-rgb` decompositions (not
 * standalone colors; used only inside `rgba(var(--x-rgb), a)`).
 */
export const colorTokenNames: string[] = Object.keys(darkThemeCSSVars).filter(
  (name) => name.startsWith('--color-') && !name.endsWith('-rgb'),
)

export const expectedByTheme = {
  dark: darkThemeCSSVars as Record<string, string>,
  light: lightThemeCSSVars as Record<string, string>,
} as const
