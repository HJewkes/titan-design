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
import { PinnedLiveStrip } from './PinnedLiveStrip'
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
  Overline,
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
  /** This side's reps of the current set (in `rest`, of the set just finished). */
  reps: readonly LiveStripRep[]
  isFatigued?: boolean
  /** `false` once this Voltra has dropped mid-session. */
  isConnected?: boolean
}

/** Round 1 only (VW-439): the variant props the harden slice deletes. */
export type DualStripArrangement = 'lanes' | 'side-by-side'
export type DualStripFatigueMark = 'strip' | 'slot'
export type DualStripDropMode = 'single' | 'dimmed'
export type DualStripWallHeight = 'natural' | 'fixed'

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
  left: LiveStripSlot
  right: LiveStripSlot
  arrangement?: DualStripArrangement
  fatigueMark?: DualStripFatigueMark
  dropMode?: DualStripDropMode
  wallHeight?: DualStripWallHeight
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
  chart: number
  /** Name above load (true) or "name · load" on one line. */
  stacked: boolean
  /** Phone lanes: the name column's cap, past which a long Voltra name truncates. */
  nameMax?: number
}

// Lanes trade numeral size for height; side by side keeps the single strip's numeral row.
const SIZES: Record<DualStripArrangement, Record<DualStripWallHeight | 'phone', Sizes>> = {
  lanes: {
    fixed: { reps: 'text-2xl', unit: 'text-base', velocity: 'text-xl', chart: 56, stacked: false },
    natural: { reps: 'text-3xl', unit: 'text-lg', velocity: 'text-2xl', chart: 88, stacked: true },
    phone: {
      reps: 'text-xl',
      unit: 'text-sm',
      velocity: 'text-lg',
      chart: 64,
      stacked: true,
      nameMax: 80,
    },
  },
  'side-by-side': {
    fixed: { reps: 'text-3xl', unit: 'text-lg', velocity: 'text-2xl', chart: 48, stacked: false },
    natural: { reps: 'text-4xl', unit: 'text-xl', velocity: 'text-3xl', chart: 64, stacked: true },
    phone: { reps: 'text-xl', unit: 'text-sm', velocity: 'text-lg', chart: 40, stacked: true },
  },
}

const BAR_PITCH = { wall: 24, phone: 12 }
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

function slotView(side: Side, slot: LiveStripSlot, state: LiveStripState): SlotView {
  const isDropped = slot.isConnected === false
  return {
    side,
    name: slot.label?.trim() || SIDE_NAME[side],
    loadLabel: slot.loadLabel,
    reps: slot.reps,
    isDropped,
    isMarked: state === 'set' && !isDropped && slot.isFatigued === true,
  }
}

function slotColor(slot: SlotView, fatigueMark: DualStripFatigueMark): string {
  if (slot.isDropped) return resolveColor('text-tertiary')
  if (slot.isMarked && fatigueMark === 'strip') return resolveColor('status-error')
  return resolveColor('text-secondary')
}

