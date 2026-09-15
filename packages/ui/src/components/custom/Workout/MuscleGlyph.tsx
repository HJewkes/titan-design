// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import BodyHighlighter, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { View, type ViewProps } from 'react-native'

import { useSurfaceMode } from '../../ui/surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { MUSCLE_DISPLAY_NAMES, MUSCLE_TO_SVG_SLUGS, type MuscleGroup } from './muscleTaxonomy'

/**
 * A card-scale figure with one muscle group lit.
 *
 * The library had no mini muscle svg before this (VW-386 survey): `BodyMap`
 * wraps the same `react-native-body-highlighter` figure at 160x320 and 480x960
 * and always renders its legend and front/back toggle beside it, and the icon
 * set's only body glyph is a four-stroke lucide figure with no muscle regions.
 *
 * This is the SAME artwork and the SAME slug mapping at a card scale — it draws
 * no new body. `BodyMap` can compose it later; the figure has exactly one
 * source either way.
 *
 * **Colour is the caller's.** `BodyMap` fills by `getHeatmapColor(volumeStatus)`,
 * which is the volume-landmark measurement (sets against MAV). Other surfaces
 * light the same muscle for other reasons — `GoalMuscleCard` uses goal status —
 * so the fill is a prop and the two vocabularies never share a default.
 *
 * @example
 * <MuscleGlyph muscle={MuscleGroup.CHEST} side="front" litColor={statusColor} />
 */
export interface MuscleGlyphProps extends Omit<ViewProps, 'children'> {
  muscle: MuscleGroup
  /**
   * Which face of the figure shows this muscle. Front and back are separate
   * drawings, so a back muscle lit on the front view renders nothing.
   */
  side: 'front' | 'back'
  /** A resolved colour. The caller owns what "lit" means here. */
  litColor: string
  /** Multiplier on the 200x400 intrinsic svg. Defaults to ~44x88. */
  scale?: number
  className?: string
}

/** Same CJS interop `BodyMap` uses — the package ships a default export. */
const Body = ((BodyHighlighter as unknown as { default?: typeof BodyHighlighter }).default ??
  BodyHighlighter) as typeof BodyHighlighter

/**
 * 0.22 of the 200x400 intrinsic svg, so ~44x88. 0.17 was the first try and the
 * lit muscle was too small to identify on the render — the figure read as
 * decoration rather than as information.
 */
const GLYPH_SCALE = 0.22

/** Matches `BodyMap`'s unlit treatment so the two read as one family. */
const UNLIT_FILL_DARK = alpha(primitiveColors.white, 0.08)
const UNLIT_BORDER = alpha(primitiveColors.white, 0.12)

export function MuscleGlyph({
  muscle,
  side,
  litColor,
  scale = GLYPH_SCALE,
  className,
  ...props
}: MuscleGlyphProps) {
  const mode = useSurfaceMode()
  const parts: ExtendedBodyPart[] = (MUSCLE_TO_SVG_SLUGS[muscle] ?? []).map((slug) => ({
    slug: slug as Slug,
    color: litColor,
  }))

  return (
    <View
      className={className}
      // The svg carries no text, so the name has to live on a roled wrapper —
      // RNW drops `aria-label` on a role-less View (gotcha #3).
      accessibilityRole="image"
      accessibilityLabel={`${MUSCLE_DISPLAY_NAMES[muscle]} highlighted on the body map`}
      testID="muscle-glyph"
      {...props}
    >
      {/* `react-native-body-highlighter` puts `aria-label` on bare <path>
          elements, which axe flags as `aria-prohibited-attr`. The drawing is
          decorative — the wrapper above carries the name — so the whole subtree
          is hidden from AT, the same treatment `BodyMap` gives its own svg. */}
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Body
          side={side}
          data={parts}
          scale={scale}
          gender="male"
          defaultFill={
            mode === 'dark' ? UNLIT_FILL_DARK : alpha(getSemanticColors(mode)['text-primary'], 0.08)
          }
          border={UNLIT_BORDER}
        />
      </View>
    </View>
  )
}
