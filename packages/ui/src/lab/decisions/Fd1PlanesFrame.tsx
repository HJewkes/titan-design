import { View } from 'react-native'
import type { ThemeMode } from '../../theme/tokens/semantic'
import { fmt, planeLadder, tierRatios, type Plane } from './foundations'
import { Caption, FrameHeader, ModeFrame, PlaneTile } from './FoundationsKit'

const LINES = [
  'The 3b ramp as decided, -2 (frame) to +5, plus the input fill. Not asked.',
  'Marked "carries text": the planes text may sit on. Question: does -1 carry text?',
  'Each tile prints the three text tiers against it (WCAG 2.x).',
]

function LevelTile({ plane, mode }: { plane: Plane; mode: ThemeMode }) {
  return (
    <PlaneTile hex={plane.swatch.hex} className="w-44" testID={`plane-${plane.level}`}>
      <Caption>{`${plane.level} · ${plane.swatch.label}`}</Caption>
      <Caption>{plane.token}</Caption>
      <View
        className="self-start rounded-sm border border-hairline-strong px-squish-x-xs"
        style={plane.carriesText ? undefined : { borderStyle: 'dashed' }}
      >
        <Caption>{plane.carriesText ? '● carries text' : '○ no text'}</Caption>
      </View>
      {tierRatios(plane, mode).map(({ tier, ratio }) => (
        <Caption key={tier}>{`${tier} ${fmt(ratio)}`}</Caption>
      ))}
    </PlaneTile>
  )
}

export function Fd1PlanesFrame({ mode }: { mode: ThemeMode }) {
  return (
    <ModeFrame mode={mode} testID={`fd1-planes-${mode}`}>
      <FrameHeader title={`FD1 · planes, ${mode}`} lines={LINES} />
      <View className="flex-row flex-wrap gap-inline-md">
        {planeLadder(mode).map((plane) => (
          <LevelTile key={plane.level} plane={plane} mode={mode} />
        ))}
      </View>
    </ModeFrame>
  )
}
