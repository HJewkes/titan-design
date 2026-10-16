import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { WorkoutShell } from './WorkoutShell'
import { DualPinnedLiveStrip } from './DualPinnedLiveStrip'
import { DUAL_STRIP_SCENARIOS as S, type DualStripScenario } from './dualPinnedLiveStrip-fixture'

type Frame = 'chosen' | 'stress'

interface DecisionArgs {
  frame: Frame
}

// Each frame stacks its strips, top to bottom.
const FRAME_STRIPS: Record<Frame, readonly DualStripScenario[]> = {
  chosen: ['set', 'rest', 'fatigueRight', 'rightDropped'],
  stress: ['longNames', 'noNames', 'longRest'],
}

// Stands in for the consumer's navigation back to the live page.
const goLive = () => undefined

/** A neutral stand-in for whichever non-live page the lifter navigated to. */
function PageBody() {
  return (
    <View className="gap-section-sm">
      {['Planning', 'Per-lift'].map((heading) => (
        <Surface
          key={heading}
          raise={1}
          className="gap-stack-md p-inset-xl"
          style={{ minHeight: 140 }}
        >
          <Typography variant="h6">{heading}</Typography>
          <Typography variant="body2" color="tertiary">
            Page content scrolls under the pinned strip.
          </Typography>
        </Surface>
      ))}
    </View>
  )
}

function Strips({ frame }: DecisionArgs) {
  return (
    <View className="gap-stack-md" testID="dual-strip-frame">
      {FRAME_STRIPS[frame].map((key) => (
        <DualPinnedLiveStrip key={key} {...S[key]} onPress={goLive} />
      ))}
    </View>
  )
}

/**
 * VW-439, CHOSEN (locked in round 3): the shipped `DualPinnedLiveStrip` in the wall shell.
 *
 * Lanes, Left above Right beside one diverging chart, in the single strip's 72px wall row. F1: a
 * fatigued side reddens the whole strip and its name. D2: a dropped side stays, its wing faded. Each
 * side's name and load at the wall only; the phone marks the sides by position (P-none). Rest is one
 * unlabelled countdown beside the finished set's chart (R-overall). The rejected variants are in
 * `REJECTED.md`. Canvas width drives the layout, so view at 1920 and 360. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Dual Pinned Live Strip',
  tags: ['status:lab', '!status:review'],
  parameters: { layout: 'fullscreen' },
  args: { frame: 'chosen' },
  argTypes: {
    frame: { control: 'select', options: ['chosen', 'stress'] },
  },
  render: (args) => (
    <WorkoutShell
      activeKey="program"
      liveKey="live"
      state="live"
      subtitle="planning"
      contentPadding="none"
    >
      <View className="flex-1 gap-section-sm p-gutter-sm" testID="page-content">
        <Strips {...args} />
        <PageBody />
      </View>
    </WorkoutShell>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** The round 3 picks: a set, its rest, the right side fatigued, the right Voltra dropped mid-set. */
export const ChosenPair: Story = {}

/** A 12-rep target with 19-character names, one side at zero reps with no names set, 999 s rest after 12. */
export const StressPair: Story = { args: { frame: 'stress' } }
