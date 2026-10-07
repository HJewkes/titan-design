import BodyHighlighter from 'react-native-body-highlighter'

import { primitiveColors } from '../../../theme/tokens/primitives'
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
