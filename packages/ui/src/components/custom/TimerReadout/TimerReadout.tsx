import { type ReactNode } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { useTimer, formatDuration, type TimerMode } from '../../../hooks/useTimer'
import { Typography } from '../Typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveRamps } from '../../../theme/tokens/primitives'

const semantic = getSemanticColors('dark')
// status-live-muted — the SideNav "Live" cue; the elapsed value goes green while ticking.
const LIVE_GREEN = primitiveRamps.green[500]
const SECONDARY = semantic['text-secondary']
const TERTIARY = semantic['text-tertiary']

const DEFAULT_GLYPH = '⏱'

export interface TimerReadoutProps extends ViewProps {
  /** 'up' counts elapsed upward; 'down' counts remaining toward 0. Default 'up'. */
  mode?: TimerMode
  /** Controlled elapsed time in ms. When set, the value is derived from it and never self-ticks. */
  elapsedMs?: number
  /** Total duration in ms — required for 'down' mode and for the ` / total` suffix. */
  durationMs?: number
  /** Live cue: the current value goes green while true. */
  running?: boolean
  /** Enable the internal 1s interval (ignored when `elapsedMs` is controlled). */
  autoTick?: boolean
  /** When `durationMs` is set, append ` / mm:ss`. */
  showTotal?: boolean
  /** Leading glyph; defaults to the ⏱ unicode. */
  glyph?: ReactNode
}

/**
 * Atom · TimerReadout — a small textual timer (⏱ + mono, right-justified) built on
 * [useTimer]. Matches the TopBar clock treatment: only the live/current value goes
 * green (status-live-muted) while `running`; the ` / total` suffix stays dim tertiary.
 */
export function TimerReadout({
  mode = 'up',
  elapsedMs,
  durationMs,
  running = false,
  autoTick = false,
  showTotal = false,
  glyph = DEFAULT_GLYPH,
  className,
  ...rest
}: TimerReadoutProps) {
  const { label } = useTimer({ mode, durationMs, elapsedMs, running, autoTick })

  const currentColor = running ? LIVE_GREEN : SECONDARY
  const total = showTotal && durationMs != null ? formatDuration(durationMs) : null

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={total != null ? `${label} of ${total}` : label}
      className={cn('flex-row items-baseline justify-end', className)}
      {...rest}
    >
      <Typography variant="mono" style={{ fontSize: 11, textAlign: 'right' }}>
        <Text testID="timer-readout-glyph" style={{ color: currentColor, marginRight: 3 }}>
          {glyph}
        </Text>
        <Text testID="timer-readout-current" style={{ color: currentColor }}>
          {label}
        </Text>
        {total != null ? (
          <Text testID="timer-readout-total" style={{ color: TERTIARY }}>{` / ${total}`}</Text>
        ) : null}
      </Typography>
    </View>
  )
}
