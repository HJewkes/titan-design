// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { memo, type ReactNode } from 'react'
import { View, Text, Pressable } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { formatVelocity } from '../../../utils/workout-format'
import { ChevronRightIcon } from '../../icons'
import { Typography } from '../../ui/typography'
import {
  DualVelocityStrip,
  normalizeLossThresholds,
  type VelocityLossThresholds,
} from '../../custom/Workout/VelocityStrip'
import {
  liveStripRepToken,
  liveStripRestReadout,
  liveStripTarget,
  type LiveStripBarColor,
  type LiveStripRep,
  type LiveStripState,
} from './liveStripModel'
import {
  BackToLive,
  liveStripRestType,
  RestBar,
  SCALES,
  setLine,
  StateTag,
  StripPlane,
  Title,
  TONE,
  useStripLayout,
  type PinnedLiveStripLayout,
  type Tone,
} from './pinnedLiveStripParts'

/** One Voltra's side of the strip. */
export interface LiveStripSlot {
  /** The name the lifter gave this Voltra on connection. Omitted or blank: the side, "Left" or "Right". */
  label?: string
  /** Pre-formatted load on this side, e.g. "140 lb". */
  loadLabel?: string
  /** This side's reps of the current set (in `rest`, of the set just finished). Default `[]`. */
  reps?: readonly LiveStripRep[]
  /** Marks this side during a set. Not shown in `rest`. */
  isFatigued?: boolean
  /**
   * `false` once this Voltra has dropped mid-session. A slot bound to a Voltra passes the device's
   * connected state; omitted reads as connected, so pass `false` only for a bound Voltra that dropped.
   */
  isConnected?: boolean
}

export interface DualPinnedLiveStripProps {
  state: LiveStripState
  exerciseName: string
  setNumber: number
  setCount: number
  targetReps: number
  barColor?: LiveStripBarColor
  lossThresholds?: VelocityLossThresholds
  restRemainingMs?: number
  restDurationMs?: number
  onPress?: () => void
  layout?: PinnedLiveStripLayout
  className?: string
  /** The left Voltra. Omitted while the slot is not yet bound: an empty side named "Left". */
  left?: LiveStripSlot
  /** The right Voltra. Omitted while the slot is not yet bound: an empty side named "Right". */
  right?: LiveStripSlot
}

type Side = 'left' | 'right'

interface SlotView {
  side: Side
  name: string
  loadLabel?: string
  reps: readonly LiveStripRep[]
  isDropped: boolean
  /** Fatigued during a set: the side the strip singles out. */
  isMarked: boolean
}

interface Sizes {
  reps: string
  unit: string
  velocity: string
  /** Both lanes; each lane is half. */
  chart: number
  gap: string
}

// The wall holds the single strip's 72px row; the phone row grows to fit.
const SIZES: Record<PinnedLiveStripLayout, Sizes> = {
  wall: {
    reps: 'text-2xl',
    unit: 'text-base',
    velocity: 'text-xl',
    chart: 64,
    gap: 'gap-section-sm',
  },
  phone: { reps: 'text-xl', unit: 'text-sm', velocity: 'text-lg', chart: 64, gap: 'gap-inline-lg' },
}

const BAR_PITCH = { wall: 24, phone: 10 }
const NUMERAL = 'font-heading font-bold leading-none'
const UNIT = 'font-medium text-text-secondary leading-none'
const TABULAR = { fontVariant: ['tabular-nums' as const] }

type Parts = Omit<DualPinnedLiveStripProps, 'left' | 'right'> & {
  layout: PinnedLiveStripLayout
  slots: readonly [SlotView, SlotView]
  sizes: Sizes
  tone: Tone
  isLink: boolean
  lossThresholds: VelocityLossThresholds
}

const SIDE_NAME: Record<Side, string> = { left: 'Left', right: 'Right' }
const NO_REPS: readonly LiveStripRep[] = []

function slotView(side: Side, slot: LiveStripSlot = {}, state: LiveStripState): SlotView {
  const isDropped = slot.isConnected === false
  return {
    side,
    name: slot.label?.trim() || SIDE_NAME[side],
    loadLabel: slot.loadLabel,
    reps: slot.reps ?? NO_REPS,
    isDropped,
    isMarked: state === 'set' && !isDropped && slot.isFatigued === true,
  }
}

