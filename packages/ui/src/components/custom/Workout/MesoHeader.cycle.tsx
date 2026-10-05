// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// VW-466 shape B, the program cycle: not chosen in round 1, deleted in slice 4.
import { View } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { BAR_HEIGHT, cycleLabel, cycleSegments, rangeLabel, SEGMENT_GAP } from './MesoHeader.model'
import {
  PhoneTitleRow,
  PositionGroup,
  PrioritiesSlot,
  SegmentLabels,
  TitleGroup,
  WRAPPING_ROW,
  type PartProps,
} from './MesoHeader.parts'
import { SegmentedBar } from './SegmentedBar'

const CYCLE_BAR_BASIS = 480
const CYCLE_BAR_MAX_WIDTH = 960

function CycleBar({ model, compact }: PartProps & { compact: boolean }) {
  const t = getSemanticColors(useSurfaceMode())
  if (model.cycle.length === 0) return null
  const current = model.block.order?.index ?? 1
  const labels = model.cycle.map((block, i) => ({
    text: compact ? `B${i + 1}` : `Block ${i + 1} · ${block.name}`,
    weight: block.weeks,
    isCurrent: i + 1 === current,
  }))
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={cycleLabel(model)}
      className="gap-stack-sm"
      testID="meso-header-cycle"
    >
      <SegmentedBar segments={cycleSegments(model, t)} height={BAR_HEIGHT} gap={SEGMENT_GAP} />
      <SegmentLabels labels={labels} gap={SEGMENT_GAP} />
    </View>
  )
}

/** B on the wall: the block row as in A, then the program's blocks beside the priorities. */
export function CycleWall({ model }: PartProps) {
  return (
    <View className="gap-stack-sm" testID="meso-header-wall">
      <View style={WRAPPING_ROW} className="gap-x-section-sm gap-y-stack-sm">
        <TitleGroup model={model} withProgram />
        <Typography variant="body2" color="secondary">
          {rangeLabel(model.schedule)}
        </Typography>
        <PositionGroup model={model} />
      </View>
      <View style={WRAPPING_ROW} className="gap-x-section-sm gap-y-stack-sm">
        <View style={{ flexGrow: 1, flexBasis: CYCLE_BAR_BASIS, maxWidth: CYCLE_BAR_MAX_WIDTH }}>
          <CycleBar model={model} compact={false} />
        </View>
        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
          <PrioritiesSlot priorities={model.priorities} />
        </View>
      </View>
    </View>
  )
}

/** B on a phone: three lines, the program bar between the title and the dates. */
export function CyclePhone({ model }: PartProps) {
  return (
    <View className="gap-stack-sm" testID="meso-header-phone">
      <PhoneTitleRow model={model} />
      <CycleBar model={model} compact />
      <Typography variant="caption" color="secondary">
        {rangeLabel(model.schedule, false)}
      </Typography>
    </View>
  )
}
