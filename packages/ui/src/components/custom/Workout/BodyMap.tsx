// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import BodyHighlighter, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { cn } from '../../../utils/cn'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import {
  MuscleGroup,
  SimpleMuscleGroup,
  MUSCLE_TO_SVG_SLUGS,
  MUSCLE_DISPLAY_NAMES,
  SIMPLE_DISPLAY_NAMES,
  DETAILED_TO_SIMPLE,
  SLUG_TO_PRIMARY_MUSCLE,
  VOLUME_STATUS_LABELS,
  getHeatmapColor,
  isMoreSevere,
  type VolumeStatus,
} from './muscleTaxonomy'

/**
 * react-native-body-highlighter is published as a CommonJS default export; the
 * interop keeps it working whether the bundler unwraps the default or not.
 */
const Body = ((BodyHighlighter as unknown as { default?: typeof BodyHighlighter }).default ??
  BodyHighlighter) as typeof BodyHighlighter

const OUTLINE_FILL = 'rgba(255,255,255,0.08)'
const OUTLINE_BORDER = 'rgba(255,255,255,0.12)'
const BODY_SCALE = 0.8 // 200x400 intrinsic -> ~160x320 px
const TEXT_PRIMARY = '#F3F4F6'
const TEXT_SECONDARY = '#9CA3AF'

export interface BodyMapData {
  muscleGroup: MuscleGroup
  /** Intensity 0-1 for heatmap color. */
  intensity: number
  /** Volume status for tooltip / heatmap token. */
  volumeStatus: VolumeStatus
  /** Weekly effective sets. */
  weeklySets: number
}

export interface BodyMapProps extends ViewProps {
  /** Muscle group intensity data. */
  data: BodyMapData[]
  /** Which view to show. */
  view: 'front' | 'back'
  /** Toggle between front/back. */
  onViewChange?: (view: 'front' | 'back') => void
  /** Called when a muscle group is tapped. */
  onMusclePress?: (muscleGroup: MuscleGroup) => void
  /** Currently highlighted muscle (from external selection). */
  highlightedMuscle?: MuscleGroup | null
  /** Show simplified (8 groups) or detailed (15 groups). */
  mode?: 'simple' | 'detailed'
  className?: string
}

interface LegendEntry {
  key: string
  name: string
  status: VolumeStatus
  intensity: number
  sets: number
  /** Detailed group reported to onMusclePress. */
  muscle: MuscleGroup
}

/** Build the per-slug heatmap fill list, combining groups that share a slug. */
function buildSlugParts(data: BodyMapData[]): ExtendedBodyPart[] {
  const bySlug = new Map<string, { status: VolumeStatus; intensity: number }>()
  for (const d of data) {
    for (const slug of MUSCLE_TO_SVG_SLUGS[d.muscleGroup] ?? []) {
      const existing = bySlug.get(slug)
      if (!existing || isMoreSevere(d.volumeStatus, existing.status)) {
        bySlug.set(slug, { status: d.volumeStatus, intensity: d.intensity })
      }
    }
  }
  return Array.from(bySlug.entries()).map(([slug, v]) => ({
    slug: slug as Slug,
    color: getHeatmapColor(v.status, v.intensity),
  }))
}

/** Collapse data into per-simple-group legend entries (summed sets). */
function buildSimpleLegend(data: BodyMapData[]): LegendEntry[] {
  const bySimple = new Map<SimpleMuscleGroup, LegendEntry>()
  for (const d of data) {
    const simple = DETAILED_TO_SIMPLE[d.muscleGroup]
    const existing = bySimple.get(simple)
    if (!existing) {
      bySimple.set(simple, {
        key: simple,
        name: SIMPLE_DISPLAY_NAMES[simple],
        status: d.volumeStatus,
        intensity: d.intensity,
        sets: d.weeklySets,
        muscle: d.muscleGroup,
      })
      continue
    }
    existing.sets += d.weeklySets
    existing.intensity = Math.max(existing.intensity, d.intensity)
    if (isMoreSevere(d.volumeStatus, existing.status)) {
      existing.status = d.volumeStatus
      existing.muscle = d.muscleGroup
    }
  }
  return Array.from(bySimple.values())
}

/** One legend entry per data row, named by detailed group. */
function buildDetailedLegend(data: BodyMapData[]): LegendEntry[] {
  return data.map((d) => ({
    key: d.muscleGroup,
    name: MUSCLE_DISPLAY_NAMES[d.muscleGroup],
    status: d.volumeStatus,
    intensity: d.intensity,
    sets: d.weeklySets,
    muscle: d.muscleGroup,
  }))
}

/**
 * Interactive SVG body map with tappable muscle groups and a volume heatmap.
 * Renders the front or back view (toggle via onViewChange), colors each muscle
 * by its weekly-volume status, and exposes an accessible muscle legend wired to
 * onMusclePress. Phase 1 uses react-native-body-highlighter's combined slugs
 * (deltoids as one path, lats/upper-back shared); swipe between views and the
 * delt/lat SVG split are follow-ups.
 *
 * @example
 * <BodyMap
 *   data={[{ muscleGroup: MuscleGroup.CHEST, intensity: 0.7, volumeStatus: 'productive', weeklySets: 12 }]}
 *   view="front"
 *   onViewChange={setView}
 *   onMusclePress={setSelected}
 *   highlightedMuscle={selected}
 * />
 */
