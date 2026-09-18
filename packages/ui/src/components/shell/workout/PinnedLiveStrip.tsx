// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactNode } from 'react'
import {
  View,
  Text,
  Pressable,
  Platform,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { formatDuration } from '../../../hooks/useTimer'
import { formatVelocity } from '../../../utils/workout-format'
import { Surface } from '../../ui/surface'
import { Indicator } from '../../ui/indicator'
import { Progress } from '../../ui/progress'
import { Typography } from '../../custom/Typography'
import { ChevronRightIcon } from '../../icons'
import { SetBarChart, type SetSlot } from '../../custom/charts/SetBarChart'
import { LIVE_STRIP_ZONE_TOKEN, type LiveStripRep, type LiveStripState } from './liveStripModel'

// The wall row is fixed (round 2 chose 72px); the phone form grows when a long title wraps.
const WALL_HEIGHT = 72
const PHONE_MIN_HEIGHT = 88

export type PinnedLiveStripLayout = 'wall' | 'phone'
export type PinnedLiveStripPhoneMeta = 'flow' | 'chevron' | 'pinned'

export interface PinnedLiveStripProps {
  /** `set` while reps are being logged, `rest` while the rest timer runs, `idle` renders nothing. */
  state: LiveStripState
  exerciseName: string
  /** In `set`, the set being lifted. In `rest`, the set that comes next. */
  setNumber: number
  setCount: number
  /** Pre-formatted load, e.g. "140 lb". */
  loadLabel?: string
  /** Performed reps of the current set (in `rest`, of the set just finished), zones from analytics. */
  reps: readonly LiveStripRep[]
  targetReps: number
  /** Analytics says the set has fatigued past its cut-off. Shown by the strip's edge and wash, never text. */
  isFatigued?: boolean
  /** `rest` only: time left and the rest's full length, in ms. */
  restRemainingMs?: number
  restDurationMs?: number
  /** Return to the live page. */
  onPress?: () => void
  /** Force a layout. Omitted: measured from the strip's own width. */
  layout?: PinnedLiveStripLayout
  /**
   * Phone title row, under review (VW-429 round 4): `flow` drops the set count under a title too
   * long to share its line; `chevron` pins only the chevron and hides the set count; `pinned` pins
   * set count and chevron. The unchosen values are removed after the pick.
   */
  phoneMeta?: PinnedLiveStripPhoneMeta
  className?: string
}

/** Below this container width the strip stacks into its phone form. */
export const PINNED_LIVE_STRIP_PHONE_MAX = 640

interface Scale {
  title: string
  sub: string
  hero: string
  heroUnit: string
  /** Fits both "12/12" and "0:00" at the hero size, so set and rest share one slot. */
  heroSlot: number
  velocity: string
  barHeight: number
  barPitch: number
}

// Type steps come from the tailwind scale; no Typography variant reaches the wall's numeral sizes.
const SCALES: Record<PinnedLiveStripLayout, Scale> = {
  wall: {
    title: 'text-xl',
    sub: 'text-base',
    hero: 'text-4xl',
    heroUnit: 'text-xl',
    heroSlot: 108,
    velocity: 'text-3xl',
    barHeight: 40,
    barPitch: 24,
  },
  phone: {
    title: 'text-base',
    sub: 'text-sm',
    hero: 'text-3xl',
    heroUnit: 'text-lg',
    heroSlot: 82,
    velocity: 'text-2xl',
    barHeight: 26,
    barPitch: 12,
  },
}

type Tone = 'live' | 'rest' | 'fatigue'

const LIVE_TAG = { dot: 'status-live', text: 'status-success', label: 'Live set' } as const

// Fatigue changes only the edge and the wash; its tag stays the live tag (VW-429 round 2).
const TONE = {
  live: { edge: 'status-live', tag: LIVE_TAG },
  rest: {
    edge: 'brand-primary',
    tag: { dot: 'brand-primary', text: 'status-warning', label: 'Resting' },
  },
  fatigue: { edge: 'status-error', tag: LIVE_TAG },
} as const

const NUMERAL = 'font-heading font-bold text-text-primary'
const UNIT = 'font-medium text-text-secondary'
const TABULAR = { fontVariant: ['tabular-nums' as const] }

type Parts = PinnedLiveStripProps & { scale: Scale; tone: Tone }

function toneOf(state: LiveStripState, isFatigued: boolean): Tone {
  if (state === 'rest') return 'rest'
  return isFatigued ? 'fatigue' : 'live'
}

function setLine(props: PinnedLiveStripProps, short: boolean): string {
  const { state, setNumber, setCount, loadLabel } = props
  const isRest = state === 'rest'
  if (short) return `${isRest ? 'Next' : 'Set'} ${setNumber}/${setCount}`
  const base = `${isRest ? 'Next: set' : 'Set'} ${setNumber} of ${setCount}`
  return loadLabel ? `${base} · ${loadLabel}` : base
}

function StateTag({ tone }: { tone: Tone }) {
  const t = TONE[tone].tag
  return (
    <View className="flex-row items-baseline gap-inline-sm" testID="live-strip-tag">
      <Indicator
        size="md"
        customColor={resolveColor(t.dot)}
        pulse={tone === 'rest' ? false : 'ping'}
        testID="live-strip-tag-dot"
      />
      <Typography variant="overline" style={{ color: resolveColor(t.text) }}>
        {t.label}
      </Typography>
    </View>
  )
}

function Title({ name, scale, lines }: { name: string; scale: Scale; lines: number }) {
  return (
    <Text
      testID="live-strip-title"
      numberOfLines={lines}
      className={cn('font-heading font-bold text-text-primary', scale.title)}
    >
      {name}
    </Text>
  )
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Typography variant="overline" color="tertiary">
        {label}
      </Typography>
      {children}
    </View>
  )
}

