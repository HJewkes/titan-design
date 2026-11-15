import { Platform } from 'react-native'
import { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { MUSCLE_TO_SVG_SLUGS, SLUG_TO_PRIMARY_MUSCLE, type MuscleGroup } from './muscleTaxonomy'

interface PressableMuscle {
  muscleGroup: MuscleGroup
}

/**
 * How taps on the figure reach `onMusclePress`. On web the figure's per-path onPress would
 * leak responder props into the DOM, so taps arrive as a click on the wrapper and the muscle
 * slug is read from the clicked path's id; elsewhere the library's `onBodyPartPress` is used.
 */
export function figurePress(
  data: PressableMuscle[],
  onMusclePress?: (muscleGroup: MuscleGroup) => void
) {
  const pressPart = (part: ExtendedBodyPart) => {
    if (!onMusclePress || !part.slug) return
    const fromData = data.find((d) =>
      (MUSCLE_TO_SVG_SLUGS[d.muscleGroup] ?? []).includes(part.slug as string)
    )
    const muscle = fromData?.muscleGroup ?? SLUG_TO_PRIMARY_MUSCLE[part.slug]
    if (muscle) onMusclePress(muscle)
  }
  const isWeb = Platform.OS === 'web'
  const onClick = (event: { target: unknown }) => {
    const slug = (event.target as { id?: string } | null)?.id
    if (slug) pressPart({ slug: slug as Slug })
  }
  return {
    isWeb,
    wrapperProps: isWeb ? { onClick } : {},
    onBodyPartPress: isWeb ? undefined : pressPart,
  }
}
