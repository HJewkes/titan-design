// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * Shared tokens + pure colour helpers for the live-fatigue family. Everything here
 * is token-sourced (semantic tokens / primitive ramps) — no literal surface hex — so
 * the family inherits the surface-ramp refresh when it lands.
 */
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'
import type { DimensionTone, FatigueVerdictState, SamplePhase } from './fatigue-model'

const t = getSemanticColors('dark')

export const FONT_HEAD = '"Space Grotesk", sans-serif'
export const FONT_UI = '"Nunito Sans", sans-serif'
export const FONT_MONO = 'monospace'

/** Per-dimension tone → semantic status colour (the one language the dots + hero share). */
export const TONE_COLOR: Record<DimensionTone, string> = {
  ok: t['status-success'],
  warn: t['status-warning'],
  alarm: t['status-error'],
}

/** Verdict state → the hero word. */
export const STATE_LABEL: Record<FatigueVerdictState, string> = {
  good: 'Good',
  slowing: 'Slowing',
  grinding: 'Grinding',
  'form-breakdown': 'Form breaking down',
}

/**
 * The phase-identity colours for the ghost-spark zero-axis — the TempoDisplay
 * language: eccentric magenta, concentric cyan, idle (pause/hold) a muted grey.
 */
export const PHASE_AXIS_COLOR: Record<SamplePhase, string> = {
  eccentric: primitiveRamps.magenta[800],
  concentric: primitiveRamps.cyan[800],
  idle: primitiveColors.charcoal[300],
}

/** Mini-tempo digit colours `[ecc, pauseBottom, con, pauseTop]` — ecc magenta / con cyan / pauses grey. */
export const TEMPO_DIGIT_COLOR: [string, string, string, string] = [
  primitiveRamps.magenta[400],
  primitiveColors.charcoal[400],
  primitiveRamps.cyan[300],
  primitiveColors.charcoal[400],
]

// --- ghost-spark line tint (green-intensity, control-aware) ---------------------
/** Below this grind signature the rep is "controlled" → green; at/above it warms. */
export const GRIND_THRESHOLD = 0.35
const GREEN_BRIGHT = t['status-success']
const GREEN_DEEP = primitiveRamps.green[600]
const AMBER = t['status-warning']
const RED = t['status-error']

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const f =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}

/** Linear mix of two hex colours (`t` 0..1). Both inputs are token-sourced hex. */
export function mixHex(a: string, b: string, ratio: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * clamp01(ratio))
  return `#${[m(ar, br), m(ag, bg), m(ab, bb)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * The ghost-spark current-line tint from the two control-aware signals.
 *
 * A CONTROLLED rep (`grindSignature < GRIND_THRESHOLD`) stays GREEN — brightest at
 * `tempoDeviation` 0, deepening (hue held) toward 1, so "slow but smooth" reads as a
 * deeper green, never a warning. A COLLAPSING rep warms hue amber (at the threshold)
 * → red (at 1.0) by `grindSignature`.
 */
export function ghostLineColor(tempoDeviation: number | null, grindSignature: number): string {
  if (grindSignature >= GRIND_THRESHOLD) {
    const severity = (grindSignature - GRIND_THRESHOLD) / (1 - GRIND_THRESHOLD)
    return mixHex(AMBER, RED, severity)
  }
  return mixHex(GREEN_BRIGHT, GREEN_DEEP, tempoDeviation ?? 0)
}

/** Verdict state → the {@link LiveAuraFrame} coaching-flood category. */
export function auraForVerdict(
  state: FatigueVerdictState | null
): 'productive' | 'threshold' | 'stop' {
  if (state == null || state === 'good') return 'productive'
  if (state === 'form-breakdown') return 'stop'
  return 'threshold'
}
