import type { ReactNode } from 'react'
import { View, Pressable } from 'react-native'
import { WeekRow, type WeekRowProps } from './WeekRow'
import {
  MESO_ACCENT_GRADIENT_DARK,
  MESO_ACCENT_GRADIENT_LIGHT,
} from '../../../theme/extracted-colors-dataviz'

const BRAND_PRIMARY_DARK = MESO_ACCENT_GRADIENT_DARK
const BRAND_PRIMARY_LIGHT = MESO_ACCENT_GRADIENT_LIGHT

/** Gradient stops for the 3px top accent: dark -> primary -> light. */
function accentStops(brandPrimary: string): string[] {
  return [BRAND_PRIMARY_DARK, brandPrimary, BRAND_PRIMARY_LIGHT]
}

export function MesoAccentStrip({ brandPrimary }: { brandPrimary: string }) {
  return (
    <View
      className="flex-row"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 1 }}
      accessibilityElementsHidden
      testID="meso-card-accent"
    >
      {accentStops(brandPrimary).map((color) => (
        <View key={color} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  )
}

export function MesoWeekList({
  weeks,
  totalWeeks,
  currentWeek,
  borderColor,
}: {
  weeks: WeekRowProps[]
  totalWeeks: number
  currentWeek?: number
  borderColor: string
}) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: borderColor }} testID="meso-card-weeks">
      {weeks.map((week) => (
        <WeekRow
          key={week.weekNumber}
          {...week}
          totalWeeks={week.totalWeeks ?? totalWeeks}
          isCurrent={week.isCurrent ?? week.weekNumber === currentWeek}
        />
      ))}
    </View>
  )
}

/** A button over the header when the card toggles, a labelled static region otherwise. */
export function MesoCardPressRegion({
  onToggle,
  expanded,
  name,
  goal,
  weekRange,
  children,
}: {
  onToggle?: () => void
  expanded: boolean
  name: string
  goal: string
  weekRange: string
  children: ReactNode
}) {
  return onToggle != null ? (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${goal}, ${weekRange}`}
      aria-expanded={expanded}
      testID="meso-card-toggle"
    >
      {children}
    </Pressable>
  ) : (
    <View accessibilityLabel={`${name}, ${goal}, ${weekRange}`} testID="meso-card-static">
      {children}
    </View>
  )
}
