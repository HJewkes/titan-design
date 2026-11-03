import { View } from 'react-native'
import { Pill } from '../../components/ui/pill'
import { AA, NON_TEXT, fmt, lightLadder, readOn, textPlanes, type LadderRung } from './foundations'
import {
  Caption,
  CellCarrier,
  FrameHeader,
  MissSwatch,
  ModeFrame,
  PlaneTile,
} from './FoundationsKit'

const LINES = [
  'A record of picks already made, not a question. Light solid = hue 600 + white.',
  'Two named exceptions stay at 500 + white: brand orange 500 and warning amber 500 (large-text AA, labels 12px semibold or larger).',
  'New: against the -1 plane (grey 200) their edge is 2.46 and 2.38, under 3:1; green 600 is 2.998 there, which rounds to 3.00.',
  'Each tile prints the white label and the fill edge against its plane.',
]

function RungTile({ rung, planeIndex }: { rung: LadderRung; planeIndex: number }) {
  const plane = textPlanes('light')[planeIndex]
  const reading = readOn(rung.cell, plane)
  const fill = { hex: rung.cell.fill, label: rung.cell.fillLabel }
  return (
    <View className="w-56 gap-1" testID={`rung-${rung.tone}-${plane.level}`}>
      {reading.label >= AA ? (
        <CellCarrier solid={rung.cell}>
          <Pill variant="solid" tone="error">{`${rung.tone} · ${rung.cell.fillLabel}`}</Pill>
        </CellCarrier>
      ) : (
        <MissSwatch fill={fill} label={rung.cell.on} ratio={reading.label} />
      )}
      <Caption>{`white ${fmt(reading.label)} · edge ${fmt(reading.fill)}${reading.fill < NON_TEXT ? ' (under 3:1)' : ''}`}</Caption>
    </View>
  )
}

function RungLegend({ rung }: { rung: LadderRung }) {
  const mark = rung.isException ? '★ named exception' : 'step 600'
  return (
    <Caption>{`${rung.tone} · ${rung.cell.fillLabel} · ${mark} · edge on grey 200 ${fmt(rung.edgeOnInset)}${rung.edgeOnInset < NON_TEXT ? ' (under 3:1)' : ''}`}</Caption>
  )
}

export function Fd3LadderFrame() {
  const ladder = lightLadder()
  return (
    <ModeFrame mode="light" testID="fd3-ladder-light">
      <FrameHeader title="FD3 · light solid ladder (record)" lines={LINES} />
      <View className="gap-1">
        {ladder.map((rung) => (
          <RungLegend key={rung.tone} rung={rung} />
        ))}
      </View>
      {textPlanes('light').map((plane, i) => (
        <PlaneTile key={plane.level} hex={plane.swatch.hex}>
          <Caption>{`${plane.level} ${plane.token} · ${plane.swatch.label}`}</Caption>
          <View className="flex-row flex-wrap gap-inline-md">
            {ladder.map((rung) => (
              <RungTile key={rung.tone} rung={rung} planeIndex={i} />
            ))}
          </View>
        </PlaneTile>
      ))}
    </ModeFrame>
  )
}
