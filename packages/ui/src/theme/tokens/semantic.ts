/**
 * Semantic Design Tokens
 *
 * Meaningful tokens following DTCG (Design Tokens Community Group) naming conventions.
 * Pattern: {category}-{intent}-{variant?}-{state?}
 *
 * Categories:
 * - brand-* : Brand colors (primary, secondary, accent)
 * - status-* : Feedback colors (success, error, warning, info)
 * - result-* : Outcome indicators (improve, degrade, inconclusive, neutral)
 * - data-* : Data visualization colors (chart series)
 * - on-* : Text on colored backgrounds
 * - surface-* : Elevated containers (NOT "paper")
 * - background-* : Page backgrounds
 * - text-* : Text colors
 * - border-* : Border colors
 * - interactive-* : Hover/focus/active/disabled states
 */

import { primitiveColors as p, primitiveRamps as ramp, discreteRainbow } from './primitives'

// Light mode semantic colors (default)
export const semanticColorsLight = {
  // Brand colors (brand-*)
  'brand-primary': ramp.orange[400],
  'brand-primary-light': ramp.orange[300],
  'brand-primary-dark': ramp.orange[500],
  'brand-primary-subtle': 'rgba(255, 121, 0, 0.08)',
  'brand-primary-hover': ramp.orange[500],
  'brand-primary-active': ramp.orange[600],

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': 'rgba(48, 123, 155, 0.08)',
  'brand-secondary-hover': ramp.cyan[700],
  'brand-secondary-active': ramp.cyan[800],

  // Text on brand backgrounds (on-*)
  'on-brand-primary': p.white,
  'on-brand-secondary': p.white,

  // Status colors (status-*)
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': ramp.green[50],

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  'status-error-subtle': ramp.red[50],

  'status-error-vivid': p.redVivid[500],     // vivid alert red
  'status-error-vivid-light': p.redVivid[400],
  'status-error-vivid-dark': p.redVivid[700],
  'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',

  'status-warning': ramp.amber[300],
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[500],
  'status-warning-subtle': ramp.amber[50],

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': ramp.blue[50],

  // Text on status backgrounds (on-status-*)
  'on-status-success': p.white,
  'on-status-error': p.white,
  'on-status-warning': p.white,
  'on-status-info': p.white,

  // Result/outcome indicators (result-*)
  'result-improve': '#4caf50',                // Green - positive outcome
  'result-improve-light': 'rgba(76, 175, 80, 0.12)',
  'result-improve-dark': '#248a24',
  'result-degrade': '#ef5350',                // Red - negative outcome
  'result-degrade-light': 'rgba(239, 83, 80, 0.12)',
  'result-degrade-dark': '#b30000',
  'result-inconclusive': '#9E9A97',           // Gray - no clear result
  'result-inconclusive-light': 'rgba(158, 154, 151, 0.12)',
  'result-neutral': p.neutral[500],           // Neutral baseline

  // Text on result backgrounds (on-result-*)
  'on-result-improve': p.white,
  'on-result-degrade': p.white,
  'on-result-inconclusive': p.white,

  // Data visualization colors (data-*)
  // First 10 colors from discrete rainbow optimized for charts
  'data-1': discreteRainbow[9],               // Blue
  'data-2': discreteRainbow[14],              // Green
  'data-3': discreteRainbow[17],              // Yellow
  'data-4': discreteRainbow[25],              // Red
  'data-5': discreteRainbow[8],               // Purple
  'data-6': discreteRainbow[20],              // Orange
  'data-7': discreteRainbow[13],              // Light Blue
  'data-8': discreteRainbow[15],              // Light Green
  'data-9': discreteRainbow[3],               // Lavender
  'data-10': discreteRainbow[22],             // Dark Orange

  // Text colors (text-*)
  'text-primary': '#121828',
  'text-secondary': '#65748B',
  'text-tertiary': p.neutral[400],
  'text-disabled': 'rgba(55, 65, 81, 0.48)',
  'text-inverse': p.white,
  'text-link': p.blue[600],
  'text-link-hover': p.blue[700],

  // Surface colors (surface-*) - for elevated containers
  'surface-base': p.white,
  'surface-elevated': p.neutral[50],          // slightly off-white for elevated cards
  'surface-raised': p.neutral[100],           // light gray for raised cards
  'surface-overlay': p.white,
  'surface-input': p.neutral[50],             // Input field background (filled variant)

  // Background colors (background-*)
  'background-base': '#EBEBEB',
  'background-default': p.white,
  'background-subtle': p.neutral[50],

  // Border colors (border-*)
  'border-default': '#E8E9EB',
  'border-subtle': p.neutral[100],
  'border-strong': p.neutral[300],
  'border-prominent': p.neutral[400],        // high-visibility divider
  'border-focus': p.blue[600],
  'border-input': p.neutral[300],             // Input field border
  'border-input-hover': p.neutral[400],       // Input field border on hover
  'border-input-focus': p.blue[600],          // Input field border on focus
  'border-input-error': p.red[600],           // Input field border on error

  // Interactive states (interactive-*)
  'interactive-hover': 'rgba(55, 65, 81, 0.04)',
  'interactive-focus': 'rgba(55, 65, 81, 0.12)',
  'interactive-active': 'rgba(55, 65, 81, 0.16)',
  'interactive-selected': 'rgba(55, 65, 81, 0.08)',
  'interactive-disabled': 'rgba(55, 65, 81, 0.12)',
  'interactive-disabled-text': 'rgba(55, 65, 81, 0.26)',

  // Divider
  'divider': '#E8E9EB',

  // Avatar default
  'avatar-background': p.neutral[500],
  'avatar-text': p.white,
} as const

