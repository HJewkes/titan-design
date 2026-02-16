/**
 * Theme Configuration
 *
 * Maps semantic tokens to CSS custom properties for runtime theming.
 * Dark mode is the default theme.
 */

import { semanticColorsLight, semanticColorsDark, type ThemeMode } from './tokens/semantic'

// CSS custom properties for light mode
export const lightThemeCSSVars = {
  '--color-brand-primary': semanticColorsLight['brand-primary'],
  '--color-brand-primary-light': semanticColorsLight['brand-primary-light'],
  '--color-brand-primary-dark': semanticColorsLight['brand-primary-dark'],
  '--color-brand-primary-subtle': semanticColorsLight['brand-primary-subtle'],
  '--color-brand-secondary': semanticColorsLight['brand-secondary'],
  '--color-brand-secondary-light': semanticColorsLight['brand-secondary-light'],
  '--color-brand-secondary-dark': semanticColorsLight['brand-secondary-dark'],
  '--color-brand-secondary-subtle': semanticColorsLight['brand-secondary-subtle'],

  '--color-on-brand-primary': semanticColorsLight['on-brand-primary'],
  '--color-on-brand-secondary': semanticColorsLight['on-brand-secondary'],

  '--color-status-success': semanticColorsLight['status-success'],
  '--color-status-success-subtle': semanticColorsLight['status-success-subtle'],
  '--color-status-error': semanticColorsLight['status-error'],
  '--color-status-error-subtle': semanticColorsLight['status-error-subtle'],
  '--color-status-warning': semanticColorsLight['status-warning'],
  '--color-status-warning-subtle': semanticColorsLight['status-warning-subtle'],
  '--color-status-info': semanticColorsLight['status-info'],
  '--color-status-info-subtle': semanticColorsLight['status-info-subtle'],

  '--color-text-primary': semanticColorsLight['text-primary'],
  '--color-text-secondary': semanticColorsLight['text-secondary'],
  '--color-text-tertiary': semanticColorsLight['text-tertiary'],
  '--color-text-disabled': semanticColorsLight['text-disabled'],
  '--color-text-inverse': semanticColorsLight['text-inverse'],
  '--color-text-link': semanticColorsLight['text-link'],

  '--color-surface-base': semanticColorsLight['surface-base'],
  '--color-surface-elevated': semanticColorsLight['surface-elevated'],
  '--color-surface-raised': semanticColorsLight['surface-raised'],

  '--color-background-base': semanticColorsLight['background-base'],
  '--color-background-default': semanticColorsLight['background-default'],
  '--color-background-subtle': semanticColorsLight['background-subtle'],

  '--color-border-default': semanticColorsLight['border-default'],
  '--color-border-subtle': semanticColorsLight['border-subtle'],
  '--color-border-strong': semanticColorsLight['border-strong'],
  '--color-border-focus': semanticColorsLight['border-focus'],

  '--color-interactive-hover': semanticColorsLight['interactive-hover'],
  '--color-interactive-focus': semanticColorsLight['interactive-focus'],
  '--color-interactive-active': semanticColorsLight['interactive-active'],
  '--color-interactive-selected': semanticColorsLight['interactive-selected'],
  '--color-interactive-disabled': semanticColorsLight['interactive-disabled'],

  '--color-divider': semanticColorsLight['divider'],
} as const

