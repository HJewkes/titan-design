// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import BodyHighlighter, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface/SurfaceContext'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { getGlowShadow } from '../../../theme/elevation'
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

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']

const OUTLINE_FILL = alpha(primitiveColors.white, 0.08)
const OUTLINE_BORDER = alpha(primitiveColors.white, 0.12)

/** Presentation size for BodyMap and TrainingStatusPage: 'phone' (default) keeps
 * today's compact geometry; 'wall' scales up for large-display dashboards. */
export type BodyMapSize = 'phone' | 'wall'

/** Figure scale per size — drives react-native-body-highlighter's `scale` prop
 * (the rendered SVG is 200*scale wide by 400*scale tall). */
const BODY_SCALE: Record<BodyMapSize, number> = {
  phone: 0.8, // 200x400 intrinsic -> ~160x320 px
  wall: 2.4, // 200x400 intrinsic -> 480x960 px
}

/** Modest type ramp for the legend/toggle text at wall size; 1 (no-op) at phone. */
export const TYPE_RAMP: Record<BodyMapSize, number> = {
  phone: 1,
  wall: 2,
}

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
  /** Presentation size: 'phone' (default) or 'wall' for large-display dashboards. */
  size?: BodyMapSize
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

/**
 * Build the per-slug heatmap fill list, combining groups that share a slug.
 *
 * Takes `mode` rather than reading a hook: this is a plain helper behind a
 * `useMemo`, not a component, so the caller resolves the theme and passes it in.
 */
function buildSlugParts(data: BodyMapData[], mode: ThemeMode): ExtendedBodyPart[] {
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
    color: getHeatmapColor(v.status, v.intensity, mode),
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
  size = 'phone',
  className,
  ...props
}: BodyMapProps) {
  const bodyScale = BODY_SCALE[size]
  const ramp = TYPE_RAMP[size]
  // Named `surfaceMode` because `mode` is already this component's detailed/simple prop.
  const surfaceMode = useSurfaceMode()
  const slugParts = useMemo(() => buildSlugParts(data, surfaceMode), [data, surfaceMode])
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
        data.find((d) => d.muscleGroup === highlightedMuscle)?.intensity ?? 0,
        surfaceMode
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
      <ViewToggle view={view} onViewChange={onViewChange} ramp={ramp} />

      <Animated.View
        style={[
          {
            width: 200 * bodyScale,
            alignSelf: 'center',
            transform: [{ scale }],
          },
          // The highlight halo is emphasis, not depth.
          glowColor ? getGlowShadow(glowColor, 'medium') : undefined,
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
          scale={bodyScale}
          gender="male"
          defaultFill={OUTLINE_FILL}
          border={OUTLINE_BORDER}
          onBodyPartPress={handleBodyPress}
        />
      </Animated.View>

      {legend.length === 0 ? (
        <Text
          className="text-text-secondary"
          style={{
            marginTop: 8 * ramp,
            fontSize: 12 * ramp,
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
          style={{ marginTop: 10 * ramp, gap: 6 * ramp, justifyContent: 'center' }}
          testID="body-map-legend"
        >
          {legend.map((entry) => (
            <MuscleButton
              key={entry.key}
              entry={entry}
              highlighted={highlightedMuscle === entry.muscle}
              onMusclePress={onMusclePress}
              ramp={ramp}
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
  ramp: number
}

function ViewToggle({ view, onViewChange, ramp }: ViewToggleProps) {
  return (
    <View
      className="flex-row self-center"
      style={{ gap: 4 * ramp, marginBottom: 8 * ramp }}
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
              paddingHorizontal: 12 * ramp,
              paddingVertical: 4 * ramp,
              borderRadius: 9999,
              backgroundColor: active ? alpha(BRAND_PRIMARY, 0.16) : 'transparent',
              borderWidth: 1,
              borderColor: active ? BRAND_PRIMARY : resolveColor('hairline-strong'),
            }}
            testID={`body-map-toggle-${side}`}
          >
            <Text
              style={{
                fontSize: 12 * ramp,
                fontFamily: 'Inter, sans-serif',
                fontWeight: active ? '700' : '500',
                color: active ? BRAND_PRIMARY : resolveColor('text-secondary'),
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
  ramp: number
}

function MuscleButton({ entry, highlighted, onMusclePress, ramp }: MuscleButtonProps) {
  const dotColor = getHeatmapColor(entry.status, entry.intensity, useSurfaceMode())
  const label = `${entry.name}, ${VOLUME_STATUS_LABELS[entry.status]}, ${entry.sets} sets this week`
  return (
    <Pressable
      onPress={() => onMusclePress?.(entry.muscle)}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-pressed={highlighted}
      className="bg-surface-raised"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5 * ramp,
        paddingHorizontal: 8 * ramp,
        paddingVertical: 3 * ramp,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: highlighted ? BRAND_PRIMARY : resolveColor('hairline-default'),
      }}
      testID={`body-map-muscle-${entry.key}`}
    >
      <View
        style={{ width: 7 * ramp, height: 7 * ramp, borderRadius: 9999, backgroundColor: dotColor }}
        accessibilityElementsHidden
        testID={`body-map-muscle-dot-${entry.key}`}
      />
      <Text
        className="text-text-primary"
        style={{
          fontSize: 11 * ramp,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
        }}
        accessibilityElementsHidden
      >
        {entry.name}
      </Text>
    </Pressable>
  )
}
