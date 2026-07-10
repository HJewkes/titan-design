import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface TileProps extends ViewProps {
  /** Uppercase micro-label shown above the value */
  label: string
  /** Primary value, rendered in a bold mono face */
  value: string
  /** Tints the value (status/accent hex or CSS color); defaults to primary text */
  valueColor?: string
  /** Content alignment within the tile (default: 'center') */
  align?: 'center' | 'start'
  /** Additional className */
  className?: string
}

/**
 * Tile — a compact label-over-value stat card.
 *
 * A rounded raised box with an uppercase micro-label stacked over a bold mono
 * value. Fills its flex slot so a row of Tiles reads as an even HStack.
 *
 * @example
 * <Tile label="Volume" value="76%" />
 * <Tile label="Fatigue" value="MOD" valueColor="#F5A623" />
 */
export function Tile({
  label,
  value,
  valueColor,
  align = 'center',
  className,
  ...props
}: TileProps) {
  const isCenter = align === 'center'
  return (
    <View
      className={cn(
        'flex-1 rounded-md bg-surface-raised px-1.5 py-2',
        isCenter ? 'items-center' : 'items-start',
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          'text-[10px] font-bold uppercase tracking-wider text-text-tertiary',
          isCenter ? 'text-center' : 'text-left'
        )}
      >
        {label}
      </Text>
      <Text
        className={cn(
          'mt-0.5 font-mono text-sm font-bold text-text-primary',
          isCenter ? 'text-center' : 'text-left'
        )}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>
    </View>
  )
}
