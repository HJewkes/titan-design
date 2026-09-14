// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
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
import { PlanSection, PrSection, StrengthSection } from './BodyMapDetailSections'
import type { MusclePlanSection, MuscleStrengthSection } from './muscleReadModels'
import {
  MuscleGroup,
  VOLUME_STATUS_LABELS,
  type VolumeLandmarks,
  type VolumeStatus,
} from './muscleTaxonomy'
import { getSemanticColors, space } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { surfaceGradient } from '../../../theme/gradients'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { liftStyle } from '../../../theme/lift'
import { alpha } from '../../../utils/colors'
import { cn } from '../../../utils/cn'

/** Sheet slides in from this offset (px) and the backdrop fades to this opacity. */
const SLIDE_OFFSET = 400
const BACKDROP_OPACITY = 0.4

/** Diameter of the knob on the volume track; it centres on its own half-width. */
const MARKER_SIZE = 14

/** Right side-sheet track: a third of a wall, floored and capped for legibility. */
const RIGHT_SHEET_WIDTH = '34%'
const RIGHT_SHEET_MIN_WIDTH = 320
const RIGHT_SHEET_MAX_WIDTH = 420

/** Where the sheet docks: the phone slide-up sheet, or the wall side-sheet. */
export type SheetPlacement = 'bottom' | 'right'

/** Tabbable descendants of the sheet, in document order, for the focus trap. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Volume status -> Badge color scheme. The badge is a semantic status chip, not
 * a dataviz mark, so it stays on the semantic status family rather than
 * following the dot and the figure onto the diverging scale.
 */
const STATUS_BADGE_COLOR: Record<VolumeStatus, BadgeColor> = {
  untrained: 'default',
  behind: 'info',
  ontrack: 'warning',
  target: 'success',
  approaching: 'warning',
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
  /**
   * Per-exercise strength rows for this muscle, mirroring voltras-mcp's
   * `/api/muscle-strength` (B3). Also feeds the PR rows: they are exactly the
   * rows the read model flagged `isPR`.
   */
  strength?: MuscleStrengthSection
  /** This week's plan for this muscle, mirroring `/api/muscle-plan` (B4). */
  plan?: MusclePlanSection
  /**
   * Where the sheet docks. `'bottom'` (default) is the phone slide-up sheet;
   * `'right'` is the wall side-sheet that slides in over the right third
   * without moving the figure beside it.
   */
  placement?: SheetPlacement
  /** Whether the sheet is visible. */
  isOpen?: boolean
  /** Alias for `isOpen` (spec wording: "isOpen/visible"). `isOpen` wins when both are set. */
  visible?: boolean
  /** Dismiss the panel (backdrop, handle, close button, or Escape). */
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

/** Overlay flow that docks the sheet; the overlay itself never takes layout space. */
const ROOT_LAYOUT = {
  bottom: { justifyContent: 'flex-end' },
  right: { flexDirection: 'row', justifyContent: 'flex-end' },
} as const satisfies Record<SheetPlacement, ViewStyle>

/** Sheet box per placement: a bottom sheet caps its height, a side-sheet its width. */
const SHEET_SHAPE = {
  bottom: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '88%' },
  right: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    width: RIGHT_SHEET_WIDTH,
    minWidth: RIGHT_SHEET_MIN_WIDTH,
    maxWidth: RIGHT_SHEET_MAX_WIDTH,
    height: '100%',
  },
} as const satisfies Record<SheetPlacement, ViewStyle>

/** Keep Tab and Shift+Tab inside the sheet by wrapping at either end. */
function trapTab(event: ReactKeyboardEvent, sheet: HTMLElement): void {
  const tabbables = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  const wrapTo = event.shiftKey ? tabbables[tabbables.length - 1] : tabbables[0]
  if (wrapTo == null) {
    event.preventDefault()
    return
  }
  const active = sheet.ownerDocument?.activeElement
  const atEdge = active === (event.shiftKey ? tabbables[0] : tabbables[tabbables.length - 1])
  if (!atEdge && !(event.shiftKey && active === sheet)) return
  event.preventDefault()
  wrapTo.focus()
}

/**
 * Dialog keyboard contract for the sheet, handled on the sheet root because
 * react-native-web forwards `onKeyDown` on a `View` but ships no dialog
 * primitive: Escape dismisses, Tab wraps inside, and the element that opened
 * the sheet gets focus back when it closes.
 */
