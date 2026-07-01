/**
 * Theme Configuration
 *
 * Maps semantic tokens to CSS custom properties for runtime theming.
 * Dark mode is the default theme.
 */

import { semanticColorsLight, semanticColorsDark, type ThemeMode } from './tokens/semantic'

// Theme-independent custom properties: identical in light and dark in
// global.css (RGB glow decompositions, font families, animation tokens). Kept
// as literals since they are not part of the semantic COLOR maps, and spread
// into both theme maps so codegen mirrors global.css exactly.
const themeIndependentCSSVars = {
  // RGB decomposed values for glow shadows
  '--color-brand-primary-rgb': '255, 121, 0',
  '--color-brand-secondary-rgb': '64, 109, 135',
  '--color-status-success-rgb': '20, 184, 166',
  '--color-status-error-rgb': '209, 67, 67',
  '--color-status-warning-rgb': '255, 176, 32',
  '--color-status-info-rgb': '33, 150, 243',
  '--color-background-base-rgb': '16, 16, 16',

  // Font families
  '--font-family-sans': "'Inter'",
  '--font-family-body': "'Nunito Sans'",
  '--font-family-heading': "'Space Grotesk'",
  '--font-family-mono': "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",

  // Animation tokens
  '--ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  '--ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--duration-fast': '150ms',
  '--duration-normal': '250ms',
  '--duration-slow': '400ms',
} as const

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

  '--color-brand-primary-hover': semanticColorsLight['brand-primary-hover'],
  '--color-brand-primary-active': semanticColorsLight['brand-primary-active'],
  '--color-brand-secondary-hover': semanticColorsLight['brand-secondary-hover'],
  '--color-brand-secondary-active': semanticColorsLight['brand-secondary-active'],

  '--color-status-success-light': semanticColorsLight['status-success-light'],
  '--color-status-success-dark': semanticColorsLight['status-success-dark'],
  '--color-status-error-light': semanticColorsLight['status-error-light'],
  '--color-status-error-dark': semanticColorsLight['status-error-dark'],
  '--color-status-warning-light': semanticColorsLight['status-warning-light'],
  '--color-status-warning-dark': semanticColorsLight['status-warning-dark'],
  '--color-status-info-light': semanticColorsLight['status-info-light'],
  '--color-status-info-dark': semanticColorsLight['status-info-dark'],

  '--color-on-status-success': semanticColorsLight['on-status-success'],
  '--color-on-status-error': semanticColorsLight['on-status-error'],
  '--color-on-status-warning': semanticColorsLight['on-status-warning'],
  '--color-on-status-info': semanticColorsLight['on-status-info'],

  '--color-result-improve': semanticColorsLight['result-improve'],
  '--color-result-improve-light': semanticColorsLight['result-improve-light'],
  '--color-result-improve-dark': semanticColorsLight['result-improve-dark'],
  '--color-result-degrade': semanticColorsLight['result-degrade'],
  '--color-result-degrade-light': semanticColorsLight['result-degrade-light'],
  '--color-result-degrade-dark': semanticColorsLight['result-degrade-dark'],
  '--color-result-inconclusive': semanticColorsLight['result-inconclusive'],
  '--color-result-inconclusive-light': semanticColorsLight['result-inconclusive-light'],
  '--color-result-neutral': semanticColorsLight['result-neutral'],

  '--color-on-result-improve': semanticColorsLight['on-result-improve'],
  '--color-on-result-degrade': semanticColorsLight['on-result-degrade'],
  '--color-on-result-inconclusive': semanticColorsLight['on-result-inconclusive'],

  '--color-data-1': semanticColorsLight['data-1'],
  '--color-data-2': semanticColorsLight['data-2'],
  '--color-data-3': semanticColorsLight['data-3'],
  '--color-data-4': semanticColorsLight['data-4'],
  '--color-data-5': semanticColorsLight['data-5'],
  '--color-data-6': semanticColorsLight['data-6'],
  '--color-data-7': semanticColorsLight['data-7'],
  '--color-data-8': semanticColorsLight['data-8'],
  '--color-data-9': semanticColorsLight['data-9'],
  '--color-data-10': semanticColorsLight['data-10'],

  '--color-text-link-hover': semanticColorsLight['text-link-hover'],

  '--color-surface-overlay': semanticColorsLight['surface-overlay'],
  '--color-surface-input': semanticColorsLight['surface-input'],

  '--color-border-input': semanticColorsLight['border-input'],
  '--color-border-input-hover': semanticColorsLight['border-input-hover'],
  '--color-border-input-focus': semanticColorsLight['border-input-focus'],
  '--color-border-input-error': semanticColorsLight['border-input-error'],

  '--color-interactive-disabled-text': semanticColorsLight['interactive-disabled-text'],

  '--color-avatar-background': semanticColorsLight['avatar-background'],
  '--color-avatar-text': semanticColorsLight['avatar-text'],

  ...themeIndependentCSSVars,
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

  '--color-brand-primary-hover': semanticColorsDark['brand-primary-hover'],
  '--color-brand-primary-active': semanticColorsDark['brand-primary-active'],
  '--color-brand-secondary-hover': semanticColorsDark['brand-secondary-hover'],
  '--color-brand-secondary-active': semanticColorsDark['brand-secondary-active'],

  '--color-status-success-light': semanticColorsDark['status-success-light'],
  '--color-status-success-dark': semanticColorsDark['status-success-dark'],
  '--color-status-error-light': semanticColorsDark['status-error-light'],
  '--color-status-error-dark': semanticColorsDark['status-error-dark'],
  '--color-status-warning-light': semanticColorsDark['status-warning-light'],
  '--color-status-warning-dark': semanticColorsDark['status-warning-dark'],
  '--color-status-info-light': semanticColorsDark['status-info-light'],
  '--color-status-info-dark': semanticColorsDark['status-info-dark'],

  '--color-on-status-success': semanticColorsDark['on-status-success'],
  '--color-on-status-error': semanticColorsDark['on-status-error'],
  '--color-on-status-warning': semanticColorsDark['on-status-warning'],
  '--color-on-status-info': semanticColorsDark['on-status-info'],

  '--color-result-improve': semanticColorsDark['result-improve'],
  '--color-result-improve-light': semanticColorsDark['result-improve-light'],
  '--color-result-improve-dark': semanticColorsDark['result-improve-dark'],
  '--color-result-degrade': semanticColorsDark['result-degrade'],
  '--color-result-degrade-light': semanticColorsDark['result-degrade-light'],
  '--color-result-degrade-dark': semanticColorsDark['result-degrade-dark'],
  '--color-result-inconclusive': semanticColorsDark['result-inconclusive'],
  '--color-result-inconclusive-light': semanticColorsDark['result-inconclusive-light'],
  '--color-result-neutral': semanticColorsDark['result-neutral'],

  '--color-on-result-improve': semanticColorsDark['on-result-improve'],
  '--color-on-result-degrade': semanticColorsDark['on-result-degrade'],
  '--color-on-result-inconclusive': semanticColorsDark['on-result-inconclusive'],

  '--color-data-1': semanticColorsDark['data-1'],
  '--color-data-2': semanticColorsDark['data-2'],
  '--color-data-3': semanticColorsDark['data-3'],
  '--color-data-4': semanticColorsDark['data-4'],
  '--color-data-5': semanticColorsDark['data-5'],
  '--color-data-6': semanticColorsDark['data-6'],
  '--color-data-7': semanticColorsDark['data-7'],
  '--color-data-8': semanticColorsDark['data-8'],
  '--color-data-9': semanticColorsDark['data-9'],
  '--color-data-10': semanticColorsDark['data-10'],

  '--color-text-link-hover': semanticColorsDark['text-link-hover'],

  '--color-surface-overlay': semanticColorsDark['surface-overlay'],
  '--color-surface-input': semanticColorsDark['surface-input'],

  '--color-border-input': semanticColorsDark['border-input'],
  '--color-border-input-hover': semanticColorsDark['border-input-hover'],
  '--color-border-input-focus': semanticColorsDark['border-input-focus'],
  '--color-border-input-error': semanticColorsDark['border-input-error'],

  '--color-interactive-disabled-text': semanticColorsDark['interactive-disabled-text'],

  '--color-avatar-background': semanticColorsDark['avatar-background'],
  '--color-avatar-text': semanticColorsDark['avatar-text'],

  ...themeIndependentCSSVars,
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
