import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'

export type ProgressColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

const colorTokenMap = {
  primary: 'brand-primary',
  secondary: 'brand-secondary',
  success: 'status-success',
  error: 'status-error',
  warning: 'status-warning',
  info: 'status-info',
} as const satisfies Record<ProgressColor, keyof ReturnType<typeof getSemanticColors>>

/**
 * Literal-hex colour for a ProgressColor in a theme mode. SVG strokes and inline text
 * cannot rely on CSS variables on the raw-RN wall SPA (VW-316), as Spinner does.
 */
export function progressColor(color: ProgressColor, mode: ThemeMode): string {
  return getSemanticColors(mode)[colorTokenMap[color]]
}
