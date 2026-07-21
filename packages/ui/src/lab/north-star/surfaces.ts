// Composition-level surface TREATMENTS for the north-star wall-dashboard specimen.
//
// Two treatments layered on top of the flat surface ramp (warm tapered) — used
// SPARINGLY, not everywhere (the "everything is a paper card" look is not the
// model): a matte PAPER sheet for hero surfaces, and a recessed INSET well for
// grouped/secondary data. Web-string `boxShadow` + `backgroundImage` render under
// RNW (Storybook) — lab-scoped only. See
// coordination/design-explorations/surface-system-north-star.md (§4, iteration 3).
import type { TextStyle, ViewStyle } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'

const c = getSemanticColors('dark')

/** sRGB perceived luminance (0 dark … 1 bright), Rec.601 weights. Accepts `#RGB` / `#RRGGBB`. */
function perceivedLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return 0.5
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Grain OPACITY for a base color, scaled by its perceived brightness: a fixed-opacity grain
 * reads too hot on a dark tone, so darker planes get a whisper and brighter planes keep full
 * texture. Anchored so a dark chip (lum ≈ 0.13) → ≈ 0.06 and a bright bar (lum ≈ 0.58) → ≈ 0.20,
 * clamped to a sane band. This is the ONE curve all grain goes through so it reads consistently.
 */
export function grainOpacityForTone(baseColor: string): number {
  return Math.min(0.24, Math.max(0.04, 0.02 + 0.31 * perceivedLuminance(baseColor)))
}

/**
 * The matte paper grain as a `backgroundImage` url — the SAME fractalNoise tile everywhere,
 * with its opacity scaled to `baseColor`'s brightness via {@link grainOpacityForTone}. Pair it
 * with `backgroundColor: baseColor`. Use this wherever grain is applied so a dark chip and a
 * bright bar carry proportional (not identical) texture.
 */
export function grainForTone(baseColor: string): string {
  const op = grainOpacityForTone(baseColor).toFixed(3)
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='120' height='120' filter='url(%23n)' opacity='${op}'/%3E%3C/svg%3E")`
  )
}

/**
 * A matte PAPER hero sheet: a near-neutral raised plane + brightness-scaled grain + a crisp
 * top rim-light + a defined contact shadow. Defaults to `surface-raised` so a
 * same-toned card laid inside reads as one continuous sheet.
 */
export function paperSheet(tone: string = c['surface-raised']): ViewStyle {
  return {
    backgroundColor: tone,
    backgroundImage: grainForTone(tone),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 22px rgba(0,0,0,0.50)',
  } as unknown as ViewStyle
}

/**
 * A recessed INSET well: a warm-frame tone pressed BELOW the surrounding plane,
 * cut in by an inner top shadow + a faint bottom rim. For grouped metrics and
 * empty/awaiting-data placeholders. Defaults to the inset-well token.
 */
export function insetWell(tone: string = c['surface-input']): ViewStyle {
  return {
    backgroundColor: tone,
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.04)',
  } as unknown as ViewStyle
}

/**
 * A POST-IT card: a matte tinted sheet with a crisp rim, a defined contact
 * shadow, and a deliberate CANT (`deg`) so it reads as a stuck note — used where
 * a small unit of data wants to feel pinned to the surface (alerts, next-set). A
 * degree or two, not a fraction, so the tilt is intentional rather than a bug.
 */
export function postIt(tone: string = c['surface-raised'], deg = -1.5): ViewStyle {
  return {
    backgroundColor: tone,
    backgroundImage: grainForTone(tone),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 14px rgba(0,0,0,0.45)',
    transform: [{ rotate: `${deg}deg` }],
  } as unknown as ViewStyle
}

/**
 * DEBOSSED (engraved) text: a 1px light highlight dropped just below the glyphs
 * so a label reads as pressed INTO the surface. Deliberate, for section eyebrows
 * on a matte plane — not body copy. Pair with a tertiary/dim text colour.
 */
export const debossLabel: TextStyle = {
  textShadowColor: 'rgba(255,255,255,0.11)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
}