function useSheetKeyboard(open: boolean, onClose: () => void) {
  const sheetRef = useRef<View>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const sheet = sheetRef.current as unknown as HTMLElement | null
    if (!sheet?.focus) return
    openerRef.current = (sheet.ownerDocument?.activeElement as HTMLElement | null) ?? null
    sheet.focus()
    return () => {
      openerRef.current?.focus?.()
      openerRef.current = null
    }
  }, [open])

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      const sheet = sheetRef.current as unknown as HTMLElement | null
      if (event.key === 'Tab' && sheet?.querySelectorAll) trapTab(event, sheet)
    },
    [onClose]
  )

  return { sheetRef, onKeyDown }
}

/**
 * Sheet of detailed weekly-volume info for a tapped muscle group: a
 * MEV|current|MRV gradient progress bar, the big weekly set count against MRV,
 * an optional volume sparkline, the per-exercise strength / this-week plan / PR
 * sections, and the contributing / upcoming exercise lists. Composes the titan
 * `Badge` and `DataRow` and the Workout `Sparkline`, `StrengthTrendChart` and
 * `PrBadge`.
 *
 * `placement="bottom"` (default) is the phone slide-up sheet with a drag handle.
 * `placement="right"` is the wall side-sheet: it slides in over the right third
 * of an absolutely-positioned overlay, so the figure beside it never reflows.
 *
 * Controlled via `isOpen` (or the `visible` alias); renders nothing when closed
 * and animates in on open — sheet translate 400->0 (400ms ease-out, on Y for
 * bottom and X for right) and a backdrop fade 0->0.4 (RN Animated,
 * useNativeDriver:false). Backdrop, handle, header close button, and Escape all
 * call `onClose`; focus is trapped in the sheet and restored to the opener.
 *
 * @example
 * <BodyMapDetailPanel
 *   muscleGroup={MuscleGroup.CHEST}
 *   displayName="Chest"
 *   weeklySets={14}
 *   landmarks={{ mev: 8, mav: 14, mrv: 20 }}
 *   volumeStatus="target"
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
  strength,
  plan,
  placement = 'bottom',
  isOpen,
  visible,
  onClose,
  onViewExercises,
  ...props
}: BodyMapDetailPanelProps) {
  const open = isOpen ?? visible ?? false
  const mode = useSurfaceMode()
  const brandPrimary = getSemanticColors(mode)['brand-primary']
  const { sheetRef, onKeyDown } = useSheetKeyboard(open, onClose)

  const [slide] = useState(() => new Animated.Value(SLIDE_OFFSET))
  const [backdrop] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (!open) return
    const animation = Animated.parallel([
      Animated.timing(slide, {
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
  }, [open, slide, backdrop])

  if (!open) return null

  const dialogLabel = `${displayName} volume details`
  const markerLeft = markerFraction(weeklySets, landmarks) * 100
  const hasContributing = (contributingExercises?.length ?? 0) > 0
  const hasUpcoming = (upcomingExercises?.length ?? 0) > 0
  const slideAxis = placement === 'right' ? { translateX: slide } : { translateY: slide }
  // RN's ViewProps declares neither key; react-native-web forwards both on a View.
  const dialogWebProps = { tabIndex: -1, onKeyDown } as unknown as ViewProps

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...ROOT_LAYOUT[placement],
      }}
      testID="body-map-detail-panel-root"
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: primitiveColors.black,
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
        ref={sheetRef}
        accessibilityRole={'dialog' as ViewProps['accessibilityRole']}
        accessibilityLabel={dialogLabel}
        aria-label={dialogLabel}
        className="bg-surface-elevated"
        style={{ ...SHEET_SHAPE[placement], transform: [slideAxis] }}
        testID="body-map-detail-panel"
        {...dialogWebProps}
        {...props}
      >
        {placement === 'bottom' && (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`Close ${displayName} details`}
            hitSlop={12}
            className="py-control-y-md"
            style={{ alignSelf: 'center' }}
            testID="body-map-detail-panel-handle"
          >
            <View
              className="bg-hairline-strong"
              style={{ width: 40, height: 4, borderRadius: 2 }}
              accessibilityElementsHidden
            />
          </Pressable>
        )}

        <ScrollView
          className={cn('px-inset-lg', placement === 'right' && 'pt-inset-md')}
          contentContainerStyle={{ paddingBottom: space.inset.xl }}
          testID="body-map-detail-panel-scroll"
        >
          <View
            className="flex-row items-center justify-between gap-inline-md py-1"
            testID="body-map-detail-panel-header"
          >
            <View className="flex-row items-center gap-inline-md" style={{ flexShrink: 1 }}>
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
              className="p-1 -m-1"
              testID="body-map-detail-panel-close"
            >
              <Text className="text-text-secondary" style={{ fontSize: 22, lineHeight: 22 }}>
                {'×'}
              </Text>
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

          <View className="mt-stack-lg" testID="body-map-detail-panel-volume">
            <View
              className="mb-1.5 flex-row items-center justify-between"
              accessibilityElementsHidden
            >
              <Text
                className="text-text-tertiary"
                style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
              >
                {`MEV ${landmarks.mev}`}
              </Text>
              <Text
                className="text-text-tertiary"
                style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
              >
                {`MRV ${landmarks.mrv}`}
              </Text>
            </View>
            <View
              style={{ height: MARKER_SIZE, justifyContent: 'center' }}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: landmarks.mev, max: landmarks.mrv, now: weeklySets }}
              accessibilityLabel={`${weeklySets} weekly sets, between MEV ${landmarks.mev} and MRV ${landmarks.mrv}`}
              aria-valuenow={weeklySets}
              aria-valuemin={landmarks.mev}
              aria-valuemax={landmarks.mrv}
              testID="body-map-detail-panel-volume-bar"
            >
              <View
                style={
                  { height: 8, borderRadius: 4, ...surfaceGradient.volumeTrack(mode) } as ViewStyle
                }
                accessibilityElementsHidden
              />
              <View
                className="border-text-primary bg-surface-elevated"
                style={{
                  position: 'absolute',
                  left: `${markerLeft}%`,
                  marginLeft: -MARKER_SIZE / 2,
                  width: MARKER_SIZE,
                  height: MARKER_SIZE,
                  borderRadius: MARKER_SIZE / 2,
                  borderWidth: 2,
                  // A knob resting on the volume bar: lift, with the ring as its edge.
                  ...liftStyle(1, mode, { rim: 0 }),
                }}
                accessibilityElementsHidden
                testID="body-map-detail-panel-volume-marker"
              />
            </View>
          </View>

          <View className="mt-3.5 flex-row items-baseline gap-inline-sm">
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
            <View className="mt-3.5" testID="body-map-detail-panel-sparkline">
              <Text
                className="mb-1.5 text-text-tertiary"
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                }}
                accessibilityElementsHidden
              >
                {'VOLUME TREND'}
              </Text>
              <Sparkline data={weeklyHistory} width={80} height={30} highlightLast />
            </View>
          )}

          {strength != null && <StrengthSection section={strength} />}
          {plan != null && <PlanSection section={plan} />}
          {strength != null && <PrSection section={strength} />}

          {hasContributing && (
            <View className="mt-stack-lg" testID="body-map-detail-panel-contributing">
              <Text
                className="mb-stack-md text-text-tertiary"
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                }}
              >
                {'CONTRIBUTING EXERCISES'}
              </Text>
              {contributingExercises!.map((exercise, index) => (
                <View
                  key={`${exercise.name}-${index}`}
                  className="mb-1.5 flex-row items-center justify-between gap-2.5 px-inset-md py-2 bg-surface-raised border-hairline"
                  style={{ borderRadius: 8, borderWidth: 1 }}
                  testID={`body-map-detail-panel-contributing-${index}`}
                >
                  <Text
                    className="text-text-primary"
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '600',
                    }}
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
            <View className="mt-stack-lg" testID="body-map-detail-panel-upcoming">
              <Text
                className="mb-stack-md text-text-tertiary"
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                }}
              >
                {'UPCOMING'}
              </Text>
              {upcomingExercises!.map((exercise, index) => (
                <View
                  key={`${exercise.name}-${index}`}
                  className="flex-row items-center justify-between gap-2.5 py-1.5"
                  testID={`body-map-detail-panel-upcoming-${index}`}
                >
                  <Text
                    className="text-text-primary"
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '600',
                    }}
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
              className="mt-stack-lg py-control-y-lg"
              style={{
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: alpha(brandPrimary, 0.12),
                borderWidth: 1,
                borderColor: alpha(brandPrimary, 0.3),
              }}
              testID="body-map-detail-panel-view-exercises"
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '700',
                  color: brandPrimary,
                }}
              >
                {'View exercises'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  )
}
