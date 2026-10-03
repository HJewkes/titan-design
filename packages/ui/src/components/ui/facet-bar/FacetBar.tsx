import { useId } from 'react'
import { Text, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatCompact } from '../../../utils/number-format'
import { useControllableState } from '../../../hooks/useControllableState'
import { Chip, type ChipColor, type ChipSize } from '../chip'
import { Eyebrow } from '../eyebrow'
import {
  coerceToMode,
  selectedSet,
  toggleMultiple,
  toggleSingle,
  uniqueOptions,
} from './facet-bar-model'

export interface FacetOption<T extends string = string> {
  value: T
  label: string
  /** Items matching this value. Omitted when not known. */
  count?: number
  isDisabled?: boolean
}

interface FacetBarBaseProps<T extends string> extends ViewProps {
  /** Names the group. Visible unless `isLabelHidden`. */
  label: string
  isLabelHidden?: boolean
  options: ReadonlyArray<FacetOption<T>>
  size?: ChipSize
  /** Colour of a selected chip. */
  color?: ChipColor
  isDisabled?: boolean
  formatCount?: (count: number) => string
  className?: string
}

interface FacetBarMultipleProps<T extends string> extends FacetBarBaseProps<T> {
  selectionMode?: 'multiple'
  value?: ReadonlyArray<T>
  defaultValue?: ReadonlyArray<T>
  onValueChange?: (value: T[]) => void
}

interface FacetBarSingleProps<T extends string> extends FacetBarBaseProps<T> {
  selectionMode: 'single'
  value?: T | null
  defaultValue?: T | null
  onValueChange?: (value: T | null) => void
}

export type FacetBarProps<T extends string = string> =
  | FacetBarMultipleProps<T>
  | FacetBarSingleProps<T>

type FacetValue<T extends string> = ReadonlyArray<T> | T | null

function hasCount(count: number | undefined): count is number {
  return typeof count === 'number' && Number.isFinite(count)
}

function accessibleName(option: FacetOption): string {
  return hasCount(option.count) ? `${option.label}, ${option.count}` : option.label
}

/**
 * FacetBar — one labelled row of toggle chips for one facet. Each chip is one value, with an
 * optional count. The consumer filters its own list from the reported value.
 *
 * @example
 * <FacetBar label="Record" options={options} defaultValue={['notes']} />
 */
export function FacetBar<T extends string = string>(props: FacetBarProps<T>) {
  const {
    label,
    isLabelHidden = false,
    options,
    size = 'sm',
    color = 'primary',
    isDisabled = false,
    formatCount = formatCompact,
    selectionMode = 'multiple',
    value,
    defaultValue,
    onValueChange,
    className,
    ...viewProps
  } = props as FacetBarBaseProps<T> & {
    selectionMode?: 'single' | 'multiple'
    value?: FacetValue<T>
    defaultValue?: FacetValue<T>
    onValueChange?: (value: never) => void
  }
  const labelId = useId()
  const isSingle = selectionMode === 'single'
  const [current, setCurrent] = useControllableState<FacetValue<T>>({
    value,
    defaultValue: defaultValue ?? (isSingle ? null : []),
    onChange: onValueChange as ((next: FacetValue<T>) => void) | undefined,
  })
  const unique = uniqueOptions(options)
  if (unique.length === 0) return null

  const active = coerceToMode<T>(selectionMode, current)
  const selected = selectedSet<T>(selectionMode, active)
  const press = (pressed: T) =>
    setCurrent(
      isSingle
        ? toggleSingle(active as T | null, pressed)
        : toggleMultiple(
            active as T[],
            pressed,
            unique.map((option) => option.value)
          )
    )

  return (
    <View
      {...viewProps}
      role="group"
      aria-labelledby={isLabelHidden ? undefined : labelId}
      accessibilityLabel={isLabelHidden ? label : undefined}
      className={cn('flex-row flex-wrap items-center gap-2', className)}
    >
      {!isLabelHidden && (
        <View nativeID={labelId}>
          <Eyebrow>{label}</Eyebrow>
        </View>
      )}
      {unique.map((option) => (
        <Chip
          key={option.value}
          size={size}
          color={color}
          variant="outline"
          className="max-w-full"
          isSelected={selected.has(option.value)}
          isDisabled={isDisabled || option.isDisabled}
          onPress={() => press(option.value)}
          accessibilityLabel={accessibleName(option)}
          rightElement={
            hasCount(option.count) ? (
              <Text className="text-xs text-inherit opacity-70 tabular-nums">
                {formatCount(option.count)}
              </Text>
            ) : undefined
          }
        >
          {option.label}
        </Chip>
      ))}
    </View>
  )
}
