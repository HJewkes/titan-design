// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import { Badge, type BadgeColor } from '../../ui/badge'
import { Sparkline } from './Sparkline'
import {
  MuscleGroup,
  VOLUME_STATUS_LABELS,
  type VolumeLandmarks,
  type VolumeStatus,
} from './muscleTaxonomy'

const BRAND_PRIMARY = '#FF7900'

/** Volume track gradient: status-info (blue) -> result-improve (teal) -> status-error (red). */
const VOLUME_GRADIENT = 'linear-gradient(90deg, #2196F3 0%, #14B8A6 50%, #D14343 100%)'

/** Sheet slides up from this offset (px) and the backdrop fades to this opacity. */
const SLIDE_OFFSET = 400
const BACKDROP_OPACITY = 0.4

/** Volume status -> Badge color scheme. */
const STATUS_BADGE_COLOR: Record<VolumeStatus, BadgeColor> = {
  under: 'info',
  maintenance: 'warning',
  productive: 'success',
  over: 'error',
}

export interface ContributingExercise {
  /** Exercise name. */
  name: string
  /** Working sets contributed this week. */
  sets: number
  /** Effective-set multiplier toward this muscle (0-1). */
  contributionWeight: number
}

export interface UpcomingExercise {
  /** Exercise name. */
  name: string
  /** Workout the exercise belongs to. */
  workoutName: string
  /** Planned sets. */
  sets: number
}

