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
import { formatVelocity } from '../../../utils/workout-format'
import { Surface } from '../../ui/surface'
import { Indicator } from '../../ui/indicator'
import { Progress } from '../../ui/progress'
import { Typography } from '../../custom/Typography'
import { ChevronRightIcon } from '../../icons'
import { SetBarChart, type SetSlot } from '../../custom/charts/SetBarChart'
import {
  normalizeLossThresholds,
  type VelocityLossThresholds,
} from '../../custom/Workout/VelocityStrip'
import {
  liveStripMs,
  liveStripRepToken,
  liveStripRestReadout,
  liveStripTarget,
  type LiveStripBarColor,
  type LiveStripRep,
  type LiveStripState,
} from './liveStripModel'

// The wall row is fixed (round 2 chose 72px); the phone form grows when a long title wraps.
const WALL_HEIGHT = 72
const PHONE_MIN_HEIGHT = 88

export type PinnedLiveStripLayout = 'wall' | 'phone'

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
  /** `loss` (default) colours each bar by its loss from the set's best, as the live hero does; `zone` by the rep's zone. */
  barColor?: LiveStripBarColor
  /** `loss` only: loss (%) where bars turn yellow, orange and red. Pass the hero's thresholds so both agree. Default 10/20/30, as the hero. */
  lossThresholds?: VelocityLossThresholds
  /** Analytics says the set has fatigued past its cut-off. Shown by the strip's edge and wash, never text. */
  isFatigued?: boolean
  /** `rest` only: time left and the rest's full length, in ms. */
  restRemainingMs?: number
  restDurationMs?: number
  /** Return to the live page. */
  onPress?: () => void
  /** Force a layout. Omitted: measured from the strip's own width. */
  layout?: PinnedLiveStripLayout
  className?: string
}

/** Below this container width the strip stacks into its phone form. */
export const PINNED_LIVE_STRIP_PHONE_MAX = 640

interface Scale {
  title: string
  sub: string
  hero: string
  heroUnit: string
  /** The hero's font size in px, for centring the reduced rest digits. */
  heroPx: number
  /** Rest seconds from 100s: one smaller step, centred on the full-size digits (VW-429 round 7). */
  reducedRest: { size: string; unit: string; px: number }
  /** Fits "99s" at full size and "999s" at the reduced size (measured: 83 / 71px). */
  secondsSlot: number
  /** Gap between numeral, velocity and bars. */
  valueGap: string
  /** Line-height for the numerals: the wall drops the leading so its overline row fits above them. */
  leading: string
  /** Slot widths (px) measured in the heading face for the rep count, by digits. */
  slot: { oneDigitReps: number; twoDigitReps: number }
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
    heroPx: 48,
    reducedRest: { size: 'text-3xl', unit: 'text-lg', px: 36 },
    secondsSlot: 83,
    valueGap: 'gap-section-md',
    leading: 'leading-none',
    slot: { oneDigitReps: 56, twoDigitReps: 101 },
    velocity: 'text-3xl',
    barHeight: 48,
    barPitch: 24,
  },
  phone: {
    title: 'text-base',
    sub: 'text-sm',
    hero: 'text-3xl',
    heroUnit: 'text-lg',
    heroPx: 36,
    reducedRest: { size: 'text-2xl', unit: 'text-base', px: 32 },
    secondsSlot: 71,
    valueGap: 'gap-inline-md',
    leading: '',
    slot: { oneDigitReps: 43, twoDigitReps: 76 },
    velocity: 'text-2xl',
    barHeight: 32,
    barPitch: 12,
  },
}

// Digit ink spans 0.714em above the baseline to 0.014em below it, so its centre sits 0.35em up.
const DIGIT_INK_CENTRE_EM = 0.35

const layoutOf = (scale: Scale): PinnedLiveStripLayout =>
  scale === SCALES.phone ? 'phone' : 'wall'

