import type { ViewStyle } from 'react-native'
import { getPressedRecessShadow } from '../../../theme/elevation'
import { pressedLevel, surfaceBackground, type SurfaceLevel } from './SurfaceContext'
import type { ThemeMode } from '../../../theme/tokens/semantic'

/**
 * Fill of a filled field: the plane one down from the enclosing one, cut in by the inset-well
 * recess (the recess is web only; native keeps the flat fill).
 */
export function insetFieldStyle(level: SurfaceLevel, mode: ThemeMode): ViewStyle {
  const backgroundColor = surfaceBackground(pressedLevel(level), mode)
  return { backgroundColor, ...getPressedRecessShadow(backgroundColor, mode) }
}
