---
title: "Architecture: src/theme"
type: architecture
tier: slow
module: codebase
module-path: src/theme
language: typescript
exports-hash: "d365e627e5956f643951a0395fb58a319d58fa8002d9e15b93dc4694f4d1af8d"
tags: [architecture, typescript, titan-design]
created: 2026-03-14T15:53:52.797Z
modified: 2026-03-14T15:53:52.797Z
---

## Purpose

No module-level documentation found.

## Public API

| Export | Kind | Signature |
|--------|------|-----------|
| componentElevationRanges | const | export const componentElevationRanges = |
| ComponentType | type | export type ComponentType = keyof typeof componentElevationRanges |
| createFlatShadow | function | export function createFlatShadow(): ViewStyle |
| createPressedHoverShadow | function | export function createPressedHoverShadow( surface: ShadowSurface = 'charcoal', intensity: ShadowIntensity = 'medium' ): ViewStyle |
| createPressedShadow | function | export function createPressedShadow( surface: ShadowSurface = 'charcoal', intensity: ShadowIntensity = 'medium' ): ViewStyle |
| createRaisedHoverShadow | function | export function createRaisedHoverShadow( surface: ShadowSurface = 'charcoal', intensity: ShadowIntensity = 'medium' ): ViewStyle |
| createRaisedShadow | function | export function createRaisedShadow( surface: ShadowSurface = 'charcoal', intensity: ShadowIntensity = 'medium' ): ViewStyle |
| darken | function | export function darken(hex: string, amount: number = 0.1): string |
| darkThemeCSSVars | const | export const darkThemeCSSVars = |
| ElevationConfig | interface | export interface ElevationConfig |
| ElevationLevel | type | export type ElevationLevel = -2 \| -1 \| 0 \| 1 \| 2 \| 3 \| 4 \| 5 |
| elevationSystem | const | export const elevationSystem: Record<ElevationLevel, ElevationConfig> = |
| getBaseSurfaceColor | function | export function getBaseSurfaceColor(theme: 'light' \| 'dark'): string |
| getElevationConfig | function | export function getElevationConfig(level: ElevationLevel): ElevationConfig |
| getElevationShadow | function | export function getElevationShadow( baseColor: string, level: ElevationLevel, theme: 'light' \| 'dark', isHovered: boolean = false ): ViewStyle |
| getElevationSurface | function | export function getElevationSurface( baseColor: string, level: ElevationLevel, theme: 'light' \| 'dark' ): string |
| getGlowShadow | function | export function getGlowShadow( color: string, intensity: GlowIntensity = 'medium' ): ViewStyle |
| getHoverColors | function | export function getHoverColors( bgColor: string, intensity: 'subtle' \| 'medium' \| 'strong' = 'medium' ): |
| getSemanticColors | const | export |
| getThemeCSSVars | function | export function getThemeCSSVars(mode: ThemeMode) |
| getThemeCSSVars | const | export |
| getValidatedElevation | function | export function getValidatedElevation( component: ComponentType, requested: ElevationLevel ): ElevationLevel |
| GlowIntensity | type | export type GlowIntensity = 'subtle' \| 'medium' \| 'strong' |
| gluestackConfig | const | export const gluestackConfig = |
| hexToRgb | function | export function hexToRgb(hex: string): |
| hsvToRgb | function | export function hsvToRgb(h: number, s: number, v: number): |
| isDark | function | export function isDark(hex: string): boolean |
| lighten | function | export function lighten(hex: string, amount: number = 0.1): string |
| lightThemeCSSVars | const | export const lightThemeCSSVars = |
| neumorphicShadows | const | export const neumorphicShadows = |
| rgbToHex | function | export function rgbToHex(r: number, g: number, b: number): string |
| rgbToHsv | function | export function rgbToHsv(r: number, g: number, b: number): |
| shadowColors | const | export const shadowColors = |
| ShadowIntensity | type | export type ShadowIntensity = 'subtle' \| 'medium' \| 'strong' |
| ShadowSurface | type | export type ShadowSurface = keyof typeof shadowColors |
| ThemeConfig | type | export type ThemeConfig = typeof gluestackConfig |
| type ThemeMode | const | export |

## Dependencies

### Internal

- `./shadows` — darken, hexToRgb, hsvToRgb, lighten, rgbToHex, rgbToHsv
- `./tokens/semantic` — ThemeMode, semanticColorsDark, semanticColorsLight

### External

- `react-native` — Platform, ViewStyle

## Invariants

*(none yet)*
