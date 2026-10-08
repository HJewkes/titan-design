import {
  getSemanticColors,
  semanticColorsDark,
  type ThemeMode,
} from '../../../theme/tokens/semantic'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

const SOLID_LABEL_TOKEN = {
  primary: 'on-brand-primary',
  secondary: 'on-brand-secondary',
  success: 'on-status-success',
  error: 'on-status-error',
  warning: 'on-status-warning',
  info: 'on-status-info',
} as const

const TONE_TOKEN = {
  primary: 'brand-primary',
  secondary: 'brand-secondary',
  success: 'status-success',
  error: 'status-error',
  warning: 'status-warning',
  info: 'status-info',
} as const

/**
 * The solid label for RNW where Tailwind text classes get dropped: the `on-*` token of the
 * surface mode, as the className path reads it (AW-141). Was the dark token in both modes,
 * which missed AA on four light fills once their light values were tuned (TD-719) and on the
 * info fill (console round 4). One exception: light `on-status-warning` is white on amber[500]
 * (3.68, declared in contrast-baseline.json), while the dark label reads 4.7 there, so the
 * light warning Button keeps the dark label until the light token moves.
 */
export function solidLabelColor(mode: ThemeMode, color: ButtonColor): string {
  if (mode === 'light' && color === 'warning') return semanticColorsDark['on-status-warning']
  return getSemanticColors(mode)[SOLID_LABEL_TOKEN[color]]
}

/**
 * The tone colour of the outline, ghost and link labels and the outline border, inline for RNW:
 * the dark token in both modes, as it has always been.
 */
export function toneColor(color: ButtonColor): string {
  return semanticColorsDark[TONE_TOKEN[color]]
}

/** The inline label colour of a Button for its variant and colour on the surface mode. */
export function labelColor(mode: ThemeMode, variant: ButtonVariant, color: ButtonColor): string {
  return variant === 'solid' ? solidLabelColor(mode, color) : toneColor(color)
}
