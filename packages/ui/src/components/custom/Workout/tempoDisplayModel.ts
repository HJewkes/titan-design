import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import type { PacingNumberPalette } from '../Fatigue/tempo-pacing'

/** The four tempo phases, in the order the display renders them. */
export type TempoLivePhase = 'eccentric' | 'pauseBottom' | 'concentric' | 'pauseTop'

/**
 * Live rep state driving the phase-fill overlay. Controlled by the consumer
 * (matching titan's `elapsedMs`-in convention) so the same real timer feeds
 * both web dashboard and native app — TempoDisplay owns rendering only.
 */
export interface TempoLiveState {
  /** Phase currently in progress, or null when idle/at rest. */
  activePhase: TempoLivePhase | null
  /** Elapsed time (ms) within the active phase. */
  phaseElapsedMs: number
  /**
   * Actual completed durations (ms) for phases finished earlier THIS rep. A done cell
   * freezes at its final readout (not the target) until the next rep resets the row.
   * Omit a phase to fall back to its target (assume it completed on pace).
   */
  completed?: Partial<Record<TempoLivePhase, number>>
}

/**
 * Every colour the display paints, for one theme mode. A function rather than module
 * constants so the tempo row follows the enclosing Surface instead of freezing the dark
 * palette at import (VW-316). Phase hues stay non-semantic ramp pins.
 */
export function tempoColors(mode: ThemeMode) {
  const t = getSemanticColors(mode)
  const neutral = t['result-neutral']
  return {
    label: t['text-secondary'],
    surface: t['surface-raised'],
    liveLabel: t['status-live-muted'],
    textPrimary: t['text-primary'],
    textSecondary: t['text-secondary'],
    overlay: t['surface-overlay'],
    overlayEdge: t['surface-elevated'],
    slow: t['status-error'], // slow — over the target time
    onTarget: t['status-success'], // on target (within the band of 0.0)
    ahead: t['text-warning'], // ahead — still time left to the target; text rung clears 4.5:1 on the chip
    // Phase IDENTITY colours — deliberately NON-semantic (magenta ecc / cyan con) so the
    // phase hue never collides with the semantic pacing tones the active number carries.
    phase: {
      eccentric: primitiveRamps.magenta[400],
      pauseBottom: neutral,
      concentric: primitiveRamps.cyan[300],
      pauseTop: neutral,
      dash: neutral,
    },
  }
}

/** The active number's tone: pacing status mapped onto the theme's status colours. */
export function numberPalette(mode: ThemeMode): PacingNumberPalette {
  const c = tempoColors(mode)
  return { ahead: c.ahead, onPace: c.onTarget, over: c.slow, noTarget: c.textPrimary }
}
