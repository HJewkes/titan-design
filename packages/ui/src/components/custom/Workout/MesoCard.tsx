// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import type { WeekRowProps } from './WeekRow'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { getGlowShadow } from '../../../theme/elevation'
import { alpha } from '../../../utils/colors'
import { MesoAccentStrip, MesoCardPressRegion, MesoWeekList } from './MesoCard.parts'

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
function heatmapColor(percentage: number, brandPrimary: string): string {
  const clamped = Math.max(0, Math.min(100, percentage))
  const opacity = 0.12 + (clamped / 100) * 0.78
  return alpha(brandPrimary, opacity)
}

function MesoHeatmapStrip({
  entries,
  brandPrimary,
}: {
  entries: ReadonlyArray<{ group: string; percentage: number }>
  brandPrimary: string
}) {
  return (
    <View
      className="flex-row items-center mt-2.5"
      // optical: hairline between 8px heatmap segments; 4px reads as separate bars.
      style={{ gap: 3 }}
      accessibilityElementsHidden
      testID="meso-card-heatmap"
    >
      {entries.map((entry) => (
        <View
          key={entry.group}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 2,
            backgroundColor: heatmapColor(entry.percentage, brandPrimary),
          }}
          testID="meso-card-heatmap-cell"
        />
      ))}
    </View>
  )
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
  const t = getSemanticColors(useSurfaceMode())
  const brandPrimary = t['brand-primary']
  const borderDefault = t['hairline-default']

  const header = (
    <View className="px-3.5 pt-inset-md pb-2.5" testID="meso-card-body">
      <View className="flex-row items-center gap-inline-md" testID="meso-card-header">
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
        className="text-text-secondary mt-stack-sm"
        style={{
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        }}
        testID="meso-card-subheader"
      >
        {`${split} · ${weekRange}`}
      </Text>

      {volumeHeatmap && volumeHeatmap.length > 0 && (
        <MesoHeatmapStrip entries={volumeHeatmap} brandPrimary={brandPrimary} />
      )}
    </View>
  )

  return (
    <Card
      variant="outline"
      elevation={2}
      borderColor={highlighted ? brandPrimary : borderDefault}
      className={className}
      // Highlight is emphasis, not depth: a brand glow through the shared builder.
      style={highlighted ? getGlowShadow(brandPrimary, 'subtle') : undefined}
      testID="meso-card"
      {...props}
    >
      <MesoAccentStrip brandPrimary={brandPrimary} />

      <MesoCardPressRegion
        onToggle={onToggle}
        expanded={expanded}
        name={name}
        goal={goal}
        weekRange={weekRange}
      >
        {header}
      </MesoCardPressRegion>

      {expanded && weeks.length > 0 && (
        <MesoWeekList
          weeks={weeks}
          totalWeeks={totalWeeks}
          currentWeek={currentWeek}
          borderColor={borderDefault}
        />
      )}
    </Card>
  )
}
