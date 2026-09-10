import type { ThemePreset } from './types'

/**
 * @deprecated Use `ThemeProvider` with semantic tokens — removed once audiobook
 * migrates off presets (AW-129).
 */
export const defaultPreset: ThemePreset = {
  name: 'default',
  description: 'Titan Design System default theme — orange accent, steel secondary',
}
