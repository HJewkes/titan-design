---
title: "Architecture: src/theme/tokens"
type: architecture
tier: slow
module: codebase
module-path: src/theme/tokens
language: typescript
exports-hash: "0412ce76a1eedcfeda15e4eb2043c503a75bce960624863b006a66080aae5a84"
tags: [architecture, typescript, titan-design]
created: 2026-03-14T15:53:52.798Z
modified: 2026-03-14T15:53:52.798Z
---

## Purpose

No module-level documentation found.

## Public API

| Export | Kind | Signature |
|--------|------|-----------|
| buttonSizes | const | export const buttonSizes = |
| discreteRainbow | const | export const discreteRainbow = [ |
| getDiscreteRainbowColor | function | export function getDiscreteRainbowColor(index: number, size: number): string |
| getSemanticColors | function | export function getSemanticColors(mode: ThemeMode) |
| primitiveBorderRadius | const | export const primitiveBorderRadius = |
| primitiveBreakpoints | const | export const primitiveBreakpoints = |
| primitiveColors | const | export const primitiveColors = |
| primitiveShadows | const | export const primitiveShadows = |
| primitiveSpacing | const | export const primitiveSpacing = |
| primitiveTypography | const | export const primitiveTypography = |
| primitiveZIndex | const | export const primitiveZIndex = |
| semanticColorsDark | const | export const semanticColorsDark = |
| semanticColorsLight | const | export const semanticColorsLight = |
| semanticTypography | const | export const semanticTypography = |
| ThemeMode | type | export type ThemeMode = 'light' \| 'dark' |

## Dependencies

### Internal

- `./primitives` — discreteRainbow, p

### External

*(none)*

## Invariants

*(none yet)*
