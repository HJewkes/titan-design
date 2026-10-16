import type { ComponentType } from 'react'
import { View, type ViewProps } from 'react-native'
import { resolveColor, type ColorToken } from '../../../theme/resolve-color'
import { cn } from '../../../utils/cn'
import {
  AlertTriangleIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  OctagonXIcon,
  type IconProps,
} from '../../icons'

/** The condition a StatusGlyph shows; each tone has its own shape. */
export type StatusGlyphTone = 'success' | 'warning' | 'error' | 'neutral'

/** Glyph edge: 16px (`sm`), 20px (`md`), 24px (`lg`) or 40px (`xl`, beside an `h2` word). */
export type StatusGlyphSize = 'sm' | 'md' | 'lg' | 'xl'

/** Props for {@link StatusGlyph}. */
export interface StatusGlyphProps extends Omit<ViewProps, 'children'> {
  /** The condition shown. Each tone has its own shape, so the glyph never relies on colour alone. */
  tone: StatusGlyphTone
  /** The status word, spoken as the glyph's accessible name. */
  label: string
  /** Defaults to `md`. */
  size?: StatusGlyphSize
  /** Tailwind overrides for the wrapper, merged with `cn()`. */
  className?: string
}

/**
 * Each tone's fill. Exported so a mark drawn beside the glyph (a ring, an outline) takes the
 * same colour. A glyph is a non-text mark, so its fill needs 3:1, not 4.5:1. That is what lets
 * dark `status-error` (3.45:1 on surface-raised) carry the error shape.
 */
export const STATUS_GLYPH_FILL: Record<StatusGlyphTone, ColorToken> = {
  success: 'status-success',
  warning: 'status-warning',
  error: 'status-error',
  neutral: 'text-secondary',
}

const STATUS_GLYPH_ICON: Record<StatusGlyphTone, ComponentType<IconProps>> = {
  success: CircleCheckIcon,
  warning: AlertTriangleIcon,
  error: OctagonXIcon,
  neutral: CircleDashedIcon,
}

// `xl` fills about the cap height of a 48px `h2` word, so a word-led verdict at wall scale
// reads glyph and word as one unit.
const ICON_SIZE: Record<StatusGlyphSize, number> = { sm: 16, md: 20, lg: 24, xl: 40 }

/**
 * One status condition as a shaped, coloured mark: circle-check, alert-triangle, octagon-x or a
 * dashed ring. The collapsed form of a status word (design floor F1/F2): it carries the word as
 * its accessible name, and a consumer that hides the word wraps it in a Tooltip with that word.
 */
export function StatusGlyph({ tone, label, size = 'md', className, ...props }: StatusGlyphProps) {
  const Icon = STATUS_GLYPH_ICON[tone]

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      className={cn('items-center justify-center', className)}
      {...props}
    >
      <Icon size={ICON_SIZE[size]} color={resolveColor(STATUS_GLYPH_FILL[tone])} />
    </View>
  )
}
