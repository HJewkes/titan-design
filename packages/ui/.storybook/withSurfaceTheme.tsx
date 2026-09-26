// Seeds the on-surface colour context from the toolbar theme (VW-397).
//
// `withThemeByClassName` only flips the `.light` class on <html>, which moves the
// CSS-variable tokens. Surface planes and on-surface text resolve literal hex from
// SurfaceContext, whose runtime default is dark, so without this provider light
// mode painted dark planes under light-mode text.
import type { Decorator } from '@storybook/react-vite'
import React from 'react'
import { SurfaceContext } from '../src/components/ui/surface/SurfaceContext'
import type { ThemeMode } from '../src/theme/tokens/semantic'

/** The `globals` key `withThemeByClassName` writes the selected theme to. */
export const THEME_GLOBAL = 'theme'

export function surfaceModeFromGlobals(globals: Record<string, unknown>): ThemeMode {
  return globals[THEME_GLOBAL] === 'light' ? 'light' : 'dark'
}

export const withSurfaceTheme: Decorator = (Story, context) => (
  <SurfaceContext.Provider value={{ mode: surfaceModeFromGlobals(context.globals), level: 'base' }}>
    <Story />
  </SurfaceContext.Provider>
)
