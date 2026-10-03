// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// VW-466 round 1: shapes B (cycle) and C (spine). Slice 4 deletes whichever loses.
import { View } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import {
  BAR_HEIGHT,
  blockTitle,
  dayLabel,
  daysBetween,
  FocusTip,
  PhoneTitleRow,
  positionText,
  PrioritiesSlot,
  SegmentLabels,
  StatePill,
  WeekBar,
  type BandProps,
  type MesoHeaderWeek,
  type Palette,
} from './MesoHeader.parts'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'

/** Bars and their label rows share one gap, so every label sits under its own cell. */
const SEGMENT_GAP = 4
const SPINE_WEEK_WIDTH = 160
const SPINE_MAX_WIDTH = 960
const CYCLE_BAR_BASIS = 480
const CYCLE_BAR_MAX_WIDTH = 960
const PHONE_LABELLED_WEEKS_MAX = 8

const ROW = { flexDirection: 'row', alignItems: 'center' } as const
const WRAPPING_ROW = { ...ROW, flexWrap: 'wrap' } as const

function currentBlockFill({ state, week }: BandProps, weeks: number): number {
  if (state === 'ended') return 1
  if (state === 'upcoming' || !week) return 0
  return Math.min(week.n / weeks, 1)
}

/** One segment per block, weighted by its weeks: past filled, current ringed and filled to this week. */
export function cycleSegments(props: BandProps, t: Palette): SegmentedBarSegment[] {
  const current = (props.block?.index ?? 1) - 1
  return (props.cycle ?? []).map((block, i) => {
    if (i < current) return { weight: block.weeks, color: t['text-tertiary'] }
    if (i > current) return { weight: block.weeks, color: t['hairline-subtle'] }
    return {
      weight: block.weeks,
      color: t['text-tertiary'],
      fill: currentBlockFill(props, block.weeks),
      ringColor: t['text-primary'],
    }
  })
}

function cycleLabel(props: BandProps): string {
  const blocks = props.cycle ?? []
  const current = props.block?.index ?? 1
  const names = blocks.map(
    (b, i) => `${b.name}, ${b.weeks} weeks${i + 1 === current ? ' (current)' : ''}`
  )
  return `Program: ${blocks.length} blocks: ${names.join('; ')}`
}

function CycleBar({ props, compact }: { props: BandProps; compact: boolean }) {
  const t = getSemanticColors(useSurfaceMode())
  const cycle = props.cycle ?? []
  if (cycle.length === 0) return null
  const current = props.block?.index ?? 1
  const labels = cycle.map((block, i) => ({
    text: compact ? `B${i + 1}` : `Block ${i + 1} · ${block.name}`,
    weight: block.weeks,
    isCurrent: i + 1 === current,
  }))
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={cycleLabel(props)}
      className="gap-stack-sm"
      testID="meso-header-cycle"
    >
      <SegmentedBar segments={cycleSegments(props, t)} height={BAR_HEIGHT} gap={SEGMENT_GAP} />
      <SegmentLabels labels={labels} gap={SEGMENT_GAP} />
    </View>
  )
}

function PositionGroup(props: BandProps) {
  return (
    <View style={ROW} className="gap-inline-sm">
      <Typography variant="body2" testID="meso-header-position">
        {positionText(props)}
      </Typography>
      <StatePill state={props.state} isDeload={props.week?.isDeload ?? false} />
    </View>
  )
}

function TitleGroup(props: BandProps & { withProgram?: boolean }) {
  const { programName, blockName, block, focus, withProgram } = props
  const title = blockTitle(blockName, block)
  return (
    <View style={ROW} className="gap-inline-sm">
      <Typography variant="overline">
        {withProgram && programName ? `${programName} › ${title}` : title}
      </Typography>
      {focus ? <FocusTip focus={focus} /> : null}
    </View>
  )
}

