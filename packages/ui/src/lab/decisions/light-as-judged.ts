import {
  alertRedVivid,
  greyRamp,
  primitiveColors,
  primitiveRamps as ramp,
} from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

/**
 * The light tokens TD-789 3b changed, at the values they had before it. A decision record
 * measured on the old light ramp reads its colours from `colorsAsJudged`, so its printed
 * ratios stay the ones the owner judged.
 */
export const LIGHT_BEFORE_3B: Record<string, string> = {
  'surface-base': primitiveColors.white,
  'surface-elevated': greyRamp[50],
  'surface-raised': greyRamp[100],
  'background-base': greyRamp[100],
  'background-default': primitiveColors.white,
  'background-subtle': greyRamp[50],
  'background-frame': greyRamp[400],
  'text-secondary': greyRamp[700],
  'text-tertiary': greyRamp[600],
  'text-success': ramp.green[700],
  'text-brand-secondary': ramp.cyan[700],
  'border-input': greyRamp[500],
  'border-input-hover': greyRamp[600],
  'status-success': ramp.green[600],
  'status-warning': ramp.amber[500],
  'status-info': ramp.blue[600],
  'status-error-vivid': alertRedVivid,
  'status-deload': ramp.magenta[600],
  'hairline-default': 'rgba(0, 0, 0, 0.15)',
  'hairline-strong': 'rgba(0, 0, 0, 0.22)',
  divider: 'rgba(0, 0, 0, 0.15)',
}

/** A mode's semantic colours as a pre-3b decision was judged: light rolled back, dark as shipped. */
export function colorsAsJudged(mode: ThemeMode): ReturnType<typeof getSemanticColors> {
  const colors = getSemanticColors(mode)
  return mode === 'light' ? { ...colors, ...LIGHT_BEFORE_3B } : colors
}