export interface BodyMapDetailPanelProps extends ViewProps {
  /** Muscle group whose volume detail is shown. */
  muscleGroup: MuscleGroup
  /** Human-readable muscle name for the title and a11y label. */
  displayName: string
  /** Weekly effective sets logged for this muscle. */
  weeklySets: number
  /** Volume landmarks (weekly working sets). */
  landmarks: VolumeLandmarks
  /** Weekly-volume status relative to the landmarks. */
  volumeStatus: VolumeStatus
  /** Last trained label, e.g. "2 days ago". */
  lastTrained?: string
  /** Volume sparkline data (last 4-8 weeks). */
  weeklyHistory?: number[]
  /** Exercises contributing to this muscle's volume. */
  contributingExercises?: ContributingExercise[]
  /** Upcoming exercises targeting this muscle. */
  upcomingExercises?: UpcomingExercise[]
  /** Whether the bottom sheet is visible. */
  isOpen?: boolean
  /** Alias for `isOpen` (spec wording: "isOpen/visible"). `isOpen` wins when both are set. */
  visible?: boolean
  /** Dismiss the panel (backdrop, handle, or close button). */
  onClose: () => void
  /** Navigate to a filtered exercise list. */
  onViewExercises?: () => void
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** Marker position (0-1) of current sets between MEV (left) and MRV (right). */
function markerFraction(weeklySets: number, { mev, mrv }: VolumeLandmarks): number {
  const span = mrv - mev
  if (span <= 0) return weeklySets >= mrv ? 1 : 0
  return clamp01((weeklySets - mev) / span)
}

/**
 * Slide-up bottom-sheet panel with detailed weekly-volume info for a tapped
 * muscle group: a MEV|current|MRV gradient progress bar, the big weekly set
 * count against MRV, an optional volume sparkline, and the contributing /
 * upcoming exercise lists. Composes the titan `Badge` and Workout `Sparkline`.
 *
 * Controlled via `isOpen` (or the `visible` alias); renders nothing when closed
 * and animates in on open — sheet translateY 400->0 (400ms ease-out) and a
 * backdrop fade 0->0.4 (RN Animated, useNativeDriver:false). Backdrop, handle,
 * and the header close button all call `onClose`.
 *
 * @example
 * <BodyMapDetailPanel
 *   muscleGroup={MuscleGroup.CHEST}
 *   displayName="Chest"
 *   weeklySets={14}
 *   landmarks={{ mev: 8, mav: 14, mrv: 20 }}
 *   volumeStatus="productive"
 *   lastTrained="2 days ago"
 *   weeklyHistory={[8, 10, 12, 14]}
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 * />
 */
export function BodyMapDetailPanel({
  muscleGroup,
  displayName,
  weeklySets,
  landmarks,
  volumeStatus,
  lastTrained,
  weeklyHistory,
  contributingExercises,
  upcomingExercises,
  isOpen,
  visible,
  onClose,
  onViewExercises,
  ...props
}: BodyMapDetailPanelProps) {
  const open = isOpen ?? visible ?? false

  const [translateY] = useState(() => new Animated.Value(SLIDE_OFFSET))
  const [backdrop] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (!open) return
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(backdrop, {
        toValue: BACKDROP_OPACITY,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ])
    animation.start()
    return () => animation.stop()
  }, [open, translateY, backdrop])

  if (!open) return null

  const dialogLabel = `${displayName} volume details`
  const markerLeft = markerFraction(weeklySets, landmarks) * 100
  const hasContributing = (contributingExercises?.length ?? 0) > 0
  const hasUpcoming = (upcomingExercises?.length ?? 0) > 0

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' }}
      testID="body-map-detail-panel-root"
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000000',
          opacity: backdrop,
        }}
        testID="body-map-detail-panel-backdrop-anim"
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${displayName} details`}
          style={{ flex: 1 }}
          testID="body-map-detail-panel-backdrop"
        />
      </Animated.View>

      <Animated.View
        accessibilityRole={'dialog' as ViewProps['accessibilityRole']}
        accessibilityLabel={dialogLabel}
        aria-label={dialogLabel}
        className="bg-surface-elevated"
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '88%',
          transform: [{ translateY }],
        }}
        testID="body-map-detail-panel"
        {...props}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${displayName} details`}
          hitSlop={12}
          style={{ alignSelf: 'center', paddingVertical: 8 }}
          testID="body-map-detail-panel-handle"
        >
          <View
            className="bg-border-strong"
            style={{ width: 40, height: 4, borderRadius: 2 }}
            accessibilityElementsHidden
          />
        </Pressable>

        <ScrollView
          style={{ paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          testID="body-map-detail-panel-scroll"
        >
          <View
            className="flex-row items-center justify-between"
            style={{ gap: 8, paddingTop: 4, paddingBottom: 4 }}
            testID="body-map-detail-panel-header"
          >
            <View className="flex-row items-center" style={{ gap: 8, flexShrink: 1 }}>
              <Text
                accessibilityRole="header"
                className="text-text-primary"
                style={{
                  fontSize: 16,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: '700',
                }}
                testID="body-map-detail-panel-title"
              >
                {displayName}
              </Text>
              <Badge
                variant="subtle"
                color={STATUS_BADGE_COLOR[volumeStatus]}
                size="sm"
                testID="body-map-detail-panel-status-badge"
              >
                {VOLUME_STATUS_LABELS[volumeStatus]}
              </Badge>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${displayName} details`}
              hitSlop={8}
              style={{ padding: 4, margin: -4 }}
              testID="body-map-detail-panel-close"
            >
              <Text className="text-text-secondary" style={{ fontSize: 22, lineHeight: 22 }}>{'×'}</Text>
            </Pressable>
          </View>

          {lastTrained != null && (
            <Text
              className="text-text-secondary"
              style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              testID="body-map-detail-panel-last-trained"
            >
              {`Last trained ${lastTrained}`}
            </Text>
          )}

          <View style={{ marginTop: 16 }} testID="body-map-detail-panel-volume">
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: 6 }}
              accessibilityElementsHidden
            >
              <Text className="text-text-tertiary" style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>
                {`MEV ${landmarks.mev}`}
              </Text>
              <Text className="text-text-tertiary" style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>
                {`MRV ${landmarks.mrv}`}
              </Text>
            </View>
            <View
              style={{ height: 14, justifyContent: 'center' }}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: landmarks.mev, max: landmarks.mrv, now: weeklySets }}
              accessibilityLabel={`${weeklySets} weekly sets, between MEV ${landmarks.mev} and MRV ${landmarks.mrv}`}
              aria-valuenow={weeklySets}
              aria-valuemin={landmarks.mev}
              aria-valuemax={landmarks.mrv}
              testID="body-map-detail-panel-volume-bar"
            >
              <View
                style={{ height: 8, borderRadius: 4, backgroundImage: VOLUME_GRADIENT } as ViewStyle}
                accessibilityElementsHidden
              />
              <View
                className="border-text-primary bg-surface-elevated"
                style={{
                  position: 'absolute',
                  left: `${markerLeft}%`,
                  marginLeft: -7,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 2,
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                }}
                accessibilityElementsHidden
                testID="body-map-detail-panel-volume-marker"
              />
            </View>
          </View>

          <View className="flex-row items-baseline" style={{ marginTop: 14, gap: 4 }}>
            <Text
              className="text-text-primary"
              style={{
                fontSize: 24,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: '700',
              }}
              testID="body-map-detail-panel-set-count"
            >
              {weeklySets}
            </Text>
            <Text
              className="text-text-secondary"
              style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              testID="body-map-detail-panel-mrv-suffix"
            >
              {`/ ${landmarks.mrv} MRV`}
            </Text>
          </View>

          {weeklyHistory != null && weeklyHistory.length > 0 && (
            <View style={{ marginTop: 14 }} testID="body-map-detail-panel-sparkline">
              <Text
                className="text-text-tertiary"
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  marginBottom: 6,
                }}
                accessibilityElementsHidden
              >
                {'VOLUME TREND'}
              </Text>
              <Sparkline data={weeklyHistory} width={80} height={30} highlightLast />
            </View>
          )}

          {hasContributing && (
            <View style={{ marginTop: 16 }} testID="body-map-detail-panel-contributing">
              <Text
                className="text-text-tertiary"
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                {'CONTRIBUTING EXERCISES'}
              </Text>
              {contributingExercises!.map((exercise, index) => (
                <View
                  key={`${exercise.name}-${index}`}
                  className="flex-row items-center justify-between bg-surface-raised border-border"
                  style={{
                    gap: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    marginBottom: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  testID={`body-map-detail-panel-contributing-${index}`}
                >
                  <Text
                    className="text-text-primary"
                    style={{ flex: 1, fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                    testID={`body-map-detail-panel-contributing-${index}-name`}
                  >
                    {exercise.name}
                  </Text>
                  <Text
                    className="text-text-secondary"
                    style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                    testID={`body-map-detail-panel-contributing-${index}-detail`}
                  >
                    {`${exercise.sets} sets · ${Math.round(exercise.contributionWeight * 100)}%`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {hasUpcoming && (
            <View style={{ marginTop: 16 }} testID="body-map-detail-panel-upcoming">
              <Text
                className="text-text-tertiary"
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                {'UPCOMING'}
              </Text>
              {upcomingExercises!.map((exercise, index) => (
                <View
                  key={`${exercise.name}-${index}`}
                  className="flex-row items-center justify-between"
                  style={{ gap: 10, paddingVertical: 6 }}
                  testID={`body-map-detail-panel-upcoming-${index}`}
                >
                  <Text
                    className="text-text-primary"
                    style={{ flex: 1, fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                    testID={`body-map-detail-panel-upcoming-${index}-name`}
                  >
                    {exercise.name}
                  </Text>
                  <Text
                    className="text-text-tertiary"
                    style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                    testID={`body-map-detail-panel-upcoming-${index}-detail`}
                  >
                    {`${exercise.workoutName} · ${exercise.sets} sets`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {onViewExercises != null && (
            <Pressable
              onPress={onViewExercises}
              accessibilityRole="button"
              accessibilityLabel={`View ${displayName} exercises`}
              style={{
                marginTop: 16,
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: 'rgba(255,121,0,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255,121,0,0.3)',
              }}
              testID="body-map-detail-panel-view-exercises"
            >
              <Text style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: BRAND_PRIMARY }}>
                {'View exercises'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  )
}