// Each column's LAST line (value, set line) sits on the bars' foot; Tailwind has no class for it.
const LAST_BASELINE = Platform.select<ViewStyle>({
  web: { alignItems: 'last baseline' as ViewStyle['alignItems'] },
  default: { alignItems: 'flex-end' },
})

function HeroNumeral({ state, reps, targetReps, restRemainingMs = 0, scale }: Parts) {
  const isRest = state === 'rest'
  // A fixed slot: switching set to rest must not move the velocity or the bars.
  return (
    <Text
      testID="live-strip-hero"
      className={cn(NUMERAL, scale.hero)}
      style={[TABULAR, { width: scale.heroSlot }]}
    >
      {isRest ? formatDuration(restRemainingMs) : reps.length}
      {isRest ? null : <Text className={cn(UNIT, scale.heroUnit)}>/{targetReps}</Text>}
    </Text>
  )
}

function Velocity({ reps, scale, showUnit }: Parts & { showUnit: boolean }) {
  const last = reps[reps.length - 1]
  if (!last) return null
  const color = resolveColor(LIVE_STRIP_ZONE_TOKEN[last.zone])
  return (
    <Text
      testID="live-strip-velocity"
      className={cn(NUMERAL, scale.velocity)}
      style={[TABULAR, { color }]}
    >
      {formatVelocity(last.velocity)}
      {showUnit ? <Text className={cn(UNIT, scale.heroUnit)}> m/s</Text> : null}
    </Text>
  )
}

function RepBars({ reps, targetReps, scale, fill }: Parts & { fill?: boolean }) {
  const slots: SetSlot[] = reps.map((rep) => ({ kind: 'rep', value: rep.velocity }))
  // Colour is looked up by rep, never derived from the value: the zone is analytics' call.
  const colorFor = (_value: number, repIndex: number) =>
    resolveColor(LIVE_STRIP_ZONE_TOKEN[reps[repIndex].zone])
  return (
    <View
      testID="live-strip-bars-frame"
      style={fill ? { flex: 1, minWidth: 0 } : { width: targetReps * scale.barPitch }}
    >
      <SetBarChart
        slots={slots}
        colorFor={colorFor}
        height={scale.barHeight}
        targetReps={targetReps}
        scale="fixed"
        barRadius={2}
        hideBaseline
        testID="live-strip-bars"
        testIDPrefix="live-strip"
      />
    </View>
  )
}

function BackToLive() {
  return (
    <View className="flex-row items-center gap-inline-sm rounded-lg bg-interactive-active px-control-x-md py-control-y-md">
      <Text className="font-heading text-lg font-bold text-text-primary">Back to live</Text>
      <ChevronRightIcon size={22} color={resolveColor('text-primary')} />
    </View>
  )
}

function WallRow(props: Parts) {
  const { state, setNumber, exerciseName, scale, tone } = props
  const isRest = state === 'rest'
  return (
    <View className="flex-1 flex-row items-center gap-section-md px-gutter-md">
      <View
        testID="live-strip-baseline-row"
        className="flex-1 flex-row gap-section-md"
        style={LAST_BASELINE}
      >
        <View className="flex-1 gap-stack-sm">
          <Title name={exerciseName} scale={scale} lines={1} />
          <View className="flex-row items-baseline gap-inline-lg">
            <StateTag tone={tone} />
            <Text className={cn('font-body text-text-secondary', scale.sub)}>
              {setLine(props, false)}
            </Text>
          </View>
        </View>
        <Labelled label={isRest ? 'Rest left' : 'Reps'}>
          <HeroNumeral {...props} />
        </Labelled>
        <Labelled label={isRest && setNumber > 1 ? `Last rep, set ${setNumber - 1}` : 'Last rep'}>
          <Velocity {...props} showUnit />
        </Labelled>
        <RepBars {...props} />
      </View>
      <BackToLive />
    </View>
  )
}

