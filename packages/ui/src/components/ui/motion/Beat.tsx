import { createContext, useContext, type ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { TimeOriginContext, useLocalTime, useRawLocalTime, type LocalTime } from './hooks'

/** A beat stays mounted this long either side of its window, so entrances can pre-roll. */
export const BEAT_MOUNT_MARGIN_S = 0.5

const BeatDurationContext = createContext(0)

/** Props for `Beat`. */
export interface BeatProps {
  /** Seconds from the enclosing origin at which the beat's window starts. */
  startS: number
  /** Length of the window in seconds. */
  durationS: number
  /** The beat's content, timed from the beat's start. */
  children?: ReactNode
}

/** A window of the timeline: moves the time origin to `startS` and mounts only near its window. */
export function Beat({ startS, durationS, children }: BeatProps) {
  const origin = useContext(TimeOriginContext)
  const raw = useRawLocalTime(startS, durationS + BEAT_MOUNT_MARGIN_S)
  if (raw < -BEAT_MOUNT_MARGIN_S || raw > durationS + BEAT_MOUNT_MARGIN_S) return null
  return (
    <TimeOriginContext.Provider value={origin + startS}>
      <BeatDurationContext.Provider value={durationS}>{children}</BeatDurationContext.Provider>
    </TimeOriginContext.Provider>
  )
}

/** Local time across the enclosing Beat's whole window. */
export function useBeatTime(): LocalTime & { durationS: number } {
  const durationS = useContext(BeatDurationContext)
  return { ...useLocalTime(0, durationS), durationS }
}

/** Props for `BeatFrame`. */
export interface BeatFrameProps {
  /** Names the beat for capture tooling, as the test ID `beat-<kind>`. */
  kind: string
  /** Tailwind overrides, merged with `cn()`. */
  className?: string
  /** The beat's content. */
  children?: ReactNode
}

/**
 * The root of a beat. A Beat stays mounted for its margin either side of its window, so the frame
 * hides outside it; otherwise the next beat covers the last half second of the current one. The
 * hidden state is always set explicitly, so the output never depends on seek history.
 */
export function BeatFrame({ kind, className, children }: BeatFrameProps) {
  const { phase } = useBeatTime()
  const visible = phase === 'during'
  return (
    <View
      className={cn('flex-1', className)}
      style={{ opacity: visible ? 1 : 0 }}
      testID={`beat-${kind}`}
      pointerEvents={visible ? 'auto' : 'none'}
      aria-hidden={!visible}
    >
      {children}
    </View>
  )
}