function slotColor(slot: SlotView): string {
  if (slot.isDropped) return resolveColor('text-tertiary')
  if (slot.isMarked) return resolveColor('status-error')
  return resolveColor('text-secondary')
}

/** Wall only: "name · load". The phone has no room; position carries the side. */
function SlotName({ slot }: { slot: SlotView }) {
  const text = slot.loadLabel ? `${slot.name} · ${slot.loadLabel}` : slot.name
  return (
    <Typography
      variant="overline"
      numberOfLines={1}
      style={{ color: slotColor(slot) }}
      testID={`dual-strip-name-${slot.side}`}
    >
      {text}
    </Typography>
  )
}

function SlotReps({ slot, parts }: { slot: SlotView; parts: Parts }) {
  const { sizes, targetReps } = parts
  const color = resolveColor(slot.isDropped ? 'text-tertiary' : 'text-primary')
  return (
    <Text
      testID={`dual-strip-reps-${slot.side}`}
      className={cn(NUMERAL, sizes.reps)}
      style={[TABULAR, { color }]}
    >
      {slot.reps.length}
      {targetReps > 0 ? <Text className={cn(UNIT, sizes.unit)}>/{targetReps}</Text> : null}
    </Text>
  )
}

/** The last rep's velocity, or `null` when there is none or it is not a finite number. */
function lastVelocity(slot: SlotView): number | null {
  const last = slot.reps[slot.reps.length - 1]
  return last && Number.isFinite(last.velocity) ? last.velocity : null
}

function SlotVelocity({ slot, parts }: { slot: SlotView; parts: Parts }) {
  const velocity = lastVelocity(slot)
  if (velocity == null) return <Text className={cn(NUMERAL, parts.sizes.velocity)}> </Text>
  const token = slot.isDropped
    ? 'text-tertiary'
    : liveStripRepToken(slot.reps, slot.reps.length - 1, parts.barColor, parts.lossThresholds)
  return (
    <Text
      testID={`dual-strip-velocity-${slot.side}`}
      className={cn(NUMERAL, parts.sizes.velocity)}
      style={[TABULAR, { color: resolveColor(token) }]}
    >
      {formatVelocity(velocity)}
      {parts.layout === 'wall' ? <Text className={cn(UNIT, parts.sizes.unit)}> m/s</Text> : null}
    </Text>
  )
}

/** One countdown for the session, in the rep counts' place; the Resting tag already names it. */
function RestReadout(parts: Parts) {
  const { seconds, size, unit, raisePx } = liveStripRestType(parts.layout, parts.restRemainingMs)
  const scale = SCALES[parts.layout]
  return (
    <View testID="dual-strip-rest" className="justify-center">
      <Text
        testID="live-strip-hero"
        className={cn(NUMERAL, 'text-text-primary', scale.hero)}
        style={[TABULAR, raisePx ? { position: 'relative', top: -raisePx } : null]}
      >
        <Text className={size}>{seconds}</Text>
        <Text className={cn(UNIT, unit)}>s</Text>
      </Text>
    </View>
  )
}

/**
 * Left above Right, column by column so the numerals align, beside one chart. In rest the one
 * countdown takes the columns' place: rest is the session's, not a side's.
 */
function Lanes(parts: Parts) {
  const { slots, sizes } = parts
  const laneHeight = sizes.chart / 2
  const isPhone = parts.layout === 'phone'
  const column = (cell: (slot: SlotView) => ReactNode, key: string) => (
    <View key={key} className="shrink-0">
      {slots.map((slot) => (
        <View key={slot.side} className="justify-center" style={{ height: laneHeight }}>
          {cell(slot)}
        </View>
      ))}
    </View>
  )
  return (
    <View
      testID="dual-strip-lanes"
      className={cn('flex-row items-center', sizes.gap, isPhone ? 'min-w-0 flex-1' : 'px-inset-xs')}
    >
      {parts.state === 'rest' ? (
        <RestReadout {...parts} />
      ) : (
        <>
          {isPhone ? null : column((slot) => <SlotName slot={slot} />, 'name')}
          {column(
            (slot) => (
              <SlotReps slot={slot} parts={parts} />
            ),
            'reps'
          )}
          {column(
            (slot) => (
              <SlotVelocity slot={slot} parts={parts} />
            ),
            'velocity'
          )}
        </>
      )}
      <DualBars {...barsOf(parts, isPhone)} />
    </View>
  )
}

