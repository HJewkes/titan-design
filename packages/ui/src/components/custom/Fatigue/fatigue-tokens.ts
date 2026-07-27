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
 * The phase-identity colours for the ghost-spark phase BAND — the TempoDisplay
 * language: eccentric magenta, concentric cyan, hold and idle in the grey family.
 *
 * The idle grey has to read as BAND MATERIAL (a pause the lifter held), not as a
 * hole in the strip: at charcoal[300] it sat inside the surface-ramp's own value
 * range (`surface-raised` #31302F) so a short pause between ECC and CON read as a
 * gap. charcoal[200] clears every content plane while staying quieter than the two
 * saturated phase tones, so the band reads contiguous and the phases still lead.
 *
 * `hold` stays GREY rather than taking a hue of its own. It was briefly amber, which
 * was wrong for a reason worth recording: the phase-pacing tone (`pacingTone`) uses
 * warning-amber for "ahead of target", so an amber phase hue collides with the semantic
 * signal painted on top of it. Phase hues are deliberately non-semantic precisely so
 * pacing can own success/warning/error. Grey also reads more like a hold — a held
 * position is an absence of movement, not an event.
 *
 * Hold and idle are separated by VALUE rather than hue, plus the `HOLD` label and the
 * fact that a hold PACES (it has a prescribed duration) while idle never fills:
 *   unfilled hold  charcoal[300]  — darker than idle
 *   idle           charcoal[200]
 *   filled hold    charcoal[100]  — brighter than idle
 * so a hold reads apart from dead time at any fill level, including the narrow runs
 * where the label drops out.
 */
export const PHASE_AXIS_COLOR: Record<SamplePhase, string> = {
  eccentric: primitiveRamps.magenta[800],
  concentric: primitiveRamps.cyan[800],
  hold: primitiveColors.charcoal[100],
  idle: primitiveColors.charcoal[200],
}

/**
 * The UNFILLED base a phase sits at before its pacing fill covers it — the same hue,
 * pulled back. {@link PHASE_AXIS_COLOR} is the FILL, so a phase that runs its full
 * prescribed duration ends up looking exactly as the band did before pacing existed;
 * muting is only ever visible where the lifter is UNDER target.
 *
 * `idle` has no prescribed duration, never fills, and so its base is its colour.
 */
export const PHASE_AXIS_BASE_COLOR: Record<SamplePhase, string> = {
  eccentric: primitiveRamps.magenta[950],
  concentric: primitiveRamps.cyan[950],
  hold: primitiveColors.charcoal[300],
  idle: primitiveColors.charcoal[200],
}

/**
 * Pacing tones for a label sitting INSIDE the band — ahead / on pace / over.
 *
 * Only ECC and CON carry labels, so the backgrounds these must survive are the eccentric
 * and concentric fills and their muted bases. The binding one is the CONCENTRIC FILL
 * (cyan[800]) — a mid-dark blue, so a legible tone on it has to stay fairly light.
 *
 * Ramp step **300** is the DEEPEST step at which all three clear 4.5:1:
 *
 *   worst-case contrast over {ecc, con} × {fill, base}   (worst is always conFill)
 *     red[300]    4.91      red[400] = 3.59 — fails
 *     amber[300]  5.48      amber[400] = 3.76 — fails
 *     green[300]  5.16      green[400] = 4.15 — fails
 *
 * `over` cannot go deeper than this without losing legibility, which is a property of
 * small light-on-dark text rather than a choice: the 3:1 large-text allowance needs ~18.7px
 * bold and these labels are 8px. `status-error` (red[600]) measures 2.18:1 here.
 *
 * `ahead` and `onPace` land back on exactly the `status-warning` / `status-success` values;
 * only `over` has to deviate from the semantic token.
 *
 * `PACING_TONE_MIN_CONTRAST` is asserted in `tempo-pacing.test.ts`, so a future ramp edit
 * cannot quietly regress this.
 */
export const PACING_TONE = {
  ahead: primitiveRamps.amber[300],
  onPace: primitiveRamps.green[300],
  over: primitiveRamps.red[300],
} as const

/** The floor every {@link PACING_TONE} must clear against any band background. */
export const PACING_TONE_MIN_CONTRAST = 4.5

// --- shared silver/red scheme (ROM chart + ghost-spark line) --------------------
// One source of truth for the two quality readouts: SILVER when the rep is right,
// SHADES OF RED when there's an issue. No greens, no ambers — those languages belong
// to the verdict tones / velocity-loss bands, not here.
/** On-track / at-or-above-working. */
export const SILVER = primitiveColors.neutral[300]
export const RED_LIGHT = primitiveRamps.red[400]
export const RED_MID = primitiveRamps.red[600]
export const RED_DEEP = primitiveRamps.red[800]

/** Below this grind signature the rep is "controlled" → silver; at/above it goes red. */
export const GRIND_THRESHOLD = 0.35
/** A quiet grey the controlled line dims toward as it drifts (never a colour): a dimmed
 *  cool grey in the SAME neutral family as SILVER, so a fully-drifted line reads dim-silver
 *  rather than sinking toward black. Shared with the ROM chart. */
export const DRIFT_GREY = primitiveColors.neutral[600]

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
 * The ghost-spark current-line tint from the two control-aware signals — silver/red.
 *
 * A CONTROLLED rep (`grindSignature < GRIND_THRESHOLD`) stays SILVER, dimming a touch
 * toward a quiet grey by `tempoDeviation` — a "drifting but not failing" cue that never
 * becomes a colour. A COLLAPSING rep (at/above the threshold) goes through SHADES OF RED
 * by severity: light → mid → deep as the collapse deepens.
 */
export function ghostLineColor(tempoDeviation: number | null, grindSignature: number): string {
  if (grindSignature >= GRIND_THRESHOLD) {
    const severity = clamp01((grindSignature - GRIND_THRESHOLD) / (1 - GRIND_THRESHOLD))
    return severity < 0.5
      ? mixHex(RED_LIGHT, RED_MID, severity * 2)
      : mixHex(RED_MID, RED_DEEP, (severity - 0.5) * 2)
  }
  return mixHex(SILVER, DRIFT_GREY, (tempoDeviation ?? 0) * 0.55)
}

/** Verdict state → the {@link LiveAuraFrame} coaching-flood category. */
export function auraForVerdict(
  state: FatigueVerdictState | null
): 'productive' | 'threshold' | 'stop' {
  if (state == null || state === 'good') return 'productive'
  if (state === 'form-breakdown') return 'stop'
  return 'threshold'
}
