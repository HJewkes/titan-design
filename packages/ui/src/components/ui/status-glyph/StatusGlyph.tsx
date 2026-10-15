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

/** Glyph edge: 16px (`sm`), 20px (`md`) or 24px (`lg`). */
export type StatusGlyphSize = 'sm' | 'md' | 'lg'

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

interface ToneLook {
  Icon: ComponentType<IconProps>
  fill: ColorToken
}

// A glyph is a non-text mark, so its fill needs 3:1, not 4.5:1. That is what lets dark
// `status-error` (3.45:1 on surface-raised) carry the error shape.
const STATUS_GLYPH_TONES: Record<StatusGlyphTone, ToneLook> = {
  success: { Icon: CircleCheckIcon, fill: 'status-success' },
  warning: { Icon: AlertTriangleIcon, fill: 'status-warning' },
  error: { Icon: OctagonXIcon, fill: 'status-error' },
  neutral: { Icon: CircleDashedIcon, fill: 'text-secondary' },
}

const ICON_SIZE: Record<StatusGlyphSize, number> = { sm: 16, md: 20, lg: 24 }

/**
 * One status condition as a shaped, coloured mark: circle-check, alert-triangle, octagon-x or a
 * dashed ring. The collapsed form of a status word (design floor F1/F2): it carries the word as
 * its accessible name, and a consumer that hides the word wraps it in a Tooltip with that word.
 */
export function StatusGlyph({ tone, label, size = 'md', className, ...props }: StatusGlyphProps) {
  const { Icon, fill } = STATUS_GLYPH_TONES[tone]

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      className={cn('items-center justify-center', className)}
      {...props}
    >
      <Icon size={ICON_SIZE[size]} color={resolveColor(fill)} />
    </View>
  )
}