interface DualBarsProps {
  left: readonly LiveStripRep[]
  right: readonly LiveStripRep[]
  targetReps: number
  height: number
  /** Wall: a fixed width from the rep count. Phone: fills the row, never below `minWidth`. */
  width?: number
  minWidth?: number
  barColor?: LiveStripBarColor
  lossThresholds: VelocityLossThresholds
  dimmed?: Side
}

const sameReps = (a: readonly LiveStripRep[], b: readonly LiveStripRep[]) =>
  a === b || (a.length === b.length && a.every((rep, i) => rep.velocity === b[i].velocity))

// The rest countdown ticks once a second; the bars depend on none of it.
function sameBars(a: DualBarsProps, b: DualBarsProps): boolean {
  return (
    sameReps(a.left, b.left) &&
    sameReps(a.right, b.right) &&
    a.targetReps === b.targetReps &&
    a.height === b.height &&
    a.width === b.width &&
    a.minWidth === b.minWidth &&
    a.barColor === b.barColor &&
    a.dimmed === b.dimmed &&
    a.lossThresholds.every((t, i) => t === b.lossThresholds[i])
  )
}

const DualBars = memo(function DualBars(props: DualBarsProps) {
  const { left, right, targetReps, height, width, minWidth, dimmed } = props
  // The strip's own accessible name already reads every count; the chart's labels would repeat it.
  return (
    <View testID="dual-strip-bars-frame" aria-hidden style={width != null ? { width } : { flex: 1, minWidth }}>
      <DualVelocityStrip
        left={{ velocities: left.map((r) => r.velocity), isDimmed: dimmed === 'left' }}
        right={{ velocities: right.map((r) => r.velocity), isDimmed: dimmed === 'right' }}
        variant="dual-expanded"
        scale="fixed"
        barColor={props.barColor}
        lossThresholds={props.lossThresholds}
        targetReps={targetReps}
        height={height}
      />
    </View>
  )
}, sameBars)

function barsOf(parts: Parts, fill = false): DualBarsProps {
  const [left, right] = parts.slots
  const columns =
    parts.targetReps > 0 ? parts.targetReps : Math.max(left.reps.length, right.reps.length)
  const span = Math.max(columns, 1) * BAR_PITCH[parts.layout]
  return {
    left: left.reps,
    right: right.reps,
    targetReps: parts.targetReps,
    height: parts.sizes.chart,
    width: fill ? undefined : span,
    minWidth: fill ? span : undefined,
    barColor: parts.barColor,
    lossThresholds: parts.lossThresholds,
    dimmed: parts.slots.find((s) => s.isDropped)?.side,
  }
}

function TitleBlock(parts: Parts) {
  const scale = SCALES.wall
  return (
    <View className="flex-1 gap-stack-sm">
      <Title name={parts.exerciseName} scale={scale} lines={1} />
      <View className="flex-row items-baseline gap-inline-lg">
        <StateTag tone={parts.tone} />
        <Text className={cn('font-body text-text-secondary', scale.sub)}>
          {setLine(parts, false)}
        </Text>
      </View>
    </View>
  )
}

function WallRow(parts: Parts) {
  return (
    <View className="flex-1 flex-row items-center gap-section-md px-gutter-md">
      <TitleBlock {...parts} />
      <Lanes {...parts} />
      {parts.isLink ? <BackToLive /> : null}
    </View>
  )
}

