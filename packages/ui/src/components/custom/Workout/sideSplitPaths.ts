/**
 * Anatomical left/right body paths per muscle group, for a figure that paints each side of one
 * muscle on its own (VW-343). The library's `left` and `right` arrays are screen-left and
 * screen-right on both views. The front figure faces the viewer, so the lifter's left is the
 * library's `right` array on the front view and its `left` array on the back view.
 *
 * Only the asset data files are imported: the package entry ships untranspiled JSX.
 */
import type { BodyPart } from 'react-native-body-highlighter'
import { bodyFront } from 'react-native-body-highlighter/dist/assets/bodyFront.js'
import { bodyBack } from 'react-native-body-highlighter/dist/assets/bodyBack.js'
import { MUSCLE_TO_SVG_SLUGS, type MuscleGroup } from './muscleTaxonomy'

export type BodyView = 'front' | 'back'

/** SVG path strings for the lifter's own left and right side. */
export interface SidePaths {
  left: string[]
  right: string[]
}

export const BODY_PARTS_BY_VIEW: Record<BodyView, readonly BodyPart[]> = {
  front: bodyFront,
  back: bodyBack,
}

export function anatomicalSides(part: BodyPart, view: BodyView): SidePaths {
  const screenLeft = part.path?.left ?? []
  const screenRight = part.path?.right ?? []
  return view === 'front'
    ? { left: screenRight, right: screenLeft }
    : { left: screenLeft, right: screenRight }
}

/** Empty arrays when the muscle has no slug on that view (chest on the back, say). */
export function sidePathsFor(muscle: MuscleGroup, view: BodyView): SidePaths {
  const slugs = MUSCLE_TO_SVG_SLUGS[muscle]
  const sides = BODY_PARTS_BY_VIEW[view]
    .filter((part) => part.slug !== undefined && slugs.includes(part.slug))
    .map((part) => anatomicalSides(part, view))
  return { left: sides.flatMap((s) => s.left), right: sides.flatMap((s) => s.right) }
}