// Dark mode semantic colors
export const semanticColorsDark = {
  // Brand colors stay the same in dark mode
  'brand-primary': ramp.orange[400],
  'brand-primary-light': ramp.orange[300],
  'brand-primary-dark': ramp.orange[500],
  'brand-primary-subtle': 'rgba(255, 121, 0, 0.12)',
  'brand-primary-hover': ramp.orange[300],
  'brand-primary-active': ramp.orange[200],

  'brand-secondary': ramp.cyan[600],
  'brand-secondary-light': ramp.cyan[500],
  'brand-secondary-dark': ramp.cyan[700],
  'brand-secondary-subtle': 'rgba(48, 123, 155, 0.12)',
  'brand-secondary-hover': ramp.cyan[500],
  'brand-secondary-active': ramp.cyan[400],

  // Text on brand backgrounds
  'on-brand-primary': p.white,
  'on-brand-secondary': p.white,

  // Status colors
  'status-success': ramp.green[300],
  'status-success-light': ramp.green[200],
  'status-success-dark': ramp.green[600],
  'status-success-subtle': 'rgba(46, 213, 115, 0.12)',

  // Live-session accent — its OWN role, decoupled from success so the two can diverge
  'status-live': ramp.green[300],
  'status-live-muted': ramp.green[500],

  'status-error': ramp.red[600],
  'status-error-light': ramp.red[500],
  'status-error-dark': ramp.red[700],
  'status-error-subtle': 'rgba(209, 67, 67, 0.12)',

  'status-error-vivid': p.redVivid[500],
  'status-error-vivid-light': p.redVivid[400],
  'status-error-vivid-dark': p.redVivid[700],
  'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',

  'status-warning': ramp.amber[300],
  'status-warning-light': ramp.amber[200],
  'status-warning-dark': ramp.amber[500],
  'status-warning-subtle': 'rgba(249, 180, 21, 0.12)',

  'status-info': ramp.blue[500],
  'status-info-light': ramp.blue[300],
  'status-info-dark': ramp.blue[600],
  'status-info-subtle': 'rgba(33, 150, 243, 0.12)',

  // Text on status backgrounds
  'on-status-success': p.white,
  'on-status-error': p.white,
  'on-status-warning': p.white,
  'on-status-info': p.white,

  // Result/outcome indicators (result-*)
  'result-improve': '#4caf50',
  'result-improve-light': 'rgba(76, 175, 80, 0.16)',
  'result-improve-dark': '#248a24',
  'result-degrade': '#ef5350',
  'result-degrade-light': 'rgba(239, 83, 80, 0.16)',
  'result-degrade-dark': '#b30000',
  'result-inconclusive': '#9E9A97',
  'result-inconclusive-light': 'rgba(158, 154, 151, 0.16)',
  'result-neutral': p.neutral[400],

  // Text on result backgrounds
  'on-result-improve': p.white,
  'on-result-degrade': p.white,
  'on-result-inconclusive': p.white,

  // Data visualization colors (same in dark mode for consistency)
  'data-1': discreteRainbow[9],
  'data-2': discreteRainbow[14],
  'data-3': discreteRainbow[17],
  'data-4': discreteRainbow[25],
  'data-5': discreteRainbow[8],
  'data-6': discreteRainbow[20],
  'data-7': discreteRainbow[13],
  'data-8': discreteRainbow[15],
  'data-9': discreteRainbow[3],
  'data-10': discreteRainbow[22],

  // Text colors - inverted for dark mode
  'text-primary': p.neutral[100],
  'text-secondary': p.neutral[400],
  'text-tertiary': p.neutral[500],
  'text-disabled': 'rgba(255, 255, 255, 0.38)',
  'text-inverse': p.neutral[900],
  'text-link': '#828DF8',
  'text-link-hover': p.blue[400],

  // Surface ramp — warm TAPERED (warm shadows → near-neutral highlights), lifted, de-collided
  // DERIVED ramp: CIELAB L* off shell (L*9) with DIMINISHING steps [4.5,2.5,2,1.5],
  // warm-tapered (R−B 6→1.5). Compressed span (L*9→19.5) — upper steps carried by
  // hairline+shadow+paper, not lightness. See lab story `Surface Ramp System`.
  'surface-base': '#252321',               // main surface — L* 13.5
  'surface-elevated': '#2A2827',           // elevated surface (nav/rail) — L* 16
  'surface-raised': '#2D2C2B',             // raised surface (cards) — L* 18
  'surface-overlay': '#302F2E',            // overlay surface (hero/popover) — L* 19.5
  'surface-input': '#13100D',              // inset well — sub-shell, L* 4.5

  // Background colors
  'background-base': '#1C1916',            // shell / frame — L* 9
  'background-default': '#252321',         // main background
  'background-subtle': '#2A2827',          // subtle background

  // Border colors — self-normalizing alpha-white hairlines
  'border-default': 'rgba(255,255,255,0.09)',   // default border
  'border-subtle': 'rgba(255,255,255,0.06)',    // subtle border
  'border-strong': 'rgba(255,255,255,0.14)',    // strong border
  'border-prominent': 'rgba(255,255,255,0.20)', // high-visibility divider
  'border-focus': '#828DF8',
  'border-input': p.neutral[600],
  'border-input-hover': p.neutral[500],
  'border-input-focus': '#828DF8',
  'border-input-error': p.red[500],

  // Interactive states
  'interactive-hover': 'rgba(255, 255, 255, 0.04)',
  'interactive-focus': 'rgba(255, 255, 255, 0.12)',
  'interactive-active': 'rgba(255, 255, 255, 0.16)',
  'interactive-selected': 'rgba(255, 255, 255, 0.08)',
  'interactive-disabled': 'rgba(255, 255, 255, 0.12)',
  'interactive-disabled-text': 'rgba(255, 255, 255, 0.26)',

  // Divider
  'divider': p.charcoal[400],              // divider color

  // Avatar default
  'avatar-background': p.neutral[600],
  'avatar-text': p.white,
} as const