function PhoneMeta({ props, scale, showSet }: { props: Parts; scale: Scale; showSet: boolean }) {
  return (
    <View testID="live-strip-meta" className="shrink-0 flex-row items-center gap-inline-sm">
      {showSet ? (
        <Text className={cn('font-body text-text-secondary', scale.sub)}>
          {setLine(props, true)}
        </Text>
      ) : null}
      <ChevronRightIcon size={20} color={resolveColor('text-primary')} />
    </View>
  )
}

function PhoneTitleRow(props: Parts) {
  const { exerciseName, scale, phoneMeta = 'flow' } = props
  const isFlow = phoneMeta === 'flow'
  // flow wraps the meta group under the title only when both cannot share the line.
  return (
    <View
      testID="live-strip-title-row"
      className={cn(
        'flex-row gap-x-inline-lg',
        isFlow ? 'flex-wrap items-baseline' : 'items-start'
      )}
    >
      <View className={isFlow ? 'shrink grow' : 'flex-1'}>
        <Title name={exerciseName} scale={scale} lines={2} />
      </View>
      <PhoneMeta props={props} scale={scale} showSet={phoneMeta !== 'chevron'} />
    </View>
  )
}

function PhoneRows(props: Parts) {
  return (
    <View className="justify-center gap-stack-sm px-inset-md py-inset-sm">
      <PhoneTitleRow {...props} />
      <View testID="live-strip-baseline-row" className="flex-row items-baseline gap-inline-lg">
        <HeroNumeral {...props} />
        <Velocity {...props} showUnit={false} />
        <RepBars {...props} fill />
      </View>
    </View>
  )
}

function StripPlane({
  tone,
  isPhone,
  children,
}: {
  tone: Tone
  isPhone: boolean
  children: ReactNode
}) {
  return (
    <Surface
      elevation={4}
      rounded
      testID="live-strip-plane"
      className="overflow-hidden rounded-xl border-l-4"
      style={[
        { borderLeftColor: resolveColor(TONE[tone].edge) },
        isPhone ? { minHeight: PHONE_MIN_HEIGHT } : { height: WALL_HEIGHT },
      ]}
    >
      {tone === 'fatigue' ? (
        <View
          testID="live-strip-fatigue-wash"
          pointerEvents="none"
          className="absolute inset-0 bg-status-error-subtle"
        />
      ) : null}
      {children}
    </Surface>
  )
}

function RestBar({ restRemainingMs = 0, restDurationMs }: PinnedLiveStripProps) {
  if (!restDurationMs) return null
  return (
    <View className="absolute bottom-0 left-0 right-0" pointerEvents="none">
      <Progress
        value={restRemainingMs}
        max={restDurationMs}
        size="sm"
        accessibilityLabel="Rest remaining"
        testID="live-strip-rest-bar"
      />
    </View>
  )
}

function accessibleName(props: PinnedLiveStripProps): string {
  const { state, exerciseName, reps, targetReps, restRemainingMs = 0 } = props
  const progress =
    state === 'rest'
      ? `${formatDuration(restRemainingMs)} rest left`
      : `${reps.length} of ${targetReps} reps`
  return `Back to live: ${exerciseName}, ${setLine(props, false)}, ${progress}`
}

/**
 * Shell · PinnedLiveStrip (VW-429): the row pinned atop every non-live page while a set or rest
 * runs, so the lifter never loses the live set. The whole strip is the link back to live.
 * Zone colour is per-rep analytics data; fatigue is carried by the strip's edge and wash, never by
 * text, so the exercise title keeps its full width in every state.
 */
export function PinnedLiveStrip(props: PinnedLiveStripProps) {
  const { state, isFatigued = false, onPress, layout, className } = props
  const [measured, setMeasured] = useState<PinnedLiveStripLayout>('wall')
  if (state === 'idle') return null
  const isPhone = (layout ?? measured) === 'phone'
  const tone = toneOf(state, isFatigued)
  const scale = SCALES[isPhone ? 'phone' : 'wall']
  const onLayout = (e: LayoutChangeEvent) =>
    setMeasured(e.nativeEvent.layout.width < PINNED_LIVE_STRIP_PHONE_MAX ? 'phone' : 'wall')
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibleName(props)}
      onPress={onPress}
      onLayout={onLayout}
      testID="pinned-live-strip"
      className={cn('w-full', className)}
    >
      <StripPlane tone={tone} isPhone={isPhone}>
        {isPhone ? (
          <PhoneRows {...props} scale={scale} tone={tone} />
        ) : (
          <WallRow {...props} scale={scale} tone={tone} />
        )}
        {state === 'rest' ? <RestBar {...props} /> : null}
      </StripPlane>
    </Pressable>
  )
}
