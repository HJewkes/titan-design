// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { WeekRow, type WeekRowProps } from './WeekRow'

const BRAND_PRIMARY = '#FF7900'
const BRAND_PRIMARY_DARK = '#C45E00'
const BRAND_PRIMARY_LIGHT = '#FFB066'
const BORDER_DEFAULT = '#1F1F1F'

/** Gradient stops for the 3px top accent: dark -> primary -> light. */
const ACCENT_STOPS = [BRAND_PRIMARY_DARK, BRAND_PRIMARY, BRAND_PRIMARY_LIGHT]

export interface MesoVolumeHeatmapEntry {
  /** Muscle group identifier (free-form to match plan data). */
  group: string
  /** Planned volume intensity for the group, 0-100. */
  percentage: number
}

export interface MesoCardProps extends ViewProps {
  /** Mesocycle name, e.g. "Accumulation". */
  name: string
  /** Training goal, e.g. "Hypertrophy", "Strength", "Peaking". */
  goal: string
  /** Training split, e.g. "Upper/Lower", "Push/Pull/Legs". */
  split: string
  /** Week range label, e.g. "Weeks 1-4". */
  weekRange: string
  /** Current week within the mesocycle (1-based). */
  currentWeek?: number
  /** Total weeks in the mesocycle. */
  totalWeeks: number
  /** Weeks rendered as a WeekRow list when expanded. */
  weeks: WeekRowProps[]
  /** Whether the card is expanded to reveal the week list. */
  expanded?: boolean
  /** Toggles expansion; makes the header a button when provided. */
  onToggle?: () => void
  /** Whether this meso is highlighted in the MesoProgressBar. */
  highlighted?: boolean
  /** Volume heatmap data per muscle group for the meso. */
  volumeHeatmap?: MesoVolumeHeatmapEntry[]
  className?: string
}

/**
 * Maps a 0-100 volume percentage onto a brand-primary tint whose opacity
 * tracks intensity, keeping a visible floor so low-volume groups stay legible.
 */
function heatmapColor(percentage: number): string {
  const clamped = Math.max(0, Math.min(100, percentage))
  const opacity = 0.12 + (clamped / 100) * 0.78
  return `rgba(255,121,0,${opacity.toFixed(3)})`
}

/**
 * A mesocycle card with name, goal, split, week range, an optional volume
 * heatmap strip, and an expandable WeekRow list. Highlighting animates the
 * border toward brand-primary with a subtle glow to stay in sync with the
 * MesoProgressBar.
 *
 * @example
 * <MesoCard
 *   name="Accumulation"
 *   goal="Hypertrophy"
 *   split="Upper/Lower"
 *   weekRange="Weeks 1-4"
 *   currentWeek={2}
 *   totalWeeks={4}
 *   weeks={weeks}
 *   volumeHeatmap={[{ group: 'chest', percentage: 80 }]}
 *   expanded
 *   onToggle={() => {}}
 *   highlighted
 * />
 */
export function MesoCard({
  name,
  goal,
  split,
  weekRange,
  currentWeek,
  totalWeeks,
  weeks,
  expanded = false,
  onToggle,
  highlighted = false,
  volumeHeatmap,
  className,
  ...props
}: MesoCardProps) {
  const isExpandable = onToggle != null
  const [highlight] = useState(() => new Animated.Value(highlighted ? 1 : 0))

  useEffect(() => {
    const animation = Animated.timing(highlight, {
      toValue: highlighted ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [highlighted, highlight])

  const borderColor = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: [BORDER_DEFAULT, BRAND_PRIMARY],
  })

  const header = (
    <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 }} testID="meso-card-body">
      <View className="flex-row items-center" style={{ gap: 8 }} testID="meso-card-header">
        <Text
          className="text-text-primary"
          style={{
            fontSize: 15,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
          }}
          testID="meso-card-name"
        >
          {name}
        </Text>
        <Badge variant="subtle" color="primary" size="sm" testID="meso-card-goal-badge">
          {goal}
        </Badge>
      </View>

      <Text
        className="text-text-secondary"
        style={{
          marginTop: 4,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        }}
        testID="meso-card-subheader"
      >
        {`${split} · ${weekRange}`}
      </Text>

      {volumeHeatmap && volumeHeatmap.length > 0 && (
        <View
          className="flex-row items-center"
          style={{ marginTop: 10, gap: 3 }}
          accessibilityElementsHidden
          testID="meso-card-heatmap"
        >
          {volumeHeatmap.map((entry) => (
            <View
              key={entry.group}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 2,
                backgroundColor: heatmapColor(entry.percentage),
              }}
              testID="meso-card-heatmap-cell"
            />
          ))}
        </View>
      )}
    </View>
  )

  return (
    <Animated.View style={highlighted ? { transform: [{ scale: 1.0 }] } : undefined} testID="meso-card-wrapper">
      <Card
        variant="outline"
        elevation={2}
        borderColor={highlighted ? BRAND_PRIMARY : BORDER_DEFAULT}
        className={className}
        style={[
          { borderColor: borderColor as unknown as string },
          highlighted
            ? { boxShadow: '0 0 12px 2px rgba(255,121,0,0.25)' }
            : undefined,
        ]}
        testID="meso-card"
        {...props}
      >
        <View
          className="flex-row"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 1 }}
          accessibilityElementsHidden
          testID="meso-card-accent"
        >
          {ACCENT_STOPS.map((color) => (
            <View key={color} style={{ flex: 1, backgroundColor: color }} />
          ))}
        </View>

        {isExpandable ? (
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${goal}, ${weekRange}`}
            aria-expanded={expanded}
            testID="meso-card-toggle"
          >
            {header}
          </Pressable>
        ) : (
          <View
            accessibilityLabel={`${name}, ${goal}, ${weekRange}`}
            testID="meso-card-static"
          >
            {header}
          </View>
        )}

        {expanded && weeks.length > 0 && (
          <View
            style={{ borderTopWidth: 1, borderTopColor: BORDER_DEFAULT }}
            testID="meso-card-weeks"
          >
            {weeks.map((week) => (
              <WeekRow
                key={week.weekNumber}
                {...week}
                totalWeeks={week.totalWeeks ?? totalWeeks}
                isCurrent={week.isCurrent ?? week.weekNumber === currentWeek}
              />
            ))}
          </View>
        )}
      </Card>
    </Animated.View>
  )
}