function SlotName({ slot, parts }: { slot: SlotView; parts: Parts }) {
  const color = slotColor(slot, parts.fatigueMark ?? 'strip')
  const load = slot.loadLabel
  const testID = `dual-strip-name-${slot.side}`
  if (parts.sizes.stacked) {
    return (
      <View testID={testID} style={{ maxWidth: parts.sizes.nameMax }}>
        <Typography variant="overline" numberOfLines={1} style={{ color }}>
          {slot.name}
        </Typography>
        {load ? (
          <Text className="font-body text-sm leading-tight text-text-tertiary">{load}</Text>
        ) : null}
      </View>
    )
  }
  return (
    <Typography variant="overline" numberOfLines={1} style={{ color }} testID={testID}>
      {load ? `${slot.name} · ${load}` : slot.name}
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

function SlotVelocity({ slot, parts }: { slot: SlotView; parts: Parts }) {
  const last = slot.reps[slot.reps.length - 1]
  if (!last) return <Text className={cn(NUMERAL, parts.sizes.velocity)}> </Text>
  const token = slot.isDropped
    ? 'text-tertiary'
    : liveStripRepToken(slot.reps, slot.reps.length - 1, parts.barColor, parts.lossThresholds)
  return (
    <Text
      testID={`dual-strip-velocity-${slot.side}`}
      className={cn(NUMERAL, parts.sizes.velocity)}
      style={[TABULAR, { color: resolveColor(token) }]}
    >
      {formatVelocity(last.velocity)}
      {parts.layout === 'wall' ? <Text className={cn(UNIT, parts.sizes.unit)}> m/s</Text> : null}
    </Text>
  )
}

/** The shared countdown, in the rep count's place: the sides keep their velocity and bars. */
function RestReadout(parts: Parts) {
  const { seconds, size, unit, raisePx } = liveStripRestType(parts.layout, parts.restRemainingMs)
  const scale = SCALES[parts.layout]
  return (
    <View testID="dual-strip-rest">
      <Overline label="Rest left" />
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

/** A red band behind one side: the "slot" fatigue mark. */
function SlotWash({ half }: { half?: 'bottom' | 'top' }) {
  const position =
    half === 'bottom' ? 'top-1/2 bottom-0' : half === 'top' ? 'top-0 bottom-1/2' : 'inset-y-0'
  return (
    <View
      pointerEvents="none"
      testID="dual-strip-slot-wash"
      className={cn('absolute left-0 right-0 rounded-md bg-status-error-subtle', position)}
    />
  )
}

const markedHalf = (slot: SlotView) => (slot.side === 'left' ? 'top' : 'bottom')

/** Lanes: Left above Right, column by column so the numerals align, beside one chart. */
function Lanes(parts: Parts) {
  const { slots, sizes, state, fatigueMark } = parts
  const laneHeight = sizes.chart / 2
  const isPhone = parts.layout === 'phone'
  const column = (cell: (slot: SlotView) => ReactNode, key: string) => (
    <View key={key}>
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
      className={cn(
        'flex-row items-center px-inset-xs',
        isPhone ? 'flex-1 gap-inline-sm' : 'gap-inline-lg'
      )}
    >
      {fatigueMark === 'slot'
        ? slots.filter((s) => s.isMarked).map((s) => <SlotWash key={s.side} half={markedHalf(s)} />)
        : null}
      {column(
        (slot) => (
          <SlotName slot={slot} parts={parts} />
        ),
        'name'
      )}
      {state === 'rest' ? null : column((slot) => <SlotReps slot={slot} parts={parts} />, 'reps')}
      {column(
        (slot) => (
          <SlotVelocity slot={slot} parts={parts} />
        ),
        'velocity'
      )}
      <DualBars {...barsOf(parts, isPhone)} wash={undefined} />
    </View>
  )
}

/** Side by side: one group per side, a name row over a numeral row, then one chart. */
function SideGroup({ slot, parts }: { slot: SlotView; parts: Parts }) {
  return (
    <View
      testID={`dual-strip-group-${slot.side}`}
      className={cn('gap-stack-xs px-inset-xs', parts.layout === 'phone' ? 'min-w-0 flex-1' : null)}
    >
      {slot.isMarked && parts.fatigueMark === 'slot' ? <SlotWash /> : null}
      <SlotName slot={slot} parts={parts} />
      <View className="flex-row items-baseline gap-inline-md">
        {parts.state === 'rest' ? null : <SlotReps slot={slot} parts={parts} />}
        <SlotVelocity slot={slot} parts={parts} />
      </View>
    </View>
  )
}

function SideGroups(parts: Parts) {
  return (
    <View
      testID="dual-strip-groups"
      className={cn(
        'flex-row items-end',
        parts.layout === 'phone' ? 'min-w-0 flex-1 gap-inline-md' : 'gap-section-sm'
      )}
    >
      {parts.slots.map((slot) => (
        <SideGroup key={slot.side} slot={slot} parts={parts} />
      ))}
    </View>
  )
}

interface DualBarsProps {
  left: readonly LiveStripRep[]
  right: readonly LiveStripRep[]
  targetReps: number
  height: number
  width?: number
  barColor?: LiveStripBarColor
  lossThresholds: VelocityLossThresholds
  dimmed?: Side
  wash?: Side
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
    a.barColor === b.barColor &&
    a.dimmed === b.dimmed &&
    a.wash === b.wash &&
    a.lossThresholds.every((t, i) => t === b.lossThresholds[i])
  )
}

const DualBars = memo(function DualBars(props: DualBarsProps) {
  const { left, right, targetReps, height, width, dimmed, wash } = props
  const half = (side: Side) => (side === 'left' ? 'top' : 'bottom')
  return (
    <View
      testID="dual-strip-bars-frame"
      style={width != null ? { width } : { flex: 1, minWidth: 0 }}
    >
      {wash ? <SlotWash half={half(wash)} /> : null}
      <DualVelocityStrip
        left={{ velocities: left.map((r) => r.velocity) }}
        right={{ velocities: right.map((r) => r.velocity) }}
        variant="dual-expanded"
        scale="fixed"
        barColor={props.barColor}
        lossThresholds={props.lossThresholds}
        targetReps={targetReps}
        height={height}
      />
      {dimmed ? (
        <View
          pointerEvents="none"
          testID="dual-strip-dimmed-wing"
          className={cn(
            'absolute left-0 right-0 bg-surface-elevated opacity-60',
            half(dimmed) === 'top' ? 'top-0 bottom-1/2' : 'top-1/2 bottom-0'
          )}
        />
      ) : null}
    </View>
  )
}, sameBars)

function barsOf(parts: Parts, fill = false): DualBarsProps {
  const [left, right] = parts.slots
  const marked = parts.fatigueMark === 'slot' ? parts.slots.find((s) => s.isMarked) : undefined
  const columns =
    parts.targetReps > 0 ? parts.targetReps : Math.max(left.reps.length, right.reps.length)
  return {
    left: left.reps,
    right: right.reps,
    targetReps: parts.targetReps,
    height: parts.sizes.chart,
    width: fill ? undefined : Math.max(columns, 1) * BAR_PITCH[parts.layout],
    barColor: parts.barColor,
    lossThresholds: parts.lossThresholds,
    dimmed: parts.slots.find((s) => s.isDropped)?.side,
    wash: marked?.side,
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
  const isLanes = parts.arrangement !== 'side-by-side'
  return (
    <View
      className={cn(
        'flex-1 flex-row items-center gap-section-md px-gutter-md',
        parts.wallHeight === 'fixed' ? null : 'py-inset-sm'
      )}
    >
      <TitleBlock {...parts} />
      {parts.state === 'rest' ? <RestReadout {...parts} /> : null}
      {isLanes ? <Lanes {...parts} /> : <SideGroups {...parts} />}
      {isLanes ? null : <DualBars {...barsOf(parts)} />}
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
  const isLanes = parts.arrangement !== 'side-by-side'
  const rest = parts.state === 'rest' ? <RestReadout {...parts} /> : null
  return (
    <View className="justify-center gap-stack-sm px-inset-md py-inset-sm">
      <PhoneTitleRow {...parts} />
      {isLanes ? (
        <View className="flex-row items-center gap-inline-md">
          {rest}
          <Lanes {...parts} />
        </View>
      ) : (
        <>
          <View className="flex-row items-end gap-inline-md">
            {rest}
            <SideGroups {...parts} />
          </View>
          <DualBars {...barsOf(parts, true)} />
        </>
      )}
    </View>
  )
}

function slotPhrase(slot: SlotView, parts: Parts): string {
  const last = slot.reps[slot.reps.length - 1]
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
    last ? `last rep ${formatVelocity(last.velocity)} m/s` : null,
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
  const washWhole = parts.tone === 'fatigue' && parts.fatigueMark !== 'slot'
  return (
    <StripPlane
      tone={parts.tone}
      isPhone={isPhone}
      grow={parts.wallHeight !== 'fixed'}
      wash={washWhole}
    >
      {isPhone ? <PhoneRows {...parts} /> : <WallRow {...parts} />}
      {parts.state === 'rest' ? <RestBar {...parts} /> : null}
    </StripPlane>
  )
}

function toneOf(state: LiveStripState, slots: readonly SlotView[]): Tone {
  if (state === 'rest') return 'rest'
  return slots.some((s) => s.isMarked) ? 'fatigue' : 'live'
}

/** D1: one side dropped and the round's rule falls back to the single strip of the side left. */
function fallbackSlot(props: DualPinnedLiveStripProps): LiveStripSlot | null {
  if (props.dropMode !== 'single') return null
  const leftUp = props.left.isConnected !== false
  const rightUp = props.right.isConnected !== false
  if (leftUp === rightUp) return null
  return leftUp ? props.left : props.right
}

function SingleFallback({ props, slot }: { props: DualPinnedLiveStripProps; slot: LiveStripSlot }) {
  const {
    left: _l,
    right: _r,
    arrangement: _a,
    fatigueMark: _f,
    dropMode: _d,
    wallHeight: _w,
    ...shared
  } = props
  return (
    <PinnedLiveStrip
      {...shared}
      loadLabel={slot.loadLabel}
      reps={slot.reps}
      isFatigued={slot.isFatigued}
    />
  )
}

function partsOf(props: DualPinnedLiveStripProps, layout: PinnedLiveStripLayout): Parts {
  const { arrangement = 'lanes', wallHeight = 'natural' } = props
  const slots = [
    slotView('left', props.left, props.state),
    slotView('right', props.right, props.state),
  ] as const
  return {
    ...props,
    arrangement,
    wallHeight,
    fatigueMark: props.fatigueMark ?? 'strip',
    layout,
    slots,
    sizes: SIZES[arrangement][layout === 'phone' ? 'phone' : wallHeight],
    tone: toneOf(props.state, slots),
    isLink: props.onPress != null,
    targetReps: liveStripTarget(props.targetReps),
    lossThresholds: normalizeLossThresholds(props.lossThresholds),
  }
}

/**
 * Shell · DualPinnedLiveStrip (VW-439, round 1 specimen): the pinned live strip for a two-Voltra
 * session. Exercise, set and rest are drawn once; each side's name, load, reps, velocity and bars
 * are drawn per side, with one diverging chart (left up, right down).
 */
export function DualPinnedLiveStrip(props: DualPinnedLiveStripProps) {
  const { layout: measured, onLayout, ref } = useStripLayout(props.layout)
  const fallback = fallbackSlot(props)
  if (props.state === 'idle') return null
  if (fallback) return <SingleFallback props={props} slot={fallback} />
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
