// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// VW-466 shape A, one band: not chosen in round 1, deleted in slice 4.
import { View } from 'react-native'

import { Typography } from '../../ui/typography'
import { blockTitle, positionText, rangeLabel } from './MesoHeader.model'
import {
  FocusTip,
  PhoneTitleRow,
  PrioritiesSlot,
  StatePill,
  WeekBar,
  type PartProps,
} from './MesoHeader.parts'

const WALL_CELL_WIDTH = 24
const WALL_BAR_MAX_WIDTH = 320

export function WallBand({ model }: PartProps) {
  const { block, schedule, priorities } = model
  const barWidth = Math.min(schedule.weeks.length * WALL_CELL_WIDTH, WALL_BAR_MAX_WIDTH)
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
      className="gap-x-section-sm gap-y-stack-sm"
      testID="meso-header-wall"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="overline">{blockTitle(block)}</Typography>
        {block.focus ? <FocusTip focus={block.focus} /> : null}
      </View>
      <Typography variant="body2" color="secondary">
        {rangeLabel(schedule)}
      </Typography>
      <WeekBar
        weeks={schedule.weeks}
        state={schedule.state}
        current={schedule.week?.n}
        width={barWidth}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="body2" testID="meso-header-position">
          {positionText(schedule, model.now)}
        </Typography>
        <StatePill schedule={schedule} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <PrioritiesSlot priorities={priorities} />
      </View>
    </View>
  )
}

export function PhoneBand({ model }: PartProps) {
  const { schedule } = model
  return (
    <View className="gap-stack-sm" testID="meso-header-phone">
      <PhoneTitleRow model={model} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-md">
        <WeekBar weeks={schedule.weeks} state={schedule.state} current={schedule.week?.n} />
        <Typography variant="caption" color="secondary" style={{ flexShrink: 0 }}>
          {rangeLabel(schedule, false)}
        </Typography>
      </View>
    </View>
  )
}
