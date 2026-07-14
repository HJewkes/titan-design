// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { CircularProgress, colorVarMap, type ProgressColor } from '../../ui/progress/Progress'
import { useTimer, type TimerMode } from '../../../hooks/useTimer'

export interface CircularTimerProps {
  /** Total duration (ms). `down`: the countdown length; `up`: the target for progress. */
  durationMs: number
  /** Controlled elapsed time (ms). */
  elapsedMs: number
  /** `down` (default) counts remaining toward 0 (ring drains); `up` counts elapsed up (ring fills). */
  mode?: TimerMode
  /** Ring diameter (px) — the geometry/stroke reference. Default 160. */
  size?: number
  /** Ring stroke width (px). Default 8. */
  strokeWidth?: number
  /** Fill the parent container (responsive) instead of a fixed `size` box. */
  fill?: boolean
  /** Ring color while running. Default `primary`. */
  color?: ProgressColor
  /**
   * `down` mode: the text shown in the center — and the color the ring fills to — when
   * the countdown completes (e.g. `doneLabel="GO"`). Omit to keep showing `0:00`.
   */
  doneLabel?: string
  /** Ring + center color when complete (with {@link doneLabel}). Default `success`. */
  doneColor?: ProgressColor
  /** Optional controls rendered below the ring (e.g. +30s / Skip). */
  controls?: ReactNode
  /** Accessibility label for the timer. Defaults to a seconds-remaining description. */
  accessibilityLabel?: string
  testID?: string
}

/**
 * A circular countdown / countup with a time readout in the center — the graphical
 * sibling of {@link TimerReadout}. Batteries-included: owns {@link useTimer} (pass
 * controlled `durationMs` + `elapsedMs`) and composes {@link CircularProgress} for the
 * arc (`down` drains as time runs out, `up` fills), rendering the mm:ss label in its
 * center slot. On completion (`down` + {@link doneLabel}) the ring fills fully in
 * {@link doneColor} and the center reads the done label — the "go" moment. An optional
 * {@link controls} node renders below the ring. Consumers (e.g. `RestTimer`'s `ring`
 * variant) wrap this and add their own domain chrome.
 */
export function CircularTimer({
  durationMs,
  elapsedMs,
  mode = 'down',
  size = 160,
  strokeWidth = 8,
  fill = false,
  color = 'primary',
  doneLabel,
  doneColor = 'success',
  controls,
  accessibilityLabel,
  testID,
}: CircularTimerProps) {
  const { remainingMs, progress, label, done } = useTimer({ mode, durationMs, elapsedMs })

  const isDone = done && mode === 'down'
  const showDone = isDone && doneLabel != null
  // Down → the remaining fraction (ring drains); up → elapsed progress (ring fills).
  // A completed countdown with a done label fills fully to signal "go".
  const remainingFrac = durationMs > 0 ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0
  const arc = mode === 'down' ? (showDone ? 1 : remainingFrac) : progress
  const ringColor: ProgressColor = showDone ? doneColor : color

  const remainingSec = Math.ceil(Math.max(0, remainingMs) / 1000)
  const a11y =
    accessibilityLabel ?? (isDone ? 'Timer complete' : `${remainingSec} seconds remaining`)

  return (
    <View
      style={{ alignItems: 'center', gap: 16 }}
      accessibilityRole="timer"
      accessibilityLabel={a11y}
      testID={testID ?? 'circular-timer'}
    >
      <CircularProgress
        value={arc}
        max={1}
        size={size}
        strokeWidth={strokeWidth}
        fill={fill}
        color={ringColor}
        // A distinct static name for the ring (the live countdown text lives on the
        // enclosing timer role) — satisfies the progressbar-name a11y rule without
        // duplicating the timer label.
        accessibilityLabel="Timer ring"
        testID="circular-timer-ring"
      >
        <Text
          className={showDone ? undefined : 'text-text-primary'}
          style={{
            fontSize: Math.round(size * (showDone ? 0.28 : 0.24)),
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
            letterSpacing: showDone ? 1 : -1,
            ...(showDone ? { color: colorVarMap[doneColor] } : null),
          }}
          testID="circular-timer-label"
        >
          {showDone ? doneLabel : label}
        </Text>
      </CircularProgress>
      {controls}
    </View>
  )
}
