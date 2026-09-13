// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { useOnSurfaceColor } from '../../ui/surface/SurfaceContext'
import { MetricCell } from './metricText'

const TIMES = '×' // × multiplication sign, padded by muted separators
const AT = '@'

export interface SetsRepsLoadProps extends ViewProps {
  sets: number
  reps: number | string
  /** Load value; a string (e.g. "—") passes through verbatim for an unset/discovery load. */
  load: number | string
  /** Displayed load unit label (e.g. "lb", "kg"). */
  unit?: string
  /** Cell font size (px). Default 11 — the compact rail/card scale. Raise for a wall read-out. */
  fontSize?: number
  /**
   * Flatten the whole run to one dimmer, regular-weight tone (the collapsed/upcoming
   * card row) instead of the bright bold value / muted separator split (the rail).
   * Also drops the `×` separator's padding spaces — "3×6", not "3 × 6".
   */
  muted?: boolean
  className?: string
}

/**
 * The `sets × reps @ load` prescription line, in the TempoDisplay visual language
 * (Inter · letter-spacing 1 · value cells with muted `×` / `@` separators).
 * Shares the {@link MetricCell} primitive with TempoDisplay so the two stay in step.
 */
export function SetsRepsLoad({
  sets,
  reps,
  load,
  unit = 'lb',
  fontSize,
  muted = false,
  className,
  ...props
}: SetsRepsLoadProps) {
  const primary = useOnSurfaceColor('primary')
  const tertiary = useOnSurfaceColor('tertiary')
  const secondary = useOnSurfaceColor('secondary')
  const value = muted ? secondary : primary
  const sep = muted ? secondary : tertiary
  const weight = muted ? 400 : 600
  const times = muted ? TIMES : ` ${TIMES} `

  return (
    <View
      className={className}
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
      accessibilityLabel={`${sets} sets of ${reps} reps at ${load} ${unit}`}
      testID="sets-reps-load"
      {...props}
    >
      <MetricCell color={value} fontSize={fontSize} weight={weight}>
        {sets}
      </MetricCell>
      <MetricCell color={sep} fontSize={fontSize} weight={weight}>
        {times}
      </MetricCell>
      <MetricCell color={value} fontSize={fontSize} weight={weight}>
        {reps}
      </MetricCell>
      <MetricCell color={sep} fontSize={fontSize} weight={weight}>{` ${AT} `}</MetricCell>
      <MetricCell color={value} fontSize={fontSize} weight={weight}>
        {load}
      </MetricCell>
      <MetricCell color={sep} fontSize={fontSize} weight={weight}>{` ${unit}`}</MetricCell>
    </View>
  )
}
