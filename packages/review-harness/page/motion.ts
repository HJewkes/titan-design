import type { ArgMotion } from '@titan-design/review-schema'

/** Where an arg motion is: `position` runs 0..1 through its duration, whatever its arg's range. */
export interface PlayerState {
  playing: boolean
  position: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function initialPlayer(motion: ArgMotion): PlayerState {
  return { playing: motion.autoplay, position: 0 }
}

/** `elapsedMs` later: a looping motion wraps to the start, any other stops at the end. */
export function advance(state: PlayerState, elapsedMs: number, motion: ArgMotion): PlayerState {
  if (!state.playing || elapsedMs <= 0) return state
  const next = state.position + elapsedMs / motion.durationMs
  if (next < 1) return { ...state, position: next }
  return motion.loop ? { ...state, position: next % 1 } : { playing: false, position: 1 }
}

/** The scrubber sets the position and leaves play as it was. */
export function seek(state: PlayerState, position: number): PlayerState {
  return { ...state, position: clamp01(position) }
}

/** Play from the start once a non-looping motion has finished; otherwise play or pause. */
export function toggle(state: PlayerState): PlayerState {
  if (!state.playing && state.position >= 1) return { playing: true, position: 0 }
  return { ...state, playing: !state.playing }
}

/** The arg's value at a position, to four places so the URL-free channel sends stable numbers. */
export function argAt(motion: ArgMotion, position: number): number {
  return Number((motion.from + (motion.to - motion.from) * clamp01(position)).toFixed(4))
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

/** "1.2s / 3.0s · progress 0.40", what the controls read out. */
export function playheadLabel(motion: ArgMotion, position: number): string {
  const time = `${seconds(clamp01(position) * motion.durationMs)} / ${seconds(motion.durationMs)}`
  return `${time} · ${motion.arg} ${argAt(motion, position).toFixed(2)}`
}
