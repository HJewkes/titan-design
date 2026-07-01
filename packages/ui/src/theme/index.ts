// Theme exports
export * from './tokens'
export * from './config'
export * from './shadows'
export * from './elevation'
export * from './manifest'

// Re-export commonly used items
export { getSemanticColors, type ThemeMode } from './tokens/semantic'
export { getThemeCSSVars, gluestackConfig } from './config'
export {
  neumorphicShadows,
  // Color math utilities (HSV-based)
  lighten,
  darken,
  getHoverColors,
  isDark,
  hexToRgb,
  rgbToHsv,
  // Shadow creation functions
  createRaisedShadow,
  createRaisedHoverShadow,
  createPressedShadow,
  createPressedHoverShadow,
  createFlatShadow,
  shadowColors,
  type ShadowIntensity,
  type ShadowSurface,
} from './shadows'
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
