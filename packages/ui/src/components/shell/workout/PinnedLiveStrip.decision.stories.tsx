import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../custom/Typography'
import { WorkoutShell } from './WorkoutShell'
import { PinnedLiveStrip, type PinnedLiveStripLongRest } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S, type LiveStripScenario } from './pinnedLiveStrip-fixture'

type DecisionScenario = LiveStripScenario | 'pair' | 'pairTwoDigit'

interface DecisionArgs {
  scenario: DecisionScenario
  /** `pair` only: the rest's seconds left. */
  restSeconds?: number
  longRest?: PinnedLiveStripLongRest
}

const SHELL_STATE: Record<DecisionScenario, 'live' | 'rest' | 'idle'> = {
  set: 'live',
  fatigue: 'live',
  longName: 'live',
  setTwoDigit: 'live',
  rest: 'rest',
  restTwoDigit: 'rest',
  pair: 'rest',
  pairTwoDigit: 'rest',
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
function Strips({ scenario, restSeconds = 47, longRest }: DecisionArgs) {
  if (scenario === 'pairTwoDigit') {
    return (
      <View className="gap-stack-md" testID="live-strip-pair">
        <PinnedLiveStrip {...S.setTwoDigit} longRest={longRest} />
        <PinnedLiveStrip {...S.restTwoDigit} longRest={longRest} />
      </View>
    )
  }
  if (scenario !== 'pair') return <PinnedLiveStrip {...S[scenario]} />
  const restMs = restSeconds * 1000
  return (
    <View className="gap-stack-md" testID="live-strip-pair">
      <PinnedLiveStrip {...S.set} longRest={longRest} />
      <PinnedLiveStrip
        {...S.rest}
        longRest={longRest}
        restRemainingMs={restMs}
        restDurationMs={Math.max(90_000, restMs * 1.2)}
      />
    </View>
  )
}

/**
 * VW-429: the pinned live strip, CHOSEN design, in the wall shell.
 *
 * CHOSEN so far: the 72px wall row (88px NOT CHOSEN, round 2); fatigue as red edge and wash only;
 * the rest line running into the left edge; on a phone "Set 2/3" and the chevron stay pinned top
 * right while the title wraps (round 4; "drop under" and "chevron only" NOT CHOSEN, REJECTED.md).
 * Round 5 CHOSE seconds only ("47s") for the rest countdown (m:ss at full and at reduced size NOT
 * CHOSEN). Round 6: from 100s the seconds step down one type size inside the set's slot, shown as
 * set/rest PAIRS at 47s, 99s, 100s, 150s, 999s and on a 12-rep target. Round 7 compares long-rest
 * treatments (`longRest`): v0 on the baseline, v1 centred, v2 centred and larger, v3 larger phone.
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
      options: ['set', 'rest', 'fatigue', 'idle', 'longName', 'pair', 'pairTwoDigit'],
    },
    restSeconds: { control: { type: 'number', min: 0, max: 999 } },
    longRest: { control: 'inline-radio', options: ['v0', 'v1', 'v2', 'v3'] },
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

/** 47s left: full size. */
export const RestPair47: Story = { args: { scenario: 'pair', restSeconds: 47 } }

/** 99s left: the widest value at full size. */
export const RestPair99: Story = { args: { scenario: 'pair', restSeconds: 99 } }

/** 100s left: the first value at the reduced size. */
export const RestPair100: Story = { args: { scenario: 'pair', restSeconds: 100 } }

/** 150s left: reduced size, same slot. */
export const RestPair150: Story = { args: { scenario: 'pair', restSeconds: 150 } }

/** 999s left: the widest value the strip supports. */
export const RestPair999: Story = { args: { scenario: 'pair', restSeconds: 999 } }

/** A 12-rep target with 150s of rest: the two-digit rep slot and the reduced seconds together. */
export const RestPairTwoDigitTarget: Story = { args: { scenario: 'pairTwoDigit' } }

/** v0 at 150s: reduced digits on the shared baseline (the round-6 build). */
export const LongRestBaseline150: Story = {
  args: { scenario: 'pair', restSeconds: 150, longRest: 'v0' },
}

/** v0 at 999s. */
export const LongRestBaseline999: Story = {
  args: { scenario: 'pair', restSeconds: 999, longRest: 'v0' },
}

/** v1 at 150s: the reduced digits centred on the full-size digits. */
export const LongRestCentred150: Story = {
  args: { scenario: 'pair', restSeconds: 150, longRest: 'v1' },
}

/** v1 at 999s. */
export const LongRestCentred999: Story = {
  args: { scenario: 'pair', restSeconds: 999, longRest: 'v1' },
}

/** v2 at 150s: centred, wall step 36px in an 83px slot, phone gap 8px. */
export const LongRestLarger150: Story = {
  args: { scenario: 'pair', restSeconds: 150, longRest: 'v2' },
}

/** v2 at 999s. */
export const LongRestLarger999: Story = {
  args: { scenario: 'pair', restSeconds: 999, longRest: 'v2' },
}

/** v2 on a 12-rep target: the narrower phone gap beside "11/12". */
export const LongRestLargerTwelveReps: Story = {
  args: { scenario: 'pairTwoDigit', longRest: 'v2' },
}

/** v3 at 150s: as v2, plus a 32px phone step bought with 6px of bar width. */
export const LongRestPhoneLarge150: Story = {
  args: { scenario: 'pair', restSeconds: 150, longRest: 'v3' },
}

/** v3 at 999s. */
export const LongRestPhoneLarge999: Story = {
  args: { scenario: 'pair', restSeconds: 999, longRest: 'v3' },
}
