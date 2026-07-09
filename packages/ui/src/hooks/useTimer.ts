import { useEffect, useState } from 'react'

export type TimerMode = 'up' | 'down'

export interface UseTimerOptions {
  /** 'up' counts elapsed upward; 'down' counts remaining toward 0. Default 'up'. */
  mode?: TimerMode
  /** Total duration in ms. Required for 'down' mode and for progress in 'up' mode. */
  durationMs?: number
  /** Controlled elapsed time in ms. When provided, the hook derives everything from it and never ticks. */
  elapsedMs?: number
  /** Self-tick only advances while running. */
  running?: boolean
  /** Enable the internal interval. Ignored when `elapsedMs` is controlled. */
  autoTick?: boolean
  /** Interval step in ms. Default 1000. */
  tickMs?: number
}

export interface TimerState {
  elapsedMs: number
  remainingMs: number
  /** 0..1, clamped. */
  progress: number
  /** mm:ss for the active direction (remaining when 'down', elapsed when 'up'). */
  label: string
  /** True once a down-timer reaches 0 (or an up-timer passes its duration). */
  done: boolean
}

/** Format a millisecond duration as mm:ss, rounding partial seconds up. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function useTimer(options: UseTimerOptions = {}): TimerState {
  const {
    mode = 'up',
    durationMs,
    elapsedMs: controlledElapsedMs,
    running = false,
    autoTick = false,
    tickMs = 1000,
  } = options

  const isControlled = controlledElapsedMs != null
  const [internalElapsedMs, setInternalElapsedMs] = useState(0)

  useEffect(() => {
    if (isControlled || !autoTick || !running) return
    const id = setInterval(() => {
      setInternalElapsedMs((prev) => prev + tickMs)
    }, tickMs)
    return () => clearInterval(id)
  }, [isControlled, autoTick, running, tickMs])

  const elapsedMs = isControlled ? controlledElapsedMs : internalElapsedMs

  const hasDuration = durationMs != null && durationMs > 0
  const remainingMs = durationMs != null ? Math.max(0, durationMs - elapsedMs) : 0

  let progress: number
  if (hasDuration) {
    progress = Math.min(1, Math.max(0, elapsedMs / durationMs))
  } else {
    // A zero/undefined duration is trivially complete for a countdown, empty for a stopwatch.
    progress = mode === 'down' ? 1 : 0
  }

  const label = formatDuration(mode === 'down' ? remainingMs : elapsedMs)
  const done = durationMs != null && elapsedMs >= durationMs

  return { elapsedMs, remainingMs, progress, label, done }
}
