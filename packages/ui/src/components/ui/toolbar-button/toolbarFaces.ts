import { useMemo } from 'react'
import { Platform, StyleSheet, type ViewStyle } from 'react-native'
import { getHoverColors } from '../../../theme'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { resolveSurfaceDepth, useSurface, type ResolvedSurface } from '../surface'

export type ToolbarFaceVariant = 'default' | 'raised'

export interface ToolbarFaces {
  mode: ThemeMode
  /** One plane up from the enclosing Surface, wearing the lift. */
  raised: ResolvedSurface
  /** One plane down from the enclosing Surface, wearing the recess. */
  pressed: ResolvedSurface
}

/**
 * The two faces on the depth model, read off the enclosing Surface the same way
 * `<Surface raise>` and `<Surface pressed>` are: the raised face is the plane one
 * step above the toolbar with the lift, the active face is the plane one step
 * below it with the recess. No bespoke face colour; both are ramp planes.
 */
export function useToolbarFaces(): ToolbarFaces {
  const inherited = useSurface()
  return useMemo(
    () => ({
      mode: inherited.mode,
      raised: resolveSurfaceDepth(inherited, { raise: 1 }),
      pressed: resolveSurfaceDepth(inherited, { pressed: true }),
    }),
    [inherited]
  )
}

// The raised variant wears the plane's treatment; the default variant is the same
// planes flat. Hover nudges the fill the way the plane moves: up lightens, down darkens.
export function faceStyle(p: {
  faces: ToolbarFaces
  variant: ToolbarFaceVariant
  isDisabled: boolean
  showActive: boolean
  isHovered: boolean
}): ViewStyle {
  if (p.isDisabled) return disabledStyles[p.faces.mode]
  const face = p.showActive ? p.faces.pressed : p.faces.raised
  const hover = getHoverColors(face.backgroundColor, 'medium')
  const hoverFill = p.showActive ? hover.pressed : hover.raised
  return {
    backgroundColor: p.isHovered ? hoverFill : face.backgroundColor,
    ...(p.variant === 'raised' ? face.depthStyle : {}),
  }
}

// Disabled - flat face per theme, no lift or recess
function disabledFace(mode: ThemeMode): ViewStyle {
  return {
    backgroundColor: getSemanticColors(mode)['control-face-disabled'],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  }
}

const disabledStyles = StyleSheet.create({
  dark: disabledFace('dark'),
  light: disabledFace('light'),
})
