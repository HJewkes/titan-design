/**
 * Lab/Goals — a card-scale figure with one muscle group lit.
 *
 * SURVEY FINDING (round three): the library has NO mini muscle svg. The only
 * body artwork is `react-native-body-highlighter`, which `BodyMap` wraps at
 * `scale` 0.8 (phone, 160x320) and 2.4 (wall, 480x960) — both far too large for
 * a card, and `BodyMap` always renders its legend and view toggle alongside.
 * The icon set's one body glyph is `PersonStandingIcon`, a generic four-stroke
 * lucide figure with no muscle regions at all.
 *
 * So this reuses the SAME svg family and the SAME taxonomy mapping
 * (`MUSCLE_TO_SVG_SLUGS`) at a much smaller scale rather than drawing a new
 * body. Nothing here is new artwork.
 *
 * HARDEN-STEP PROMOTION if the human keeps R1 or R4: this is a `MuscleGlyph`
 * primitive, or a `size="glyph"` on `BodyMap` that suppresses the legend. Two
 * consumers — the goals rollup card and `MuscleGroupChip`, which today labels a
 * muscle with text alone.
 *
 * COLOUR IS GOAL STATUS, NOT VOLUME STATUS. `BodyMap` fills by
 * `getHeatmapColor(volumeStatus)`, which is the volume-landmark measurement
 * (sets against MAV). A goals rollup has no landmark data, so the fill here
 * comes from the goal status vocabulary and the two must not be conflated.
 */
import BodyHighlighter, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { View } from 'react-native'

import { useSurfaceMode } from '../../components/ui/surface'
import {
  MUSCLE_TO_SVG_SLUGS,
  MUSCLE_DISPLAY_NAMES,
} from '../../components/custom/Workout/muscleTaxonomy'
import type { MuscleGroup } from '../../components/custom/Workout/muscleTaxonomy'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'

/** Same CJS interop `BodyMap` uses — the package ships a default export. */
const Body = ((BodyHighlighter as unknown as { default?: typeof BodyHighlighter }).default ??
  BodyHighlighter) as typeof BodyHighlighter

/**
 * The svg is 200x400 intrinsic, so this renders ~44x88. 0.17 (~34x68) was the
 * first try and the lit muscle was too small to identify on the render — the
 * figure read as decoration rather than as information.
 */
const GLYPH_SCALE = 0.22

/** Matches `BodyMap`'s unlit treatment so the two read as one family. */
const UNLIT_FILL = alpha(primitiveColors.white, 0.08)
const UNLIT_BORDER = alpha(primitiveColors.white, 0.12)

export interface MuscleGlyphProps {
  muscle: MuscleGroup
  side: 'front' | 'back'
  /** A resolved colour — the caller maps goal status to it. */
  litColor: string
  scale?: number
}

export function MuscleGlyph({ muscle, side, litColor, scale = GLYPH_SCALE }: MuscleGlyphProps) {
  const mode = useSurfaceMode()
  const parts: ExtendedBodyPart[] = (MUSCLE_TO_SVG_SLUGS[muscle] ?? []).map((slug) => ({
    slug: slug as Slug,
    color: litColor,
  }))

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${MUSCLE_DISPLAY_NAMES[muscle]} highlighted on the body map`}
      testID="muscle-glyph"
    >
      <Body
        side={side}
        data={parts}
        scale={scale}
        gender="male"
        defaultFill={
          mode === 'dark' ? UNLIT_FILL : alpha(getSemanticColors(mode)['text-primary'], 0.08)
        }
        border={UNLIT_BORDER}
      />
    </View>
  )
}