// Typography tokens matching existing app
export const semanticTypography = {
  // Headings (Space Grotesk)
  h1: {
    fontFamily: 'heading',
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h2: {
    fontFamily: 'heading',
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h3: {
    fontFamily: 'heading',
    fontSize: '2.25rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h4: {
    fontFamily: 'heading',
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.375,
  },
  h5: {
    fontFamily: 'heading',
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.375,
  },
  h6: {
    fontFamily: 'heading',
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.375,
  },

  // Body text (Nunito Sans)
  body1: {
    fontFamily: 'body',
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontFamily: 'body',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.57,
  },
  subtitle1: {
    fontFamily: 'body',
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.75,
  },
  subtitle2: {
    fontFamily: 'body',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
  },
  caption: {
    fontFamily: 'body',
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
  },
  overline: {
    fontFamily: 'body',
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 2.5,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: 'sans',
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
  },
} as const

// Button size tokens
export const buttonSizes = {
  sm: {
    paddingX: '16px',
    paddingY: '6px',
    fontSize: '0.875rem',
  },
  md: {
    paddingX: '20px',
    paddingY: '8px',
    fontSize: '0.875rem',
  },
  lg: {
    paddingX: '24px',
    paddingY: '11px',
    fontSize: '1rem',
  },
} as const

// Export type for theme mode
export type ThemeMode = 'light' | 'dark'

// Helper to get semantic colors based on mode
export function getSemanticColors(mode: ThemeMode) {
  return mode === 'dark' ? semanticColorsDark : semanticColorsLight
}
