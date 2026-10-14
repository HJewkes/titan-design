import { space } from '../../../theme/tokens/semantic'

/** The `lg` rung's label size; the squish ramp's `lg` padding was measured against it. */
const PILL_LG_FONT_PX = 14

export interface PillScale {
  fontSize: number
  paddingHorizontal: number
  paddingVertical: number
  /** Between the pill's own slots (Pill's `gap-1`). */
  gap: number
  /** Between a pill and the text set beside it. */
  besideGap: number
}

/**
 * A pill's box at an arbitrary font size, for video frames where the size is
 * `40 × frameHeight / 1080` and no Tailwind rung exists. Every length keeps the
 * `lg` rung's ratio to its 14 px label, so a scaled pill reads as the same pill.
 */
export function pillScale(fontPx: number): PillScale {
  const k = fontPx / PILL_LG_FONT_PX
  return {
    fontSize: fontPx,
    paddingHorizontal: space.squish.x.lg * k,
    paddingVertical: space.squish.y.lg * k,
    gap: space.inline.sm * k,
    besideGap: space.inline.md * k,
  }
}
