import React from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatGrouped } from '../../../utils/number-format'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { Typography } from '../typography'
import {
  reelCells,
  valueAt,
  type AnimatedNumberFormat,
  type ReelCell,
} from './animated-number-model'

/** `count` rewrites the text; `reel` rolls one clipped column per digit. */
export type AnimatedNumberMode = 'count' | 'reel'
/** The type ramp step: `sm` is 20 px, `md` 30 px, `lg` 48 px. */
export type AnimatedNumberSize = 'sm' | 'md' | 'lg'

/** Props for {@link AnimatedNumber}. */
export interface AnimatedNumberProps {
  /** The value the number lands on. */
  value: number
  /** Where the number starts at progress 0. Default 0. */
  from?: number
  /** 0..1, driven by the caller's clock. At 1 the text is exactly `format(value)`. */
  progress: number
  /** `count` rewrites the text; `reel` rolls one clipped column per digit. Default `count`. */
  mode?: AnimatedNumberMode
  /** Overrides the default grouped format; `decimals` is then ignored. */
  format?: AnimatedNumberFormat
  /** Fraction digits for the default format. Default 0. */
  decimals?: number
  /** Default `md`. */
  size?: AnimatedNumberSize
  /** Tailwind overrides for the root, merged with `cn()`. */
  className?: string
}

// Each row is one line box, so a reel column can clip to exactly one digit.
const sizeStyles: Record<AnimatedNumberSize, { text: string; line: number }> = {
  sm: { text: 'text-xl leading-7', line: 28 },
  md: { text: 'text-3xl leading-10', line: 40 },
  lg: { text: 'text-5xl leading-[56px]', line: 56 },
}

const TABULAR = { fontVariant: ['tabular-nums' as const] }

function Glyph({ size, children }: { size: AnimatedNumberSize; children: React.ReactNode }) {
  return (
    <Typography
      variant="body1"
      className={cn('font-heading font-bold tabular-nums', sizeStyles[size].text)}
      style={TABULAR}
    >
      {children}
    </Typography>
  )
}

function ReelColumn({ cell, size }: { cell: ReelCell; size: AnimatedNumberSize }) {
  if (cell.kind === 'glyph') return <Glyph size={size}>{cell.glyph}</Glyph>
  const { line } = sizeStyles[size]
  return (
    <View testID="animated-number-column" className="overflow-hidden" style={{ height: line }}>
      <View style={{ transform: [{ translateY: -cell.offset * line }] }}>
        <Glyph size={size}>{cell.digit}</Glyph>
        {cell.offset > 0 && <Glyph size={size}>{cell.next}</Glyph>}
      </View>
    </View>
  )
}

/**
 * A number that counts or rolls from `from` to `value` as `progress` goes 0 → 1. Time is a prop:
 * the caller owns the clock. Assistive tech always hears the final value.
 *
 * @example
 * <AnimatedNumber value={1234.5} decimals={1} progress={beat} mode="reel" />
 */
export function AnimatedNumber({
  value,
  from = 0,
  progress,
  mode = 'count',
  format,
  decimals = 0,
  size = 'md',
  className,
}: AnimatedNumberProps) {
  const reducedMotion = usePrefersReducedMotion()
  const formatNumber = format ?? ((n: number) => formatGrouped(n, decimals))
  const finalText = formatNumber(value)
  const settled = reducedMotion || progress >= 1
  const current = valueAt(settled ? 1 : progress, from, value)

  return (
    <View
      // RNW drops a label on a role-less View (and on `text`); `image` keeps the name on the root.
      accessibilityRole="image"
      accessibilityLabel={finalText}
      className={cn('flex-row self-start', className)}
    >
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="animated-number-visual"
        className="flex-row"
      >
        {mode === 'count' ? (
          <Glyph size={size}>{settled ? finalText : formatNumber(current)}</Glyph>
        ) : (
          reelCells(finalText, current, settled).map((cell) => (
            <ReelColumn key={cell.key} cell={cell} size={size} />
          ))
        )}
      </View>
    </View>
  )
}
