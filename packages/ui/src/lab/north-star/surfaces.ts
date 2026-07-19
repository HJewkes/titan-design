// Composition-level surface TREATMENTS for the north-star wall-dashboard specimen.
//
// Two treatments layered on top of the flat surface ramp (warm tapered) — used
// SPARINGLY, not everywhere (the "everything is a paper card" look is not the
// model): a matte PAPER sheet for hero surfaces, and a recessed INSET well for
// grouped/secondary data. Web-string `boxShadow` + `backgroundImage` render under
// RNW (Storybook) — lab-scoped only. See
// coordination/design-explorations/surface-system-north-star.md (§4, iteration 3).
import type { ViewStyle } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'

const c = getSemanticColors('dark')

/** One shared static grain tile (paint-once, ~0.04α) — the matte paper texture. */
const GRAIN =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
  `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
  `%3Crect width='120' height='120' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

/**
 * A matte PAPER hero sheet: a near-neutral raised plane + faint grain + a crisp
 * top rim-light + a defined contact shadow. Defaults to `surface-raised` so a
 * same-toned card laid inside reads as one continuous sheet.
 */
export function paperSheet(tone: string = c['surface-raised']): ViewStyle {
  return {
    backgroundColor: tone,
    backgroundImage: GRAIN,
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
