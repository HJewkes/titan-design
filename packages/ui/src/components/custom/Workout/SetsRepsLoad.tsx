// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { MetricCell } from './metricText'

const t = getSemanticColors('dark')

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
  className?: string
}

/**
 * The `sets × reps @ load` prescription line, in the TempoDisplay visual language
 * (Inter · 600 · letter-spacing 1 · value cells with muted `×` / `@` separators).
 * Shares the {@link MetricCell} primitive with TempoDisplay so the two stay in step.
 */
export function SetsRepsLoad({
  sets,
  reps,
  load,
  unit = 'lb',
  fontSize,
  className,
  ...props
}: SetsRepsLoadProps) {
  const value = t['text-primary']
  const sep = t['text-tertiary']

  return (
    <View
      className={className}
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
      accessibilityLabel={`${sets} sets of ${reps} reps at ${load} ${unit}`}
      testID="sets-reps-load"
      {...props}
    >
      <MetricCell color={value} fontSize={fontSize}>
        {sets}
      </MetricCell>
      <MetricCell color={sep} fontSize={fontSize}>{` ${TIMES} `}</MetricCell>
      <MetricCell color={value} fontSize={fontSize}>
        {reps}
      </MetricCell>
      <MetricCell color={sep} fontSize={fontSize}>{` ${AT} `}</MetricCell>
      <MetricCell color={value} fontSize={fontSize}>
        {load}
      </MetricCell>
      <MetricCell color={sep} fontSize={fontSize}>{` ${unit}`}</MetricCell>
    </View>
  )
}