function PhoneTitleRow(parts: Parts) {
  const scale = SCALES.phone
  return (
    <View testID="live-strip-title-row" className="flex-row items-start gap-inline-lg">
      <View className="flex-1">
        <Title name={parts.exerciseName} scale={scale} lines={2} />
      </View>
      <View className="shrink-0 flex-row items-center gap-inline-sm">
        <Text className={cn('font-body text-text-secondary', scale.sub)}>
          {setLine(parts, true)}
        </Text>
        {parts.isLink ? <ChevronRightIcon size={20} color={resolveColor('text-primary')} /> : null}
      </View>
    </View>
  )
}

function PhoneRows(parts: Parts) {
  return (
    <View className="justify-center gap-stack-sm px-inset-md py-inset-sm">
      <PhoneTitleRow {...parts} />
      <Lanes {...parts} />
    </View>
  )
}

function slotPhrase(slot: SlotView, parts: Parts): string {
  const velocity = lastVelocity(slot)
  const count =
    parts.state === 'rest'
      ? null
      : parts.targetReps > 0
        ? `${slot.reps.length} of ${parts.targetReps} reps`
        : `${slot.reps.length} reps`
  return [
    slot.name,
    slot.loadLabel,
    count,
    velocity == null ? null : `last rep ${formatVelocity(velocity)} m/s`,
    slot.isDropped ? 'disconnected' : null,
    slot.isMarked ? 'fatigued' : null,
  ]
    .filter(Boolean)
    .join(' ')
}

function accessibleName(parts: Parts): string {
  const rest =
    parts.state === 'rest'
      ? `${liveStripRestReadout(parts.restRemainingMs).seconds} seconds rest left`
      : null
  const summary = [
    TONE[parts.tone].tag.label,
    parts.exerciseName,
    setLine(parts, false),
    rest,
    ...parts.slots.map((slot) => slotPhrase(slot, parts)),
  ]
    .filter(Boolean)
    .join(', ')
  return parts.isLink ? `Back to live: ${summary}` : summary
}

function Plane(parts: Parts) {
  const isPhone = parts.layout === 'phone'
  return (
    <StripPlane tone={parts.tone} isPhone={isPhone}>
      {isPhone ? <PhoneRows {...parts} /> : <WallRow {...parts} />}
      {parts.state === 'rest' ? <RestBar {...parts} /> : null}
    </StripPlane>
  )
}

function toneOf(state: LiveStripState, slots: readonly SlotView[]): Tone {
  if (state === 'rest') return 'rest'
  return slots.some((s) => s.isMarked) ? 'fatigue' : 'live'
}

function partsOf(props: DualPinnedLiveStripProps, layout: PinnedLiveStripLayout): Parts {
  const slots = [
    slotView('left', props.left, props.state),
    slotView('right', props.right, props.state),
  ] as const
  return {
    ...props,
    layout,
    slots,
    sizes: SIZES[layout],
    tone: toneOf(props.state, slots),
    isLink: props.onPress != null,
    targetReps: liveStripTarget(props.targetReps),
    lossThresholds: normalizeLossThresholds(props.lossThresholds),
  }
}

/**
 * Shell · DualPinnedLiveStrip (VW-439): the pinned live strip for a two-Voltra session. Exercise,
 * set and rest are drawn once; each side's reps, velocity and bars are drawn per side in lanes (left
 * above right) beside one diverging chart. The wall adds each side's name and load; the phone marks
 * the sides by position. Rest is one countdown beside the finished set's chart. A fatigued side
 * reddens the strip and its name; a dropped side stays, its wing faded.
 */
export function DualPinnedLiveStrip(props: DualPinnedLiveStripProps) {
  const { layout: measured, onLayout, ref } = useStripLayout(props.layout)
  if (props.state === 'idle') return null
  const parts = partsOf(props, measured ?? 'wall')
  const frame = {
    ref,
    accessibilityLabel: accessibleName(parts),
    onLayout,
    testID: 'dual-pinned-live-strip',
    className: cn('w-full', props.className),
  }
  const plane = measured ? <Plane {...parts} /> : null
  return props.onPress ? (
    <Pressable accessibilityRole="link" onPress={props.onPress} {...frame}>
      {plane}
    </Pressable>
  ) : (
    <View accessible accessibilityRole="summary" {...frame}>
      {plane}
    </View>
  )
}