export function BodyMap({
  data,
  view,
  onViewChange,
  onMusclePress,
  highlightedMuscle,
  mode = 'detailed',
  className,
  ...props
}: BodyMapProps) {
  const slugParts = useMemo(() => buildSlugParts(data), [data])
  const legend = useMemo(
    () => (mode === 'simple' ? buildSimpleLegend(data) : buildDetailedLegend(data)),
    [data, mode]
  )

  const [highlight] = useState(() => new Animated.Value(highlightedMuscle ? 1 : 0))
  useEffect(() => {
    const animation = Animated.timing(highlight, {
      toValue: highlightedMuscle ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [highlightedMuscle, highlight])

  const scale = highlight.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] })
  const glowColor = highlightedMuscle
    ? getHeatmapColor(
        data.find((d) => d.muscleGroup === highlightedMuscle)?.volumeStatus,
        data.find((d) => d.muscleGroup === highlightedMuscle)?.intensity ?? 0
      )
    : null

  const handleBodyPress = (part: ExtendedBodyPart) => {
    if (!onMusclePress || !part.slug) return
    const fromData = data.find((d) =>
      (MUSCLE_TO_SVG_SLUGS[d.muscleGroup] ?? []).includes(part.slug as string)
    )
    const muscle = fromData?.muscleGroup ?? SLUG_TO_PRIMARY_MUSCLE[part.slug]
    if (muscle) onMusclePress(muscle)
  }

  return (
    <View className={cn(className)} testID="body-map" {...props}>
      <ViewToggle view={view} onViewChange={onViewChange} />

      <Animated.View
        style={[
          {
            width: 200 * BODY_SCALE,
            alignSelf: 'center',
            transform: [{ scale }],
          },
          glowColor ? { boxShadow: `0 0 14px 2px ${glowColor}` } : undefined,
        ]}
        // The SVG is decorative; the accessible muscle legend below is the
        // screen-reader / keyboard interface.
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="body-map-svg"
      >
        <Body
          side={view}
          data={slugParts}
          scale={BODY_SCALE}
          gender="male"
          defaultFill={OUTLINE_FILL}
          border={OUTLINE_BORDER}
          onBodyPartPress={handleBodyPress}
        />
      </Animated.View>

      {legend.length === 0 ? (
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: TEXT_SECONDARY,
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
          }}
          testID="body-map-empty"
        >
          No training data
        </Text>
      ) : (
        <View
          className="flex-row flex-wrap"
          style={{ marginTop: 10, gap: 6, justifyContent: 'center' }}
          testID="body-map-legend"
        >
          {legend.map((entry) => (
            <MuscleButton
              key={entry.key}
              entry={entry}
              highlighted={highlightedMuscle === entry.muscle}
              onMusclePress={onMusclePress}
            />
          ))}
        </View>
      )}
    </View>
  )
}

interface ViewToggleProps {
  view: 'front' | 'back'
  onViewChange?: (view: 'front' | 'back') => void
}

function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <View
      className="flex-row self-center"
      style={{ gap: 4, marginBottom: 8 }}
      testID="body-map-view-toggle"
    >
      {(['front', 'back'] as const).map((side) => {
        const active = view === side
        return (
          <Pressable
            key={side}
            onPress={() => onViewChange?.(side)}
            accessibilityRole="button"
            accessibilityLabel={`Show ${side} view`}
            aria-pressed={active}
            disabled={!onViewChange}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: active ? 'rgba(255,121,0,0.16)' : 'transparent',
              borderWidth: 1,
              borderColor: active ? '#FF7900' : WORKOUT_TOKENS.border.strong,
            }}
            testID={`body-map-toggle-${side}`}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fontWeight: active ? '700' : '500',
                color: active ? '#FF7900' : TEXT_SECONDARY,
                textTransform: 'capitalize',
              }}
            >
              {side}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

interface MuscleButtonProps {
  entry: LegendEntry
  highlighted: boolean
  onMusclePress?: (muscleGroup: MuscleGroup) => void
}

function MuscleButton({ entry, highlighted, onMusclePress }: MuscleButtonProps) {
  const dotColor = getHeatmapColor(entry.status, entry.intensity)
  const label = `${entry.name}, ${VOLUME_STATUS_LABELS[entry.status]}, ${entry.sets} sets this week`
  return (
    <Pressable
      onPress={() => onMusclePress?.(entry.muscle)}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-pressed={highlighted}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: highlighted ? '#FF7900' : WORKOUT_TOKENS.border.default,
        backgroundColor: WORKOUT_TOKENS.surface.raised,
      }}
      testID={`body-map-muscle-${entry.key}`}
    >
      <View
        style={{ width: 7, height: 7, borderRadius: 9999, backgroundColor: dotColor }}
        accessibilityElementsHidden
        testID={`body-map-muscle-dot-${entry.key}`}
      />
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          color: TEXT_PRIMARY,
        }}
        accessibilityElementsHidden
      >
        {entry.name}
      </Text>
    </Pressable>
  )
}
