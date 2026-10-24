/**
 * The palette and plane constants of {@link GoalTrajectoryPlot}, in a leaf module so the
 * plot's own layers (`GoalTrajectoryCalibrating`, `goalTrajectoryRuleLabels`) can read them
 * without importing the plot back (TD-43).
 */
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { pressedLevel, surfaceBackground, type SurfaceLevel } from '../../../theme/surface-planes'
import { alpha } from '../../../utils/colors'
import { LIFT_RIM_ALPHA } from '../../../theme/lift'
import { primitiveColors } from '../../../theme/tokens/primitives'
import type { GoalTrajectoryStatus } from './GoalTrajectoryChartGeometry'
import { BAND_OPACITY } from './GoalTrajectoryBand'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/**
 * Status tone tokens.
 *
 * `ahead` is a COOL tone, never warning-amber and no longer the brand orange:
 * amber is the pacing/PR hue, and REJECTED.md's "amber holds" rule is that a hue
 * must never collide with the semantic pacing tones. Orange satisfied the letter
 * of that rule but not its intent — beside `behind`'s amber it read as the same
 * warm family (VW-385 round 3, human call: "change ahead for chart and tile
 * together"). Blue cannot collide with amber at any value.
 *
 * Cyan (`brand-secondary`) was the other candidate and lost: the expected band is
 * painted in exactly that hue at 0.28 alpha, so an "ahead" line would sit on a
 * wash of itself. Blue's own overlap is `tolerated`, which shares the token; the
 * two never describe the same target at the same time.
 *
 * These are the existing semantic status tokens. When the `dataviz-*` semantic
 * keys land the chart-specific entries should move onto them; the map is the
 * single place that swap has to happen.
 */
export const STATUS_TOKEN = {
  on_track: 'status-success',
  ahead: 'status-info',
  behind: 'status-warning',
  tolerated: 'status-info',
  deload_week: 'result-neutral',
  calibrating: 'result-inconclusive',
  stalled: 'status-error',
  // The outcomes take the tones the derived verdict already used: reaching the
  // goal is success green, beating it is the `ahead` blue.
  goal_met: 'status-success',
  beyond_goal: 'status-info',
} as const satisfies Record<GoalTrajectoryStatus, ColorToken>

/** How much of the deload magenta the column carries over the plane: the owner's pick, round 7. */
export const DELOAD_WASH = 0.12
/** How much of the rule colour lights the current week's column, on the full and compact charts alike. */
export const CURRENT_WEEK_TINT = 0.12
export const PLANE_RADIUS = 6

/** The alpha a `rgba()` token carries, so a scrim can stand in for pure black. */
function tokenAlpha(color: string): number {
  const match = color.match(/,\s*([\d.]+)\s*\)$/)
  return match ? Number(match[1]) : 1
}

/** Literal colours for one theme mode and plane. Resolved at render, never at import. */
export function trajectoryPalette(
  mode: ThemeMode,
  level: SurfaceLevel,
  status: GoalTrajectoryStatus
) {
  const t = getSemanticColors(mode)
  const shade = t['scrim-default']
  return {
    status: t[STATUS_TOKEN[status]],
    band: alpha(t['brand-secondary'], BAND_OPACITY),
    bandHue: t['brand-secondary'],
    // The card rim's white and alpha, so the plane's lip matches every lifted card.
    lip: alpha(primitiveColors.white, LIFT_RIM_ALPHA[mode]),
    rule: t['text-secondary'],
    grid: alpha(t['text-primary'], 0.12),
    // The gridline's own hue, stronger than the 12% line so its value still reads.
    gridLabel: alpha(t['text-primary'], 0.3),
    axis: t['text-tertiary'],
    // The PR badge's own colour: one mark, one token (titan-0201 round 5).
    star: t['brand-primary'],
    // Deload's own magenta (titan-0201 round 5), not a grey tint. At 0.12 the marks over it
    // keep their contrast: readings 7.5, star 5.5, ramp 3.0.
    deload: alpha(t['status-deload'], DELOAD_WASH),
    currentWeek: alpha(t['text-secondary'], CURRENT_WEEK_TINT),
    boundary: alpha(t['text-tertiary'], 0.35),
    plane: surfaceBackground(pressedLevel(level), mode),
    shade,
    // Stop and flood opacities multiply with the scrim's own alpha.
    shadeScale: 1 / tokenAlpha(shade),
  }
}

export type TrajectoryPalette = ReturnType<typeof trajectoryPalette>

/** Which edge of the plot the committed and stretch labels anchor to. */
export type ReferenceLabelSide = 'left' | 'right'

/** Inset from the plot edge for left-anchored labels, so they clear the plane's rounded corner. */
export const LEFT_LABEL_INSET = PLANE_RADIUS + 2

/** The x a rule label anchors at for a given side. */
export function ruleLabelX(
  plot: { left: number; right: number },
  side: ReferenceLabelSide
): number {
  return side === 'left' ? plot.left + LEFT_LABEL_INSET : plot.right
}
