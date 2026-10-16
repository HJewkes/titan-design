import { View, type ViewStyle } from 'react-native'
import { CheckMark } from '../../components/icons'
import { cn } from '../../utils/cn'
import type { CheckOption, ColorToken, Size, State } from './check-indicator-options'

const BOX: Record<Size, string> = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
/** Checkbox's chip sizes: 1px clear of the 2px border. */
const CHIP: Record<Size, string> = { sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' }
/** Radio's inner-dot sizes, squared. */
const SQUARE: Record<Size, string> = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' }
/** Checkbox's `iconPx`: the CheckMark size it draws at each box size. */
const MARK_PX: Record<Size, number> = { sm: 10, md: 12, lg: 14 }

const token = (name: ColorToken) => `var(--color-${name})`

function Indicator({ option, size }: { option: CheckOption; size: Size }) {
  const color = token(option.indicator)
  if (option.shape === 'chipMark') {
    return (
      <View
        className={cn('rounded-sm items-center justify-center', CHIP[size])}
        style={{ backgroundColor: color }}
      >
        <CheckMark
          size={MARK_PX[size]}
          strokeWidth={3}
          color={token(option.mark ?? 'text-brand')}
        />
      </View>
    )
  }
  if (option.shape === 'square') {
    return <View className={cn('rounded-sm', SQUARE[size])} style={{ backgroundColor: color }} />
  }
  return <CheckMark size={MARK_PX[size]} strokeWidth={3} color={color} />
}

function boxStyle(option: CheckOption, state: State): ViewStyle {
  if (state === 'unchecked') return { borderColor: token('border-input') }
  return {
    borderColor: token(option.edge),
    backgroundColor: option.isFilled ? token('brand-primary') : undefined,
  }
}

/** One box as the shipped Checkbox would paint it under `option`, in `state`, at `size`. */
export function CheckIndicatorBox(props: { option: CheckOption; size: Size; state: State }) {
  const { option, size, state } = props
  const isIndeterminate = state === 'indeterminate'
  const isMarked = state !== 'unchecked' && !isIndeterminate
  return (
    <View
      className={cn(
        'items-center justify-center rounded border-2',
        BOX[size],
        state === 'disabled' && 'opacity-50',
        state === 'focus' && 'focus-ring'
      )}
      style={boxStyle(option, state)}
    >
      {isMarked ? <Indicator option={option} size={size} /> : null}
      {isIndeterminate ? (
        <View
          className="h-0.5 w-2/3 rounded"
          style={{ backgroundColor: token(option.indicator) }}
        />
      ) : null}
    </View>
  )
}