/** B on the wall: the block row as in A, then the program's blocks beside the priorities. */
export function CycleWall(props: BandProps) {
  return (
    <View className="gap-stack-sm" testID="meso-header-wall">
      <View style={WRAPPING_ROW} className="gap-x-section-sm gap-y-stack-sm">
        <TitleGroup {...props} withProgram />
        <Typography variant="body2" color="secondary">
          {`${dayLabel(props.startsOn)} - ${dayLabel(props.endsOn)}`}
        </Typography>
        <PositionGroup {...props} />
      </View>
      <View style={WRAPPING_ROW} className="gap-x-section-sm gap-y-stack-sm">
        <View style={{ flexGrow: 1, flexBasis: CYCLE_BAR_BASIS, maxWidth: CYCLE_BAR_MAX_WIDTH }}>
          <CycleBar props={props} compact={false} />
        </View>
        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
          <PrioritiesSlot priorities={props.priorities} />
        </View>
      </View>
    </View>
  )
}

/** B on a phone: three lines, the program bar between the title and the dates. */
export function CyclePhone(props: BandProps) {
  return (
    <View className="gap-stack-sm" testID="meso-header-phone">
      <PhoneTitleRow {...props} />
      <CycleBar props={props} compact />
      <Typography variant="caption" color="secondary">
        {`${dayLabel(props.startsOn, false)} - ${dayLabel(props.endsOn, false)}`}
      </Typography>
    </View>
  )
}

/** Where today falls in the block, as a fraction; only while the block is current and today is pinned. */
export function todayPosition({ state, now, startsOn, endsOn }: BandProps): number | null {
  if (state !== 'current' || now === undefined) return null
  const span = daysBetween(startsOn, endsOn) + 1
  return Math.min(Math.max((daysBetween(startsOn, now) + 0.5) / span, 0), 1)
}

function spineWeekText(week: MesoHeaderWeek, compact: boolean): string {
  if (compact) return `W${week.index}`
  const name = week.name ?? (week.isDeload ? 'Deload' : '')
  return name ? `W${week.index} ${name}` : `W${week.index}`
}

function Spine({ props, compact }: { props: BandProps; compact: boolean }) {
  const t = getSemanticColors(useSurfaceMode())
  const { weeks, state, week } = props
  const today = todayPosition(props)
  const showLabels = !compact || weeks.length <= PHONE_LABELLED_WEEKS_MAX
  const labels = weeks.map((w) => ({
    text: spineWeekText(w, compact),
    weight: 1,
    isCurrent: w.index === week?.n,
  }))
  return (
    <View className="gap-stack-sm" testID="meso-header-spine">
      <WeekBar
        weeks={weeks}
        state={state}
        current={week?.n}
        gap={SEGMENT_GAP}
        marker={today === null ? null : { position: today, color: t['text-primary'] }}
      />
      {showLabels ? <SegmentLabels labels={labels} gap={SEGMENT_GAP} /> : null}
    </View>
  )
}

/** C on the wall: the labelled weeks are the header, dated at both ends, priorities after. */
export function SpineWall(props: BandProps) {
  const width = Math.min(props.weeks.length * SPINE_WEEK_WIDTH, SPINE_MAX_WIDTH)
  return (
    <View
      style={WRAPPING_ROW}
      className="gap-x-section-sm gap-y-stack-sm"
      testID="meso-header-wall"
    >
      <TitleGroup {...props} />
      <View style={ROW} className="gap-inline-md">
        <Typography variant="caption" color="secondary">
          {dayLabel(props.startsOn, false)}
        </Typography>
        <View style={{ width }}>
          <Spine props={props} compact={false} />
        </View>
        <Typography variant="caption" color="secondary">
          {dayLabel(props.endsOn, false)}
        </Typography>
      </View>
      <StatePill state={props.state} isDeload={props.week?.isDeload ?? false} />
      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <PrioritiesSlot priorities={props.priorities} />
      </View>
    </View>
  )
}

/** C on a phone: the title row without the week text, then the cells with week numbers. */
export function SpinePhone(props: BandProps) {
  return (
    <View className="gap-stack-sm" testID="meso-header-phone">
      <PhoneTitleRow {...props} showPosition={false} />
      <Spine props={props} compact />
    </View>
  )
}
