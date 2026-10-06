import { useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import {
  useListNavigation,
  type ListNavigation,
  type ListNavigationItemProps,
} from '../../../../hooks/useListNavigation'
import { Tooltip, useHoverFocusState } from '../../tooltip'
import { Typography } from '../../typography'
import type { BarListTipContent } from './bar-list-model'
import { hiddenFromAssistiveTech, LISTITEM_ROLE, TABULAR } from './shared'

/**
 * The roving tab stop over the data rows: one stop for the list, Up, Down, Home and End move it,
 * and the row it rests on takes focus. Null when the rows carry no tip, so the list stays static.
 */
export function useRowTips(count: number, isOn: boolean): ListNavigation | null {
  const [active, setActive] = useState(0)
  const navigation = useListNavigation({
    count,
    // A list that loses rows under a live cap must still leave one tab stop.
    activeIndex: Math.min(active, Math.max(0, count - 1)),
    onActiveIndexChange: setActive,
    focusMode: 'roving',
    loop: false,
  })
  return isOn ? navigation : null
}

/**
 * The tip's body. Everything in it is already in the row's accessible name, so the subtree is
 * hidden from assistive tech: no `role="tooltip"`, and the row carries no `aria-describedby`.
 */
function TipBody({ tip }: { tip: BarListTipContent }) {
  return (
    <View className="gap-stack-sm min-w-32" testID="bar-list-tip" {...hiddenFromAssistiveTech}>
      <View className="flex-row items-baseline justify-between gap-inline-lg">
        <Typography variant="caption" color="primary" className="leading-normal">
          {tip.label}
        </Typography>
        <Typography variant="mono" color="primary" style={TABULAR}>
          {tip.valueText}
        </Typography>
      </View>
      {tip.limit ? (
        <View className="flex-row items-baseline justify-between gap-inline-lg">
          <Typography variant="caption" color="secondary" className="leading-normal">
            {tip.limit.label}
          </Typography>
          <Typography variant="mono" color="primary" style={TABULAR}>
            {tip.limit.valueText}
          </Typography>
        </View>
      ) : null}
      {tip.flagLabel ? (
        <Typography variant="caption" color="inherit" className="text-text-error leading-normal">
          {tip.flagLabel}
        </Typography>
      ) : null}
    </View>
  )
}

interface TipRowProps {
  name: string
  tip: BarListTipContent
  item: ListNavigationItemProps
  children: ReactNode
}

/**
 * A data row with a tip: hover, keyboard focus or a long press opens it, and blur, hover out or
 * Escape closes it. The row stays a named list item; the tip adds no button and no second read.
 */
export function TipRow({ name, tip, item, children }: TipRowProps) {
  const { isOpen, triggerProps } = useHoverFocusState()
  return (
    <Tooltip isOpen={isOpen} usePortal placement="top" content={<TipBody tip={tip} />}>
      <Pressable
        role={LISTITEM_ROLE}
        accessibilityLabel={name}
        className="web:cursor-default"
        testID="bar-list-row"
        {...item}
        {...triggerProps}
      >
        {children}
      </Pressable>
    </Tooltip>
  )
}
