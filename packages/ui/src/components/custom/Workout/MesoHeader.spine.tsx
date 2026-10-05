// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// VW-466 shape C, the week spine: chosen in round 1, laid out per round 2.
import { View } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Pill } from '../../ui/pill'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { GOAL_PRIORITY_LABEL, GoalPriorityIcon } from './GoalPriorityIcon'
import { groupPriorities, type GoalPriorityIndexGroup } from './GoalPriorityIndex'
import {
  blockTitle,
  dayLabel,
  phoneWeekText,
  rangeLabel,
  SEGMENT_GAP,
  spineColumnWidth,
  spineWeekText,
  todayPosition,
} from './MesoHeader.model'
import {
  FLEX_CELL,
  PositionGroup,
  PrioritiesSlot,
  ROW,
  SegmentLabels,
  StatePill,
  TitleGroup,
  TOP_ROW,
  WeekBar,
  WRAPPING_ROW,
  type PartProps,
} from './MesoHeader.parts'

/** One width per priority column, so a level's label and its lifts share a column across both rows. */
const PRIORITY_COLUMN = { width: 320, flexShrink: 1, minWidth: 0 } as const
const POPOVER_MAX_WIDTH = 'max-w-[280px]'

/** The week cells with a today line; the wall labels every week, the phone's week text says it instead. */
function Spine({ model, labelled }: PartProps & { labelled: boolean }) {
  const t = getSemanticColors(useSurfaceMode())
  const { weeks, state, week } = model.schedule
  const today = todayPosition(model.schedule, model.now)
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

function DatedSpine({ model }: PartProps) {
  return (
    <View style={TOP_ROW} className="gap-inline-md">
      <Typography variant="caption" color="secondary">
        {dayLabel(model.schedule.startsOn, false)}
      </Typography>
      <View style={FLEX_CELL}>
        <Spine model={model} labelled />
      </View>
      <Typography variant="caption" color="secondary">
        {dayLabel(model.schedule.endsOn, false)}
      </Typography>
    </View>
  )
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
export function SpineWall({ model }: PartProps) {
  const width = spineColumnWidth(model.schedule.weeks.length)
  const groups = groupPriorities(model.priorities)
  return (
    <View className="gap-stack-md" testID="meso-header-wall">
      <View style={ROW} className="gap-x-section-md">
        <View style={{ ...WRAPPING_ROW, width }} className="gap-x-section-sm gap-y-stack-sm">
          <TitleGroup model={model} />
          <PositionGroup model={model} />
        </View>
        {groups.length === 0 ? <PrioritiesSlot priorities={model.priorities} /> : null}
        {groups.map((group) => (
          <View key={group.level} style={PRIORITY_COLUMN}>
            <PriorityLabel group={group} />
          </View>
        ))}
      </View>
      <View style={TOP_ROW} className="gap-x-section-md">
        <View style={{ width }}>
          <DatedSpine model={model} />
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
function PrioritiesPanel({ model }: PartProps) {
  return (
    <PopoverContent className={`left-auto right-0 ${POPOVER_MAX_WIDTH}`}>
      <View className="gap-stack-md">
        <Typography variant="body2" color="secondary" testID="meso-header-popover-dates">
          {rangeLabel(model.schedule)}
        </Typography>
        <PrioritiesSlot priorities={model.priorities} />
      </View>
    </PopoverContent>
  )
}

/** C on a phone: the block title alone on line 1 (P1 adds the trigger); week, state and cells on line 2. */
export function SpinePhone({ model }: PartProps) {
  const pill = <PrioritiesPill count={model.priorities.length} />
  return (
    <Popover isOpen={model.popover.isOpen} onOpenChange={model.popover.onOpenChange}>
      <View className="gap-stack-sm" testID="meso-header-phone">
        <View style={ROW} className="gap-inline-md">
          <View style={FLEX_CELL}>
            <Typography variant="overline" testID="meso-header-title">
              {blockTitle(model.block)}
            </Typography>
          </View>
          {model.prioritiesLine === 1 ? pill : null}
        </View>
        <View style={ROW} className="gap-inline-md">
          <Typography variant="body2" testID="meso-header-position" style={{ flexShrink: 0 }}>
            {phoneWeekText(model.schedule, model.now)}
          </Typography>
          <StatePill schedule={model.schedule} />
          <View style={FLEX_CELL}>
            <Spine model={model} labelled={false} />
          </View>
          {model.prioritiesLine === 2 ? pill : null}
        </View>
      </View>
      <PrioritiesPanel model={model} />
    </Popover>
  )
}
