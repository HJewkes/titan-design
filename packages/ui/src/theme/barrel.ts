// Theme surface WITHOUT the ThemeProvider value (dep hygiene, titan 0.5.0).
//
// `ThemeProvider` imports `nativewind` (`vars()`). Re-exporting it from the root
// barrel dragged the whole nativewind import chain into every consumer of
// `@titan-design/react-ui` — the web SPA paid for a native-only provider. This
// file is the nativewind-free theme surface: the root barrel re-exports THIS,
// and the `/theme` subpath (`./index.ts`) layers the `ThemeProvider` value on
// top for the native consumers that deliberately import it.
export * from './tokens'
export * from './config'
export * from './materials'
export * from './color-utils'
export * from './elevation'
export * from './manifest'
export { resolveColor } from './resolve-color'
export { linearGradient, surfaceGradient, type GradientStyle } from './gradients'

// ThemeProvider TYPES may stay on the root (erased at build — no nativewind
// pull). Only the ThemeProvider VALUE moves to the `/theme` subpath.
export type { ThemeProviderProps, ThemeProviderMode } from './ThemeProvider'

// Re-export commonly used items
export { getSemanticColors, type ThemeMode } from './tokens/semantic'
export { getThemeCSSVars, gluestackConfig } from './config'
export {
  hexToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToHex,
  lighten,
  darken,
  getHoverColors,
  isDark,
  type ShadowIntensity,
} from './color-utils'
export {
  getElevationConfig,
  getElevationSurface,
  getElevationShadow,
  getBaseSurfaceColor,
  getValidatedElevation,
  componentElevationRanges,
  type ElevationLevel,
  type ElevationConfig,
  type ComponentType,
} from './elevation'
export * from './presets'
