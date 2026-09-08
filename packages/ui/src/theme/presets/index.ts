/**
 * @deprecated The whole `theme/presets` barrel. Use `ThemeProvider` with
 * semantic tokens — removed once audiobook migrates off presets (AW-129).
 */
export type {
  ThemePreset,
  ThemePresetColors,
  ThemePresetFonts,
  ThemePresetRadii,
  ThemePresetShadows,
} from './types'
/** @deprecated Use `ThemeProvider` with semantic tokens (AW-129). */
export { applyThemePreset } from './apply'
/** @deprecated Use `ThemeProvider` with semantic tokens (AW-129). */
export { defaultPreset } from './default'
/** @deprecated Use `ThemeProvider` with semantic tokens (AW-129). */
export { audiobookPreset } from './audiobook'
