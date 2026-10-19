import type { ViewProps } from 'react-native'
import type { ChipColor, ChipSize } from '../chip'

/** One choice in a {@link ChipGroup}. */
export interface ChipGroupItem<T extends string = string> {
  /** The value reported through `onValueChange`. */
  value: T
  /** Text shown on the chip. */
  label: string
  /** Items matching this choice. Omitted when not known. */
  count?: number
  /** Disables this chip only. */
  isDisabled?: boolean
}

/** How a {@link ChipGroup} handles more chips than fit on one row. */
export type ChipGroupOverflow = 'wrap' | 'scroll'

/** Props of {@link ChipGroup}. */
export interface ChipGroupProps<T extends string = string> extends ViewProps {
  /** Accessible name of the group. Not drawn: the row sits under a heading or in a bar. */
  label: string
  /** The choices, in order. The first is the one `overflow="scroll"` pins. */
  items: ReadonlyArray<ChipGroupItem<T>>
  /** Controlled selected value. */
  value?: T
  /** Uncontrolled starting value. Defaults to the first item, so one chip is always selected. */
  defaultValue?: T
  /** Called with the newly selected value; never called for the chip already selected. */
  onValueChange?: (value: T) => void
  /** `wrap` flows onto more rows; `scroll` keeps one row, pins the first item and scrolls the rest. */
  overflow?: ChipGroupOverflow
  /** Chip size. */
  size?: ChipSize
  /** Colour of the selected chip. */
  color?: ChipColor
  /** Disables every chip. */
  isDisabled?: boolean
  /** Placeholder capsules while the choices load. */
  isLoading?: boolean
  /** Formats a count for display. Defaults to compact (`128.4k`); the accessible name keeps the exact count. */
  formatCount?: (count: number) => string
  /** Additional className on the group. */
  className?: string
}