// CSS custom properties for dark mode (default)
export const darkThemeCSSVars = {
  '--color-brand-primary': semanticColorsDark['brand-primary'],
  '--color-brand-primary-light': semanticColorsDark['brand-primary-light'],
  '--color-brand-primary-dark': semanticColorsDark['brand-primary-dark'],
  '--color-brand-primary-subtle': semanticColorsDark['brand-primary-subtle'],
  '--color-brand-secondary': semanticColorsDark['brand-secondary'],
  '--color-brand-secondary-light': semanticColorsDark['brand-secondary-light'],
  '--color-brand-secondary-dark': semanticColorsDark['brand-secondary-dark'],
  '--color-brand-secondary-subtle': semanticColorsDark['brand-secondary-subtle'],

  '--color-on-brand-primary': semanticColorsDark['on-brand-primary'],
  '--color-on-brand-secondary': semanticColorsDark['on-brand-secondary'],

  '--color-status-success': semanticColorsDark['status-success'],
  '--color-status-success-subtle': semanticColorsDark['status-success-subtle'],
  '--color-status-error': semanticColorsDark['status-error'],
  '--color-status-error-subtle': semanticColorsDark['status-error-subtle'],
  '--color-status-warning': semanticColorsDark['status-warning'],
  '--color-status-warning-subtle': semanticColorsDark['status-warning-subtle'],
  '--color-status-info': semanticColorsDark['status-info'],
  '--color-status-info-subtle': semanticColorsDark['status-info-subtle'],

  '--color-text-primary': semanticColorsDark['text-primary'],
  '--color-text-secondary': semanticColorsDark['text-secondary'],
  '--color-text-tertiary': semanticColorsDark['text-tertiary'],
  '--color-text-disabled': semanticColorsDark['text-disabled'],
  '--color-text-inverse': semanticColorsDark['text-inverse'],
  '--color-text-link': semanticColorsDark['text-link'],

  '--color-surface-base': semanticColorsDark['surface-base'],
  '--color-surface-elevated': semanticColorsDark['surface-elevated'],
  '--color-surface-raised': semanticColorsDark['surface-raised'],

  '--color-background-base': semanticColorsDark['background-base'],
  '--color-background-default': semanticColorsDark['background-default'],
  '--color-background-subtle': semanticColorsDark['background-subtle'],

  '--color-border-default': semanticColorsDark['border-default'],
  '--color-border-subtle': semanticColorsDark['border-subtle'],
  '--color-border-strong': semanticColorsDark['border-strong'],
  '--color-border-focus': semanticColorsDark['border-focus'],

  '--color-interactive-hover': semanticColorsDark['interactive-hover'],
  '--color-interactive-focus': semanticColorsDark['interactive-focus'],
  '--color-interactive-active': semanticColorsDark['interactive-active'],
  '--color-interactive-selected': semanticColorsDark['interactive-selected'],
  '--color-interactive-disabled': semanticColorsDark['interactive-disabled'],

  '--color-divider': semanticColorsDark['divider'],
} as const

// Helper to get CSS vars for a theme mode
export function getThemeCSSVars(mode: ThemeMode) {
  return mode === 'dark' ? darkThemeCSSVars : lightThemeCSSVars
}

// Gluestack UI theme configuration
export const gluestackConfig = {
  tokens: {
    colors: {
      // Map to our semantic colors via CSS vars
      primary500: 'var(--color-brand-primary)',
      primary600: 'var(--color-brand-primary-dark)',
      primary400: 'var(--color-brand-primary-light)',

      secondary500: 'var(--color-brand-secondary)',
      secondary600: 'var(--color-brand-secondary-dark)',
      secondary400: 'var(--color-brand-secondary-light)',

      success500: 'var(--color-status-success)',
      error500: 'var(--color-status-error)',
      warning500: 'var(--color-status-warning)',
      info500: 'var(--color-status-info)',

      textLight: 'var(--color-text-primary)',
      textDark: 'var(--color-text-inverse)',

      backgroundLight: 'var(--color-background-default)',
      backgroundDark: 'var(--color-surface-base)',
    },
    space: {
      '0': 0,
      '1': 4,
      '2': 8,
      '3': 12,
      '4': 16,
      '5': 20,
      '6': 24,
      '8': 32,
      '10': 40,
      '12': 48,
      '16': 64,
      '20': 80,
      '24': 96,
    },
    radii: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      '2xl': 24,
      full: 9999,
    },
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
  },
  aliases: {
    bg: 'backgroundColor',
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    h: 'height',
    w: 'width',
    rounded: 'borderRadius',
  },
} as const

export type ThemeConfig = typeof gluestackConfig
