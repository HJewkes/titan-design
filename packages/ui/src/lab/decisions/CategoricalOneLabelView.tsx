import { Text, View } from 'react-native'
import Svg, { Polyline } from 'react-native-svg'
import { simulateCvd } from '../../theme/color-checks'
import { isLive, readOption, type LabelOption, type SlotReading } from './categorical-one-label'
import { fmt } from './surface-family'
import { Caption, FrameHeader, ModeFrame } from './SurfaceFamilyView'

export type Vision = 'normal' | 'deuteranopia'

const BAR_VALUES = [92, 78, 66, 58, 47, 38, 29]
const LINE_W = 280
const LINE_H = 96

const paint = (hex: string, vision: Vision) =>
  vision === 'normal' ? hex : simulateCvd(hex, 'deutan')

const labelRatio = (slot: SlotReading, vision: Vision) =>
  vision === 'normal' ? slot.label : slot.labelDeutan

function Bar({
  o,
  slot,
  i,
  vision,
}: {
  o: LabelOption
  slot: SlotReading
  i: number
  vision: Vision
}) {
  const ratio = labelRatio(slot, vision)
  const live = isLive(o, ratio)
  const large = o.floor < 4.5
  const text = `${slot.name} · ${BAR_VALUES[i]}`
  return (
    <View className="flex-row items-center gap-inline-sm">
      <View
        className="justify-center rounded-sm px-squish-x-sm"
        style={{
          backgroundColor: paint(slot.hex, vision),
          width: 180 + BAR_VALUES[i] * 2,
          height: large ? 32 : 22,
        }}
      >
        {live ? (
          <Text
            className={large ? 'text-[20px] font-bold' : 'text-xs font-semibold'}
            style={{ color: paint(o.label.hex, vision) }}
          >
            {text}
          </Text>
        ) : null}
      </View>
      {o.placement === 'outside' ? <Text className="text-xs text-text-primary">{text}</Text> : null}
      <Caption>
        {o.placement === 'outside'
          ? `fill ${fmt(slot.plane)}`
          : `label ${fmt(ratio)}${live ? '' : ' (swatch only, under the floor)'}`}
      </Caption>
    </View>
  )
}

function Legend({ o, vision }: { o: LabelOption; vision: Vision }) {
  const slots = readOption(o).slots
  return (
    <View className="flex-row flex-wrap gap-inline-md">
      {slots.map((slot) => (
        <View key={slot.name} className="flex-row items-center gap-inline-sm">
          <View
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: paint(slot.hex, vision) }}
          />
          <Text className="text-xs text-text-primary">{slot.name}</Text>
        </View>
      ))}
    </View>
  )
}

function seriesPoints(slot: number): string {
  return [0, 1, 2, 3, 4, 5, 6]
    .map((x) => `${(x * LINE_W) / 6},${LINE_H - 8 - ((slot * 11 + x * (7 + slot * 3)) % 80)}`)
    .join(' ')
}

function Lines({ o, vision }: { o: LabelOption; vision: Vision }) {
  return (
    <Svg width={LINE_W} height={LINE_H} accessibilityLabel={`${o.title} line sample`}>
      {readOption(o).slots.map((slot, i) => (
        <Polyline
          key={slot.name}
          points={seriesPoints(i)}
          fill="none"
          stroke={paint(slot.hex, vision)}
          strokeWidth={2}
        />
      ))}
    </Svg>
  )
}

function VisionColumn({ o, vision }: { o: LabelOption; vision: Vision }) {
  const slots = readOption(o).slots
  return (
    <View
      className="gap-stack-md rounded-md bg-surface-base p-inset-md"
      testID={`${o.id}-${vision}`}
    >
      <Text className="text-sm font-semibold text-text-primary">{vision}</Text>
      {slots.map((slot, i) => (
        <Bar key={slot.name} o={o} slot={slot} i={i} vision={vision} />
      ))}
      <Legend o={o} vision={vision} />
      <Lines o={o} vision={vision} />
    </View>
  )
}

function figuresLine(o: LabelOption): string {
  const r = readOption(o)
  return [
    `label ${o.label.label} on every slot, worst 0-5 ${fmt(r.worstLabel)} (floor ${o.floor})`,
    `all-pairs CVD ΔE 0-5 ${r.cvd.toFixed(1)} (${r.cvdPair}; gate 8)`,
    `tritan ${r.tritan.toFixed(1)}`,
    `fills on ${r.plane}`,
  ].join(' · ')
}

/** One option as one unit: its numbers, then the chart samples in each vision asked for. */
export function OptionUnit({ o, visions }: { o: LabelOption; visions: readonly Vision[] }) {
  return (
    <View className="gap-stack-md" testID={`option-${o.id}`}>
      <FrameHeader title={o.title} summary={o.summary} />
      <Caption>{figuresLine(o)}</Caption>
      <View className="flex-row flex-wrap gap-gutter-sm">
        {visions.map((v) => (
          <VisionColumn key={v} o={o} vision={v} />
        ))}
      </View>
    </View>
  )
}

export function OptionFrame({
  options,
  visions,
}: {
  options: readonly LabelOption[]
  visions: readonly Vision[]
}) {
  return (
    <ModeFrame mode={options[0].mode}>
      {options.map((o) => (
        <OptionUnit key={o.id} o={o} visions={visions} />
      ))}
    </ModeFrame>
  )
}
