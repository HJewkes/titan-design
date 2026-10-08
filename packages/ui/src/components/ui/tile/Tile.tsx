import type { ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { CardStat } from '../card/CardStat'

export interface TileProps extends ViewProps {
  /** Uppercase micro-label shown with the value */
  label: string
  /** Primary value, rendered in a bold mono face */
  value: string
  /**
   * Tints the value (status/accent hex or CSS color); defaults to primary text.
   *
   * @deprecated Use `CardStat`'s `tone`, which colours the value from a semantic token.
   */
  valueColor?: string
  /** Content alignment within the tile (default: 'center') */
  align?: 'center' | 'start'
  /** Additional className */
  className?: string
}

/**
 * Tile — a compact label-and-value stat, now a wrapper over the `CardStat` preset.
 *
 * Fills its flex slot so a row of Tiles reads as an even HStack.
 *
 * @example
 * <Tile label="Volume" value="76%" />
 *
 * @deprecated Use `CardStat`, the `Card` stat preset (roadmap decision 1) — removed after
 * AW-127 consumer migration.
 */
export function Tile({
  label,
  value,
  valueColor,
  align = 'center',
  className,
  ...props
}: TileProps) {
  return (
    <CardStat
      label={label}
      value={value}
      align={align}
      valueClassName="font-mono text-sm"
      labelClassName="text-[10px] font-bold"
      valueStyle={valueColor ? { color: valueColor } : undefined}
      className={cn('flex-1', className)}
      {...props}
    />
  )
}
