import { useSurface } from './SurfaceContext'
import type { ViewStyle } from 'react-native'
import { getPressedRecessShadow } from '../../../theme/elevation'
import { pressedLevel, surfaceBackground, type SurfaceLevel } from './SurfaceContext'
import type { ThemeMode } from '../../../theme/tokens/semantic'

/**
 * The well colour of a filled field on a plane. Dark steps one plane down. Light keeps the
 * plane's own colour: its planes repeat colours (background and raised are one grey, base and
 * overlay are white), so a step down by level gave two wells for one plane colour and a grey 400
 * well on the page background; the recess carries the inset instead.
 */
export function insetFieldFill(level: SurfaceLevel, mode: ThemeMode): string {
  return surfaceBackground(mode === 'light' ? level : pressedLevel(level), mode)
}

/**
 * Fill of a filled field: the well colour, cut in by the inset-well recess (the recess is web
 * only; native keeps the flat fill).
 */
export function insetFieldStyle(level: SurfaceLevel, mode: ThemeMode): ViewStyle {
  const backgroundColor = insetFieldFill(level, mode)
  return { backgroundColor, ...getPressedRecessShadow(backgroundColor, mode) }
}

/** `insetFieldStyle` for the enclosing surface, or undefined when the field is not filled. */
export function useInsetFieldStyle(isFilled: boolean): ViewStyle | undefined {
  const { level, mode } = useSurface()
  return isFilled ? insetFieldStyle(level, mode) : undefined
}
