import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../custom/Typography'
import { WorkoutShell } from './WorkoutShell'
import { PinnedLiveStrip, type PinnedLiveStripRestNumeral } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S, type LiveStripScenario } from './pinnedLiveStrip-fixture'

type DecisionScenario = LiveStripScenario | 'pair' | 'pairLong'

interface DecisionArgs {
  scenario: DecisionScenario
  restNumeral?: PinnedLiveStripRestNumeral
}

const SHELL_STATE: Record<DecisionScenario, 'live' | 'rest' | 'idle'> = {
  set: 'live',
  fatigue: 'live',
  longName: 'live',
  rest: 'rest',
  restLong: 'rest',
  pair: 'rest',
  pairLong: 'rest',
  idle: 'idle',
}

/** A neutral stand-in for whichever non-live page the lifter navigated to. */
function PageBody() {
  return (
    <View className="gap-section-sm">
      {['Planning', 'Per-lift', 'Whole body'].map((heading) => (
        <Surface
          key={heading}
          raise={1}
          className="gap-stack-md p-inset-xl"
          style={{ minHeight: 180 }}
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

/** The set strip above its rest strip, so a shift between the two is visible. */
function Strips({ scenario, restNumeral }: DecisionArgs) {
  if (scenario !== 'pair' && scenario !== 'pairLong') {
    return <PinnedLiveStrip {...S[scenario]} restNumeral={restNumeral} />
  }
  const rest = scenario === 'pair' ? S.rest : S.restLong
  return (
    <View className="gap-stack-md" testID="live-strip-pair">
      <PinnedLiveStrip {...S.set} restNumeral={restNumeral} />
      <PinnedLiveStrip {...rest} restNumeral={restNumeral} />
    </View>
  )
}

/**
 * VW-429: the pinned live strip, CHOSEN design, in the wall shell.
 *
 * CHOSEN so far: the 72px wall row (88px NOT CHOSEN, round 2); fatigue as red edge and wash only;
 * the rest line running into the left edge; on a phone "Set 2/3" and the chevron stay pinned top
 * right while the title wraps (round 4; "drop under" and "chevron only" NOT CHOSEN, REJECTED.md).
 * Round 5 compares rest numerals as set/rest PAIRS (`restNumeral`): clock, smallClock, seconds.
 * Canvas width drives the layout (below 640px the strip stacks), so shoot at 1920 and 360.
 * Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Pinned Live Strip',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    scenario: {
      control: 'select',
      options: ['set', 'rest', 'restLong', 'fatigue', 'idle', 'longName', 'pair', 'pairLong'],
    },
    restNumeral: { control: 'inline-radio', options: ['clock', 'smallClock', 'seconds'] },
  },
  render: (args) => (
    <WorkoutShell
      activeKey="program"
      liveKey={args.scenario === 'idle' ? null : 'live'}
      state={SHELL_STATE[args.scenario]}
      subtitle="planning"
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

/** Set in progress, rep 5 of 8. */
export const Set: Story = { args: { scenario: 'set' } }

/** Resting, 0:47 of 1:30 left; the time bar runs out of the left edge. */
export const Rest: Story = { args: { scenario: 'rest' } }

/** Fatigued past the cut-off: red edge and wash only, no text. */
export const Fatigue: Story = { args: { scenario: 'fatigue' } }

/** Idle: no strip; the page starts at the top. */
export const Idle: Story = { args: { scenario: 'idle' } }

/** A long exercise name: on a phone it wraps beside the pinned "Set 2/3" and chevron. */
export const LongName: Story = { args: { scenario: 'longName' } }

/** r1: m:ss at the hero size in a slot that always fits "12/12" (the round-4 build). */
export const RestPairClock: Story = { args: { scenario: 'pair', restNumeral: 'clock' } }

/** r2: m:ss at the velocity size; the slot fits the set's rep count and the smaller clock. */
export const RestPairSmallClock: Story = { args: { scenario: 'pair', restNumeral: 'smallClock' } }

/** r3: seconds only ("47s") at the hero size; the slot fits two-digit seconds. */
export const RestPairSeconds: Story = { args: { scenario: 'pair', restNumeral: 'seconds' } }

/** r3 above 99s: "150s" needs a three-digit slot, so the velocity and bars shift at set to rest. */
export const RestPairSecondsLong: Story = { args: { scenario: 'pairLong', restNumeral: 'seconds' } }
