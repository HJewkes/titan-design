import type { ViewProps } from 'react-native'
import { resolveColor, type ColorToken } from '../../../theme/resolve-color'
import { semanticColorsDark } from '../../../theme/tokens/semantic'
import { CardStat } from '../card/CardStat'

export interface TileProps extends ViewProps {
  /** Uppercase micro-label shown above the value */
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
  /** Additional className. A `bg-<token>` class sets the tile's plane. */
  className?: string
}

const DEFAULT_PLANE: ColorToken = 'surface-raised'
const PLANE_TOKENS = new Set<string>(Object.keys(semanticColorsDark))

/**
 * Card writes its plane into `style`, which outranks a `bg-*` class, so the
 * caller's plane class is lifted out of `className` and handed over as `bgColor`.
 */
function splitPlane(className = '') {
  let plane = DEFAULT_PLANE
  const rest = className.split(/\s+/).filter((cls) => {
    const token = cls.startsWith('bg-') ? cls.slice(3) : ''
    if (!PLANE_TOKENS.has(token)) return true
    plane = token as ColorToken
    return false
  })
  return { bgColor: resolveColor(plane), className: ['flex-1', ...rest].join(' ').trim() }
}

/**
 * Tile — a compact label-over-value stat, now a wrapper over the `CardStat` preset.
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
  const textAlign = align === 'center' ? 'text-center' : 'text-left'
  return (
    <CardStat
      label={label}
      value={value}
      align={align}
      metricProps={{
        labelPosition: 'above',
        valueClassName: `font-mono text-sm ${textAlign}`,
        labelClassName: `text-[10px] font-bold ${textAlign}`,
        valueStyle: valueColor ? { color: valueColor } : undefined,
      }}
      {...splitPlane(className)}
      {...props}
    />
  )
}
