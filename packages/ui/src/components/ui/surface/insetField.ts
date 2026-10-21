import { useSurface } from './SurfaceContext'
import type { ViewStyle } from 'react-native'
import { getPressedRecessShadow } from '../../../theme/elevation'
import { pressedLevel, surfaceBackground, type SurfaceLevel } from './SurfaceContext'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import { cn } from '../../../utils/cn'

/**
 * The well colour of a filled field on a plane. Dark steps one plane down. Light keeps the
 * plane's own colour: raised and overlay are both white, so a step down by level gave two wells
 * for one plane colour and a grey 300 frame well on the page background; the recess carries the
 * inset instead.
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

/** `insetFieldStyle` for the enclosing surface, or undefined when the field shows no well. */
export function useInsetFieldStyle(showsWell: boolean): ViewStyle | undefined {
  const { level, mode } = useSurface()
  return showsWell ? insetFieldStyle(level, mode) : undefined
}

export interface FieldState {
  /** Focused, or (for a Select) open. */
  isFocused: boolean
  isInvalid: boolean
  isDisabled: boolean
}

/** The disabled look every form field shares, whatever its variant. */
export const FIELD_DISABLED_CLASS = 'opacity-40 cursor-not-allowed'

/**
 * Edge classes of a field sitting in the inset well, shared by Input, TextArea and Select so the
 * three read as one family. At rest the recess is the edge, so the border is transparent. Focus
 * drops the well (the caller passes `useInsetFieldStyle(false)`) so the focus border and ring
 * read alone; error keeps the well.
 */
export function insetFieldClassName({ isFocused, isInvalid, isDisabled }: FieldState): string {
  return cn(
    'border border-transparent rounded-md',
    !isDisabled && !isInvalid && 'web:hover:border-border-input-hover',
    isFocused && 'border-border-input-focus bg-transparent focus-ring',
    isInvalid && 'border-border-input-error',
    isDisabled && FIELD_DISABLED_CLASS
  )
}