/** The rest readout's type: seconds, their size and unit classes, and the raise that centres them. */
export function liveStripRestType(layout: PinnedLiveStripLayout, remainingMs: number | undefined) {
  const scale = SCALES[layout]
  const { seconds, step } = liveStripRestReadout(remainingMs)
  if (step === 'full') return { seconds, size: scale.hero, unit: scale.heroUnit, raisePx: 0 }
  const { size, unit, px } = scale.reducedRest
  return { seconds, size, unit, raisePx: DIGIT_INK_CENTRE_EM * (scale.heroPx - px) }
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

function Overline({ label, width }: { label: string; width?: number }) {
  return (
    <View style={width != null ? { width } : null}>
      <Typography variant="overline" color="tertiary" className="leading-none" numberOfLines={1}>
        {label}
      </Typography>
    </View>
  )
}

/** The wall's readouts: one overline row above one numeral row, so both labels share a line. */
function WallValues(props: Parts) {
  const { state, setNumber, scale } = props
  const isRest = state === 'rest'
  return (
    // No gap: the numerals' own leading spaces them from the overlines.
    <View testID="live-strip-values">
      <View testID="live-strip-overlines" className={cn('flex-row', scale.valueGap)}>
        <Overline label={isRest ? 'Rest left' : 'Reps'} width={heroSlotWidth(props)} />
        <Overline label={isRest && setNumber > 1 ? `Last rep, set ${setNumber - 1}` : 'Last rep'} />
      </View>
      <View className={cn('flex-row', scale.valueGap)} style={LAST_BASELINE}>
        <HeroNumeral {...props} />
        <Velocity {...props} showUnit />
      </View>
    </View>
  )
}

// Each column's LAST line (value, set line) sits on the bars' foot; Tailwind has no class for it.
const LAST_BASELINE = Platform.select<ViewStyle>({
  web: { alignItems: 'last baseline' as ViewStyle['alignItems'] },
  default: { alignItems: 'flex-end' },
})

// One width for the whole set and its rest: a long rest steps its type down rather than widen it.
function heroSlotWidth({ reps, targetReps, scale }: Parts): number {
  const twoDigits = Math.max(reps.length, targetReps) >= 10
  return Math.max(twoDigits ? scale.slot.twoDigitReps : scale.slot.oneDigitReps, scale.secondsSlot)
}

function HeroValue({ state, reps, targetReps, scale, restRemainingMs }: Parts) {
  if (state !== 'rest') {
    return (
      <Text testID="live-strip-hero-value">
        {reps.length}
        {targetReps > 0 ? (
          <Text className={cn(UNIT, scale.heroUnit, scale.leading)}>/{targetReps}</Text>
        ) : null}
      </Text>
    )
  }
  const { seconds, size, unit, raisePx } = liveStripRestType(layoutOf(scale), restRemainingMs)
  return (
    <Text
      testID="live-strip-hero-value"
      style={raisePx ? { position: 'relative', top: -raisePx } : null}
    >
      <Text className={cn(size, scale.leading)}>{seconds}</Text>
      <Text className={cn(UNIT, unit, scale.leading)}>s</Text>
    </Text>
  )
}

function HeroNumeral(props: Parts) {
  // The outer text keeps the full size so its line box, and so the row's baseline, never moves.
  return (
    <Text
      testID="live-strip-hero"
      numberOfLines={1}
      className={cn(NUMERAL, props.scale.hero, props.scale.leading)}
      style={[TABULAR, { width: heroSlotWidth(props) }]}
    >
      <HeroValue {...props} />
    </Text>
  )
}

function Velocity({
  reps,
  scale,
  showUnit,
  barColor,
  lossThresholds,
}: Parts & { showUnit: boolean }) {
  const last = reps[reps.length - 1]
  if (!last) return null
  const color = resolveColor(liveStripRepToken(reps, reps.length - 1, barColor, lossThresholds))
  return (
    <Text
      testID="live-strip-velocity"
      className={cn(NUMERAL, scale.velocity, scale.leading)}
      style={[TABULAR, { color }]}
    >
      {formatVelocity(last.velocity)}
      {showUnit ? <Text className={cn(UNIT, scale.heroUnit, scale.leading)}> m/s</Text> : null}
    </Text>
  )
}

function RepBars(props: Parts & { fill?: boolean }) {
  const { reps, targetReps, scale, fill, barColor, lossThresholds } = props
  const slots: SetSlot[] = reps.map((rep) => ({ kind: 'rep', value: rep.velocity }))
  // Without a plan the frame is as wide as the reps done, so the bars never collapse to nothing.
  const columns = targetReps > 0 ? targetReps : reps.length
  // Colour is looked up by rep index, so zone mode uses analytics' zone and never the value.
  const colorFor = (_value: number, repIndex: number) =>
    resolveColor(liveStripRepToken(reps, repIndex, barColor, lossThresholds))
  return (
    <View
      testID="live-strip-bars-frame"
      style={fill ? { flex: 1, minWidth: 0 } : { width: columns * scale.barPitch }}
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
  const { exerciseName, scale, tone } = props
  return (
    <View className="flex-1 flex-row items-center gap-section-md px-gutter-md">
      <View
        testID="live-strip-baseline-row"
        className={cn('flex-1 flex-row', scale.valueGap)}
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
        <WallValues {...props} />
        <RepBars {...props} />
      </View>
      <BackToLive />
    </View>
  )
}

function PhoneTitleRow(props: Parts) {
  const { exerciseName, scale } = props
  // The set count and chevron stay pinned top right; the title wraps in the width left over.
  return (
    <View testID="live-strip-title-row" className="flex-row items-start gap-inline-lg">
      <View className="flex-1">
        <Title name={exerciseName} scale={scale} lines={2} />
      </View>
      <View testID="live-strip-meta" className="shrink-0 flex-row items-center gap-inline-sm">
        <Text className={cn('font-body text-text-secondary', scale.sub)}>
          {setLine(props, true)}
        </Text>
        <ChevronRightIcon size={20} color={resolveColor('text-primary')} />
      </View>
    </View>
  )
}

function PhoneRows(props: Parts) {
  return (
    <View className="justify-center gap-stack-sm px-inset-md py-inset-sm">
      <PhoneTitleRow {...props} />
      <View
        testID="live-strip-baseline-row"
        className={cn('flex-row items-baseline', props.scale.valueGap)}
      >
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

function RestBar({ restRemainingMs, restDurationMs }: PinnedLiveStripProps) {
  const max = liveStripMs(restDurationMs)
  if (max === 0) return null
  return (
    <View className="absolute bottom-0 left-0 right-0" pointerEvents="none">
      <Progress
        value={Math.min(max, liveStripMs(restRemainingMs))}
        max={max}
        size="sm"
        accessibilityLabel="Rest remaining"
        testID="live-strip-rest-bar"
      />
    </View>
  )
}

function accessibleName(props: PinnedLiveStripProps): string {
  const { state, exerciseName, reps, targetReps, restRemainingMs } = props
  const progress =
    state === 'rest'
      ? `${liveStripRestReadout(restRemainingMs).seconds} seconds rest left`
      : targetReps > 0
        ? `${reps.length} of ${targetReps} reps`
        : `${reps.length} reps`
  return `Back to live: ${exerciseName}, ${setLine(props, false)}, ${progress}`
}

/**
 * Shell · PinnedLiveStrip (VW-429): the row pinned atop every non-live page while a set or rest
 * runs, so the lifter never loses the live set. The whole strip is the link back to live.
 * Bars colour by loss from the set's best like the live hero (or by per-rep zone); fatigue is carried
 * by the strip's edge and wash, never by text, so the exercise title keeps its full width in every state.
 */
export function PinnedLiveStrip(props: PinnedLiveStripProps) {
  const { state, isFatigued = false, onPress, layout, className } = props
  const [measured, setMeasured] = useState<PinnedLiveStripLayout>('wall')
  if (state === 'idle') return null
  const isPhone = (layout ?? measured) === 'phone'
  const tone = toneOf(state, isFatigued)
  const scale = SCALES[isPhone ? 'phone' : 'wall']
  const parts = {
    ...props,
    targetReps: liveStripTarget(props.targetReps),
    lossThresholds: normalizeLossThresholds(props.lossThresholds),
    scale,
    tone,
  }
  const onLayout = (e: LayoutChangeEvent) =>
    setMeasured(e.nativeEvent.layout.width < PINNED_LIVE_STRIP_PHONE_MAX ? 'phone' : 'wall')
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibleName(parts)}
      onPress={onPress}
      onLayout={onLayout}
      testID="pinned-live-strip"
      className={cn('w-full', className)}
    >
      <StripPlane tone={tone} isPhone={isPhone}>
        {isPhone ? <PhoneRows {...parts} /> : <WallRow {...parts} />}
        {state === 'rest' ? <RestBar {...props} /> : null}
      </StripPlane>
    </Pressable>
  )
}
