/**
 * How a volume status paints: the figure fill, the chip and legend dot colour, and
 * the ring that keeps "no verdict" apart from a solid dot. Split from
 * `muscleTaxonomy`, which re-exports every name here.
 */
import { heatmapColors } from '../../../theme/workout-tokens'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import type { VolumeStatus } from './muscleTaxonomy'

/** Statuses with no stop on the diverging scale. */
type OffScaleStatus = 'untrained' | 'noverdict'

/**
 * The status → `dataviz-diverging-*` role map: the palette decision of VW-333,
 * in one place. Both the figure fill and the chip dot read it, which is what
 * makes a muscle render one hue everywhere.
 *
 * `untrained` is absent on purpose. It is not a stop on the diverging scale, and
 * the two surfaces answer it differently: the figure has no data to paint (the
 * muscle is simply missing from `data` and keeps the outline fill), while the
 * chip shows a muted `text-tertiary` dot. `noverdict` is absent too: it has sets
 * but no landmarks to place them against, so both surfaces paint `result-neutral`.
 */
export const VOLUME_STATUS_DATAVIZ_TOKEN = {
  behind: 'dataviz-diverging-0',
  ontrack: 'dataviz-diverging-1',
  target: 'dataviz-diverging-2',
  approaching: 'dataviz-diverging-3',
  over: 'dataviz-diverging-4',
} as const satisfies Record<Exclude<VolumeStatus, OffScaleStatus>, string>

/**
 * Maps a volume status to its heatmap fill color. One status, one colour — the
 * intensity argument is gone with VW-333, because the near-MRV case it used to
 * decide is now the `approaching` status itself (see {@link landmarkZoneToStatus}).
 *
 * `mode` is REQUIRED and has no default (VW-371). A default would be a frozen
 * theme that `titan/no-frozen-theme` cannot see: every caller would omit it, and
 * the figure would silently paint dark colours in light mode the moment VW-371
 * phase 2 gives light its own values. Pass `useSurfaceMode()`. Same convention
 * as `paceToneColor` and `liveAuraColor`.
 */
export function getHeatmapColor(status: VolumeStatus | null | undefined, mode: ThemeMode): string {
  const heatmap = heatmapColors(mode)
  switch (status) {
    case 'noverdict':
      return heatmap.noverdict
    case 'behind':
      return heatmap.under
    case 'ontrack':
      return heatmap.maintenance
    case 'target':
      return heatmap.productive
    case 'approaching':
      return heatmap.approaching
    case 'over':
      return heatmap.over
    default:
      return heatmap.none
  }
}

/**
 * The chip dot colour for a status, resolved for a theme mode.
 *
 * The five painted statuses come off the same diverging roles the figure uses,
 * so a muscle is one colour on both surfaces. `untrained` is the one rung where
 * they differ on purpose: the figure has no data to paint and keeps its no-data
 * fill, while a chip still has to show something, so it takes the muted text role.
 * `noverdict` takes `result-neutral`, the same role the figure paints; the chip
 * draws it as a ring (see {@link isVolumeStatusDotRing}) so it never reads as untrained.
 *
 * A function of `mode` for the same reason `getHeatmapColor` is — `MuscleGroupChip`
 * is token-pure and cannot call `getSemanticColors` itself, so it passes
 * `useSurfaceMode()` in.
 */
export function volumeStatusDotColor(
  status: VolumeStatus | null | undefined,
  mode: ThemeMode
): string {
  const colors = getSemanticColors(mode)
  if (!status || status === 'untrained') return colors['text-tertiary']
  if (status === 'noverdict') return colors['result-neutral']
  return colors[VOLUME_STATUS_DATAVIZ_TOKEN[status]]
}

/** True when a status's dot draws as a hollow ring rather than a solid fill. */
export function isVolumeStatusDotRing(status: VolumeStatus | null | undefined): boolean {
  return status === 'noverdict'
}

/**
 * A status dot's paint: a `ringWidth` outline for a ring status, a solid fill otherwise.
 * The chip and both legends share it so "no verdict" is a ring in every view (VW-741).
 */
export function volumeStatusDotStyle(
  status: VolumeStatus | null | undefined,
  color: string,
  ringWidth = 1.5
): { borderWidth: number; borderColor: string } | { backgroundColor: string } {
  return isVolumeStatusDotRing(status)
    ? { borderWidth: ringWidth, borderColor: color }
    : { backgroundColor: color }
}
