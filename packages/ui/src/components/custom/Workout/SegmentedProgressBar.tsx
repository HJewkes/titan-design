// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ViewProps } from 'react-native'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { SegmentedBar } from './SegmentedBar'
import { paceTone, paceToneColor } from './paceTone'

/** Default overlay-marker colour: status-live-muted — the SideNav "Live" cue / active-timer green. */
const DEFAULT_MARKER_COLOR = primitiveRamps.green[500]

export interface SegmentedProgressBarSegment {
  /** Weight of this segment's slot — e.g. an exercise's planned set count. */
  weight: number
}

export interface SegmentedProgressBarProps extends ViewProps {
  /** The weighted segments, laid left-to-right (e.g. one per exercise). */
  segments: SegmentedProgressBarSegment[]
  /** Cumulative progress in the SAME units as the summed weights (e.g. sets done). May be fractional. */
  value: number
  /** 0..1 position for the overlay pace marker (e.g. elapsed / budget). Omit → no marker, neutral tone. */
  target?: number
  /** Overlay-marker colour. Default the live-green (status-live-muted). */
  markerColor?: string
  /** Override the single pace fill colour. Default = paceToneColor(paceTone(value / total, target)). */
  color?: string
  /** Track height in px. Passed through to SegmentedBar. */
  height?: number
  /** Gap between segment slots in px. Passed through to SegmentedBar. */
  gap?: number
}

/**
 * A progress bar segmented by weighted slots (one chunk per exercise, width ∝ its
 * set count): `value` fills the chunks left-to-right, and a single pace colour spans
 * them all — green when at/ahead of the `target` pace, amber when behind, steel when
 * there is no target. An optional overlay marker pins the target position. Composes
 * {@link SegmentedBar} + {@link paceTone}.
 */
export function SegmentedProgressBar({
  segments,
  value,
  target,
  markerColor = DEFAULT_MARKER_COLOR,
  color,
  height,
  gap,
  ...props
}: SegmentedProgressBarProps) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0)
  const fillColor = color ?? paceToneColor(paceTone(total > 0 ? value / total : 0, target))

  const barSegments = segments.map((seg, i) => {
    const cumulativeBefore = segments.slice(0, i).reduce((sum, s) => sum + s.weight, 0)
    const fill = Math.max(0, Math.min(1, (value - cumulativeBefore) / seg.weight))
    return { weight: seg.weight, fill, color: fillColor }
  })

  return (
    <SegmentedBar
      segments={barSegments}
      marker={target != null ? { position: target, color: markerColor } : null}
      height={height}
      gap={gap}
      {...props}
    />
  )
}
