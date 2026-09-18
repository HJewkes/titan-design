// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactNode } from 'react'
import { View, Text, Pressable, type LayoutChangeEvent } from 'react-native'
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

export type PinnedLiveStripLayout = 'wall' | 'phone'
export type PinnedLiveStripWallSize = 'standard' | 'trimmed'

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
  /** Analytics says the set has fatigued past its cut-off. Shown by colour only, never text. */
  isFatigued?: boolean
  /** `rest` only: time left and the rest's full length, in ms. */
  restRemainingMs?: number
  restDurationMs?: number
  /** Return to the live page. */
  onPress?: () => void
  /** Force a layout. Omitted: measured from the strip's own width. */
  layout?: PinnedLiveStripLayout
  /** Wall row height: `standard` 88px (the round-1 pick) or `trimmed` 72px. */
  wallSize?: PinnedLiveStripWallSize
  className?: string
}

/** Below this container width the strip stacks into its two-line phone form. */
export const PINNED_LIVE_STRIP_PHONE_MAX = 640

interface Scale {
  height: number
  title: string
  sub: string
  hero: string
  heroUnit: string
  velocity: string
  barHeight: number
  barPitch: number
}

// Type steps come from the tailwind scale; no Typography variant reaches the wall's numeral sizes.
const SCALES: Record<PinnedLiveStripWallSize | 'phone', Scale> = {
  standard: {
    height: 88,
    title: 'text-2xl',
    sub: 'text-lg',
    hero: 'text-5xl',
    heroUnit: 'text-2xl',
    velocity: 'text-4xl',
    barHeight: 60,
    barPitch: 28,
  },
  trimmed: {
    height: 72,
    title: 'text-xl',
    sub: 'text-base',
    hero: 'text-4xl',
    heroUnit: 'text-xl',
    velocity: 'text-3xl',
    barHeight: 48,
    barPitch: 24,
  },
  phone: {
    height: 88,
    title: 'text-lg',
    sub: 'text-sm',
    hero: 'text-3xl',
    heroUnit: 'text-lg',
    velocity: 'text-2xl',
    barHeight: 30,
    barPitch: 12,
  },
}

type Tone = 'live' | 'rest' | 'fatigue'

const TONE = {
  live: { border: 'border-status-live', dot: 'live', text: 'success', label: 'Live set' },
  rest: { border: 'border-brand-primary', dot: 'primary', text: 'warning', label: 'Resting' },
  fatigue: { border: 'border-status-error', dot: 'error', text: 'error', label: 'Live set' },
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
  const t = TONE[tone]
  return (
    <View className="flex-row items-center gap-inline-sm" testID="live-strip-tag">
      <Indicator size="md" color={t.dot} pulse={tone === 'rest' ? false : 'ping'} />
      <Typography variant="overline" color={t.text}>
        {t.label}
      </Typography>
    </View>
  )
}

function Title({ name, scale, grow }: { name: string; scale: Scale; grow?: boolean }) {
  return (
    <Text
      testID="live-strip-title"
      numberOfLines={1}
      className={cn('font-heading font-bold text-text-primary', scale.title, grow && 'flex-1')}
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

function HeroNumeral({ state, reps, targetReps, restRemainingMs = 0, scale }: Parts) {
  const isRest = state === 'rest'
  return (
    <Text testID="live-strip-hero" className={cn(NUMERAL, scale.hero)} style={TABULAR}>
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
    <View style={fill ? { flex: 1 } : { width: targetReps * scale.barPitch }}>
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
      <View className="flex-1 gap-stack-sm">
        <Title name={exerciseName} scale={scale} />
        <View className="flex-row items-center gap-inline-lg">
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
      <BackToLive />
    </View>
  )
}

function PhoneRows(props: Parts) {
  const { exerciseName, scale } = props
  return (
    <View className="flex-1 justify-center gap-stack-sm px-inset-lg">
      <View className="flex-row items-center gap-inline-lg">
        <Title name={exerciseName} scale={scale} grow />
        <Text className={cn('font-body text-text-secondary', scale.sub)}>
          {setLine(props, true)}
        </Text>
        <ChevronRightIcon size={20} color={resolveColor('text-primary')} />
      </View>
      <View className="flex-row items-end gap-inline-lg">
        <HeroNumeral {...props} />
        <Velocity {...props} showUnit={false} />
        <RepBars {...props} fill />
      </View>
    </View>
  )
}

function StripPlane({
  tone,
  height,
  children,
}: {
  tone: Tone
  height: number
  children: ReactNode
}) {
  return (
    <Surface
      elevation={4}
      rounded
      testID="live-strip-plane"
      className={cn('overflow-hidden rounded-xl border-l-4', TONE[tone].border)}
      style={{ height }}
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
 * Zone colour is per-rep analytics data; fatigue is carried by the strip colour and the bars,
 * never by text, so the exercise title keeps its full width in every state.
 */
export function PinnedLiveStrip(props: PinnedLiveStripProps) {
  const { state, isFatigued = false, onPress, layout, wallSize = 'standard', className } = props
  const [measured, setMeasured] = useState<PinnedLiveStripLayout>('wall')
  if (state === 'idle') return null
  const isPhone = (layout ?? measured) === 'phone'
  const tone = toneOf(state, isFatigued)
  const scale = SCALES[isPhone ? 'phone' : wallSize]
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
      <StripPlane tone={tone} height={scale.height}>
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
