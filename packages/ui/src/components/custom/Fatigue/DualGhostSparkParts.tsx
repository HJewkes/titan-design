import type { getSemanticColors } from '../../../theme/tokens/semantic'
import { FONT_UI } from './fatigue-tokens'
import { GhostBloom } from './GhostBloom'
import type { DualSparkLayout, SparkWing } from './dualGhostSparkLayout'

/** Same bloom, one prop flipped: LEFT grows UP, RIGHT grows DOWN. */
export function DualWingBloom({
  wing,
  baseline,
  orientation,
  testID,
}: {
  wing: SparkWing
  baseline: number
  orientation: 'up' | 'down'
  testID: string
}) {
  if (wing.current.length === 0) return null
  return (
    <g data-testid={testID}>
      <GhostBloom
        current={wing.current}
        ghosts={wing.ghosts}
        tint={wing.tint}
        baseline={baseline}
        orientation={orientation}
      />
    </g>
  )
}

export function DualDeviceLabels({
  leftLabel,
  rightLabel,
  layout,
  colors,
}: {
  leftLabel: string
  rightLabel: string
  layout: DualSparkLayout
  colors: ReturnType<typeof getSemanticColors>
}) {
  const { padL, padTop, padBot, h } = layout
  return (
    <>
      <text
        x={padL}
        y={padTop - 9}
        fontSize={9}
        fontWeight={800}
        letterSpacing={1}
        fontFamily={FONT_UI}
        fill={colors['text-tertiary']}
      >
        {leftLabel}
      </text>
      <text
        x={padL}
        y={h - padBot + 15}
        fontSize={9}
        fontWeight={800}
        letterSpacing={1}
        fontFamily={FONT_UI}
        fill={colors['text-tertiary']}
      >
        {rightLabel}
      </text>
    </>
  )
}
