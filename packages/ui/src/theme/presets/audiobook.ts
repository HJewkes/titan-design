import type { ThemePreset } from './types'

/**
 * Audiobook Studio preset.
 *
 * Warm copper/patina aesthetic inspired by vintage audio equipment
 * and reading lounges. Dark-mode only design with editorial typography.
 */
export const audiobookPreset: ThemePreset = {
  name: 'audiobook',
  description: 'Warm copper/patina theme with editorial typography',
  fontImport:
    "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
  fonts: {
    sans: "'Outfit', 'Avenir', 'Avenir Next', system-ui, sans-serif",
    body: "'Outfit', 'Avenir', 'Avenir Next', system-ui, sans-serif",
    heading: "'Newsreader', 'Libre Baskerville', Georgia, serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  },
  colors: {
    dark: {
      // Brand: Copper accent
      'brand-primary': '#d4782a',
      'brand-primary-light': '#e8944a',
      'brand-primary-dark': '#9a4a15',
      'brand-primary-subtle': 'rgba(212, 120, 42, 0.12)',
      'brand-primary-hover': '#e8944a',
      'brand-primary-active': '#f5b070',

      // Brand secondary: Patina/verdigris
      'brand-secondary': '#3a9b8a',
      'brand-secondary-light': '#55baa7',
      'brand-secondary-dark': '#1f5c52',
      'brand-secondary-subtle': 'rgba(58, 155, 138, 0.12)',
      'brand-secondary-hover': '#55baa7',
      'brand-secondary-active': '#7ed4c4',

      'on-brand-primary': '#FFFFFF',
      'on-brand-secondary': '#FFFFFF',

      // Status colors (audiobook's warmer status palette)
      'status-success': '#5fb870',
      'status-error': '#d85c4a',
      'status-warning': '#d4a43a',
      'status-info': '#5a8fd4',

      // Text: warm off-whites
      'text-primary': '#f4f3f1',
      'text-secondary': '#b5b3af',
      'text-tertiary': '#7a7875',

      // Surfaces: warm charcoals (not pure gray)
      'surface-base': '#101114',
      'surface-elevated': '#15171c',
      'surface-raised': '#1a1d24',
      'surface-overlay': '#15171c',
      'surface-input': '#15171c',

      // Backgrounds
      'background-base': '#0a0b0d',
      'background-default': '#101114',
      'background-subtle': '#1a1d24',

      // Borders
      'hairline-default': 'rgba(255, 255, 255, 0.06)',
      'hairline-subtle': 'rgba(255, 255, 255, 0.03)',
      'hairline-strong': '#2d323d',
      'border-focus': '#d4782a',
      'border-input': '#2d323d',
      'border-input-hover': '#454c5c',
      'border-input-focus': '#d4782a',
      'border-input-error': '#d85c4a',

      // Interactive
      'interactive-hover': 'rgba(255, 255, 255, 0.04)',
      'interactive-focus': 'rgba(255, 255, 255, 0.12)',
      'interactive-active': 'rgba(255, 255, 255, 0.16)',
      'interactive-selected': 'rgba(255, 255, 255, 0.08)',

      'divider': 'rgba(255, 255, 255, 0.06)',

      // Glow RGB values for shadow utilities
      'brand-primary-rgb': '212, 120, 42',
      'brand-secondary-rgb': '58, 155, 138',
      'status-success-rgb': '95, 184, 112',
      'status-error-rgb': '216, 92, 74',
      'status-warning-rgb': '212, 164, 58',
      'status-info-rgb': '90, 143, 212',
      'background-base-rgb': '10, 11, 13',
    },
  },
  rootClasses: ['atmosphere-warm', 'grain'],
}
