import { primitiveZIndex } from '../theme/tokens/primitives'

/**
 * react-native-web mounts every open `Modal` (and so titan's Modal and Drawer) on
 * `document.body` in a fixed container at this z-index (`ModalAnimation.js`). No prop moves it.
 */
export const WEB_MODAL_LAYER_Z_INDEX = 9999

type BodyOverlayStep = 'toast' | 'tooltip'

/**
 * z-index for an overlay that stacks beside react-native-web's modal layer rather than inside
 * it. Offsetting the named step keeps the scale's order while staying above an open modal.
 */
export function bodyOverlayZIndex(step: BodyOverlayStep): number {
  return WEB_MODAL_LAYER_Z_INDEX + primitiveZIndex[step]
}
