import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { WorkoutShell } from './WorkoutShell'
import {
  DualPinnedLiveStrip,
  type DualPinnedLiveStripProps,
  type DualStripArrangement,
  type DualStripDropMode,
  type DualStripFatigueMark,
  type DualStripWallHeight,
} from './DualPinnedLiveStrip'
import { DUAL_STRIP_SCENARIOS as S, type DualStripScenario } from './dualPinnedLiveStrip-fixture'

type Frame = 'layout' | 'fatigue' | 'drop'

interface DecisionArgs {
  frame: Frame
  arrangement: DualStripArrangement
  wallHeight: DualStripWallHeight
  fatigueMark: DualStripFatigueMark
  dropMode: DualStripDropMode
}

// Each frame stacks the strips it compares, top to bottom.
const FRAME_STRIPS: Record<Frame, readonly DualStripScenario[]> = {
  layout: ['set', 'rest', 'longNames', 'noNames'],
  fatigue: ['fatigueRight', 'fatigueBoth'],
  drop: ['beforeDrop', 'rightDropped'],
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

function Strips({ frame, ...variant }: DecisionArgs) {
  return (
    <View className="gap-stack-md" testID="dual-strip-frame">
      {FRAME_STRIPS[frame].map((key) => {
        const props: DualPinnedLiveStripProps = { ...S[key], ...variant }
        return <DualPinnedLiveStrip key={key} {...props} onPress={goLive} />
      })}
    </View>
  )
}

/**
 * VW-439 round 1: the pinned live strip for a two-Voltra session, in the wall shell.
 *
 * Layout: A stacks Left over Right in lanes beside one diverging chart; B keeps the single strip's
 * overline-over-numeral row with one group per side. `wallHeight` shows each at its natural height
 * or forced into the single strip's 72px row. Each side carries the name the lifter gave the
 * Voltra and its own load; with no name set the side reads "Left" / "Right".
 * Fatigue: F1 reddens the whole strip and the fatigued side's name; F2 keeps a red edge and washes
 * only that side's lane and wing. Drop: D1 falls back to the single strip of the side left; D2
 * keeps both sides and dims the dropped one. Canvas width drives the layout, so shoot at 1920 and
 * 360. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Dual Pinned Live Strip',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: {
    frame: 'layout',
    arrangement: 'lanes',
    wallHeight: 'natural',
    fatigueMark: 'strip',
    dropMode: 'single',
  },
  argTypes: {
    frame: { control: 'select', options: ['layout', 'fatigue', 'drop'] },
    arrangement: { control: 'inline-radio', options: ['lanes', 'side-by-side'] },
    wallHeight: { control: 'inline-radio', options: ['natural', 'fixed'] },
    fatigueMark: { control: 'inline-radio', options: ['strip', 'slot'] },
    dropMode: { control: 'inline-radio', options: ['single', 'dimmed'] },
  },
  render: (args) => (
    <WorkoutShell activeKey="program" liveKey="live" state="live" subtitle="planning">
      <View className="flex-1 gap-section-sm p-gutter-sm" testID="page-content">
        <Strips {...args} />
        <PageBody />
      </View>
    </WorkoutShell>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** A: lanes. Set (5 and 4 of 8), its rest, long Voltra names with a 12-rep target, no names set. */
export const LanesPair: Story = { args: { arrangement: 'lanes' } }

/** B: side by side, the same four strips. */
export const SideBySidePair: Story = { args: { arrangement: 'side-by-side' } }

/** F1 on A: right fatigued, then both. The whole strip reddens and so does the fatigued name. */
export const FatigueOneSideStrip: Story = { args: { frame: 'fatigue', fatigueMark: 'strip' } }

/** F2 on A: right fatigued, then both. A red edge, and a wash behind the fatigued lane and wing. */
export const FatigueOneSideSlot: Story = { args: { frame: 'fatigue', fatigueMark: 'slot' } }

/** D1: both sides lifting, then the right Voltra drops and the strip becomes the left's single strip. */
export const DropFallsBackToSingle: Story = { args: { frame: 'drop', dropMode: 'single' } }

/** D2: both sides lifting, then the right Voltra drops; both sides stay, the right one dimmed. */
export const DropKeepsDualDimmed: Story = { args: { frame: 'drop', dropMode: 'dimmed' } }
