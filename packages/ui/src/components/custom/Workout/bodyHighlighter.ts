import BodyHighlighter from 'react-native-body-highlighter'

import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

/**
 * react-native-body-highlighter is published as a CommonJS default export; the
 * interop keeps it working whether the bundler unwraps the default or not.
 */
export const Body = ((BodyHighlighter as unknown as { default?: typeof BodyHighlighter }).default ??
  BodyHighlighter) as typeof BodyHighlighter

/** Dark-mode fill of an unlit muscle, shared so `BodyMap` and `MuscleGlyph` read as one family. */
export const UNLIT_FILL_DARK = alpha(primitiveColors.white, 0.08)
/** Outline of every muscle region on the figure. */
export const UNLIT_BORDER = alpha(primitiveColors.white, 0.12)

/** `Body` fill and outline props for unlit muscle regions on a figure painted in `mode`. */
export function unlitBodyProps(mode: ThemeMode) {
  const sem = getSemanticColors(mode)
  return {
    defaultFill: mode === 'dark' ? UNLIT_FILL_DARK : alpha(sem['text-primary'], 0.08),
    border: alpha(sem['hairline-subtle'], 0.12),
  }
}
