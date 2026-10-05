// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// VW-466: shapes B (cycle, not chosen in round 1) and C (spine, chosen in round 1). Slice 4 deletes B.
import { View } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Pill } from '../../ui/pill'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
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
import { GOAL_PRIORITY_LABEL, GoalPriorityIcon } from './GoalPriorityIcon'
import { groupPriorities, type GoalPriorityIndexGroup } from './GoalPriorityIndex'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'

/** Bars and their label rows share one gap, so every label sits under its own cell. */
const SEGMENT_GAP = 4
const SPINE_WEEK_WIDTH = 160
const SPINE_MAX_WIDTH = 960
const CYCLE_BAR_BASIS = 480
const CYCLE_BAR_MAX_WIDTH = 960
const SPINE_DATE_ALLOWANCE = 120
const SPINE_LEFT_MIN_WIDTH = 560
/** One width per priority column, so a level's label and its lifts share a column across both rows. */
const PRIORITY_COLUMN = { width: 320, flexShrink: 1, minWidth: 0 } as const
const POPOVER_MAX_WIDTH = 'max-w-[280px]'

const ROW = { flexDirection: 'row', alignItems: 'center' } as const
const WRAPPING_ROW = { ...ROW, flexWrap: 'wrap' } as const
const TOP_ROW = { flexDirection: 'row', alignItems: 'flex-start' } as const
const FLEX_CELL = { flex: 1, minWidth: 0 } as const

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

function spineWeekText(week: MesoHeaderWeek): string {
  const name = week.name ?? (week.isDeload ? 'Deload' : '')
  return name ? `W${week.index} ${name}` : `W${week.index}`
}

/** The week cells with a today line; the wall labels every week, the phone's week text says it instead. */
function Spine({ props, labelled }: { props: BandProps; labelled: boolean }) {
  const t = getSemanticColors(useSurfaceMode())
  const { weeks, state, week } = props
  const today = todayPosition(props)
  const labels = weeks.map((w) => ({
    text: spineWeekText(w),
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
      {labelled ? <SegmentLabels labels={labels} gap={SEGMENT_GAP} /> : null}
    </View>
  )
}

function DatedSpine(props: BandProps) {
  return (
    <View style={TOP_ROW} className="gap-inline-md">
      <Typography variant="caption" color="secondary">
        {dayLabel(props.startsOn, false)}
      </Typography>
      <View style={FLEX_CELL}>
        <Spine props={props} labelled />
      </View>
      <Typography variant="caption" color="secondary">
        {dayLabel(props.endsOn, false)}
      </Typography>
    </View>
  )
}

/** The left column is wide enough for the spine and its dates, so every priority column lines up. */
export function spineColumnWidth(weekCount: number): number {
  const spine = Math.min(weekCount * SPINE_WEEK_WIDTH, SPINE_MAX_WIDTH)
  return Math.max(SPINE_LEFT_MIN_WIDTH, spine + SPINE_DATE_ALLOWANCE)
}

function PriorityLabel({ group }: { group: GoalPriorityIndexGroup }) {
  return (
    <View style={ROW} className="gap-inline-sm" testID="meso-header-priority-label">
      <GoalPriorityIcon priority={group.level} size={16} />
      <Typography variant="overline" color="secondary">
        {GOAL_PRIORITY_LABEL[group.level]}
      </Typography>
    </View>
  )
}

/** C on the wall, two rows: title and week over the dated spine; each priority level over its lifts. */
export function SpineWall(props: BandProps) {
  const width = spineColumnWidth(props.weeks.length)
  const groups = groupPriorities(props.priorities)
  return (
    <View className="gap-stack-md" testID="meso-header-wall">
      <View style={ROW} className="gap-x-section-md">
        <View style={{ ...WRAPPING_ROW, width }} className="gap-x-section-sm gap-y-stack-sm">
          <TitleGroup {...props} />
          <PositionGroup {...props} />
        </View>
        {groups.length === 0 ? <PrioritiesSlot priorities={props.priorities} /> : null}
        {groups.map((group) => (
          <View key={group.level} style={PRIORITY_COLUMN}>
            <PriorityLabel group={group} />
          </View>
        ))}
      </View>
      <View style={TOP_ROW} className="gap-x-section-md">
        <View style={{ width }}>
          <DatedSpine {...props} />
        </View>
        {groups.map((group) => (
          <View key={group.level} style={PRIORITY_COLUMN} testID="meso-header-priority-names">
            <Typography variant="body2">{group.names.join(', ')}</Typography>
          </View>
        ))}
      </View>
    </View>
  )
}

/** Week number and type for the phone's second line, e.g. "Wk 2 of 2 · Confirm". */
export function phoneWeekText(props: BandProps): string {
  const { state, week } = props
  if (state !== 'current' || !week?.name) return positionText(props, true)
  return `${positionText(props, true)} · ${week.name}`
}

function PrioritiesPill({ count }: { count: number }) {
  return (
    <PopoverTrigger>
      {/* A control, so its outline takes the control-boundary token, not the pill's hairline. */}
      <Pill
        size="sm"
        variant="outline"
        className="border-border-input"
        testID="meso-header-priorities-trigger"
      >
        {count > 0 ? `Priorities · ${count}` : 'Dates'}
      </Pill>
    </PopoverTrigger>
  )
}

/** The popover hangs under the whole header, so it never covers the week line; it carries the dates. */
function PrioritiesPanel(props: BandProps) {
  return (
    <PopoverContent className={`left-auto right-0 ${POPOVER_MAX_WIDTH}`}>
      <View className="gap-stack-md">
        <Typography variant="body2" color="secondary" testID="meso-header-popover-dates">
          {`${dayLabel(props.startsOn)} - ${dayLabel(props.endsOn)}`}
        </Typography>
        <PrioritiesSlot priorities={props.priorities} />
      </View>
    </PopoverContent>
  )
}

/** C on a phone: the block title alone on line 1 (P1 adds the trigger); week, state and cells on line 2. */
export function SpinePhone(props: BandProps) {
  const { blockName, block, state, week, priorities, prioritiesLine = 1 } = props
  const pill = <PrioritiesPill count={priorities.length} />
  return (
    <Popover isOpen={props.isPrioritiesOpen} onOpenChange={props.onPrioritiesOpenChange}>
      <View className="gap-stack-sm" testID="meso-header-phone">
        <View style={ROW} className="gap-inline-md">
          <View style={FLEX_CELL}>
            <Typography variant="overline" testID="meso-header-title">
              {blockTitle(blockName, block)}
            </Typography>
          </View>
          {prioritiesLine === 1 ? pill : null}
        </View>
        <View style={ROW} className="gap-inline-md">
          <Typography variant="body2" testID="meso-header-position" style={{ flexShrink: 0 }}>
            {phoneWeekText(props)}
          </Typography>
          <StatePill state={state} isDeload={week?.isDeload ?? false} />
          <View style={FLEX_CELL}>
            <Spine props={props} labelled={false} />
          </View>
          {prioritiesLine === 2 ? pill : null}
        </View>
      </View>
      <PrioritiesPanel {...props} />
    </Popover>
  )
}
