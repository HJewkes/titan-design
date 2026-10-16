// An in/hold/out reading of a window as a pure function of time; nothing here reads a clock.
import { useBeatTime } from './Beat'

/** Where a time falls in an envelope. */
export type EnvelopePhase = 'before' | 'in' | 'hold' | 'out' | 'after'

/** Fixed entrance and exit lengths for `envelope`, in seconds. Both default to 0. */
export interface EnvelopeOptions {
  /** Length of the entrance. */
  inS?: number
  /** Length of the exit, ending with the window. */
  outS?: number
}

/** A time read against an envelope. */
export interface Envelope {
  /** Where the time falls; `after` from `durationS` on, as `localTime` reads it. */
  phase: EnvelopePhase
  /** Progress through the entrance, in [0, 1]; 1 once it is over. */
  inP: number
  /** Progress through the exit, in [0, 1]; 0 until it starts. */
  outP: number
  /** Seconds into the hold, in [0, holdS]. */
  holdT: number
  /** Length of the hold: whatever the window leaves after the entrance and exit. */
  holdS: number
}

const unit = (x: number) => Math.min(1, Math.max(0, x))

/**
 * Reads `t` (seconds from the window's start) against a window of `durationS` with a fixed entrance and
 * exit and an elastic hold between them. When `inS + outS` exceeds the window, both shrink in proportion
 * and the hold is 0; time itself is never scaled. A negative length throws a `RangeError`.
 */
export function envelope(
  t: number,
  durationS: number,
  { inS = 0, outS = 0 }: EnvelopeOptions = {}
): Envelope {
  if (durationS < 0 || inS < 0 || outS < 0) {
    throw new RangeError('envelope: durationS, inS and outS must not be negative')
  }
  const scale = inS + outS > durationS ? durationS / (inS + outS) : 1
  const inLength = inS * scale
  const outLength = outS * scale
  const holdS = durationS - inLength - outLength
  const outStart = durationS - outLength
  return {
    phase: envelopePhase(t, durationS, inLength, outStart),
    inP: inLength > 0 ? unit(t / inLength) : t >= 0 ? 1 : 0,
    outP: outLength > 0 ? unit((t - outStart) / outLength) : t >= durationS ? 1 : 0,
    holdT: Math.min(holdS, Math.max(0, t - inLength)),
    holdS,
  }
}

function envelopePhase(
  t: number,
  durationS: number,
  inLength: number,
  outStart: number
): EnvelopePhase {
  if (t < 0) return 'before'
  if (t >= durationS) return 'after'
  if (t < inLength) return 'in'
  return t < outStart ? 'hold' : 'out'
}

/** `envelope` over the enclosing Beat's window, read from its local time. */
export function useBeatEnvelope(options: EnvelopeOptions = {}): Envelope {
  const { t, phase, durationS } = useBeatTime()
  return envelope(phase === 'before' ? -Infinity : t, durationS, options)
}
