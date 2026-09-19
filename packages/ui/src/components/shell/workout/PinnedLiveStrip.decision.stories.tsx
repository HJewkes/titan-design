import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { WorkoutShell } from './WorkoutShell'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S, type LiveStripScenario } from './pinnedLiveStrip-fixture'

type DecisionScenario = LiveStripScenario | 'pair' | 'pairTwoDigit' | 'noLink'

interface DecisionArgs {
  scenario: DecisionScenario
  /** `pair` only: the rest's seconds left. */
  restSeconds?: number
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
  noLink: 'live',
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
// Stands in for the consumer's navigation: every strip here is the link back to live but `noLink`.
const goLive = () => undefined

/** A consumer with nowhere to navigate: a status region, no button and no chevron, set over rest. */
function NoLinkStrips() {
  return (
    <View className="gap-stack-md" testID="live-strip-no-link">
      <PinnedLiveStrip {...S.set} />
      <PinnedLiveStrip {...S.rest} />
    </View>
  )
}

function Strips({ scenario, restSeconds = 47 }: DecisionArgs) {
  if (scenario === 'noLink') return <NoLinkStrips />
  if (scenario === 'pairTwoDigit') {
    return (
      <View className="gap-stack-md" testID="live-strip-pair">
        <PinnedLiveStrip {...S.setTwoDigit} onPress={goLive} />
        <PinnedLiveStrip {...S.restTwoDigit} onPress={goLive} />
      </View>
    )
  }
  if (scenario !== 'pair') return <PinnedLiveStrip {...S[scenario]} onPress={goLive} />
  const restMs = restSeconds * 1000
  return (
    <View className="gap-stack-md" testID="live-strip-pair">
      <PinnedLiveStrip {...S.set} onPress={goLive} />
      <PinnedLiveStrip
        {...S.rest}
        onPress={goLive}
        restRemainingMs={restMs}
        restDurationMs={Math.max(90_000, restMs * 1.2)}
      />
    </View>
  )
}

/**
 * VW-429: the pinned live strip, CHOSEN design, in the wall shell.
 *
 * CHOSEN: the 72px wall row (88px NOT CHOSEN, round 2); fatigue as red edge and wash only; the
 * rest line running into the left edge; on a phone "Set 2/3" and the chevron pinned top right while
 * the title wraps (round 4). Rest reads seconds only (round 5; m:ss NOT CHOSEN) in the set's slot;
 * from 100s the digits step down one size, centred on the full-size digits: 36px wall, 32px phone
 * with an 8px value gap (round 7; baseline-aligned and smaller steps NOT CHOSEN). See REJECTED.md.
 * The RestPair stories show the set strip above its rest strip: nothing moves between them.
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
      options: ['set', 'rest', 'fatigue', 'idle', 'longName', 'pair', 'pairTwoDigit', 'noLink'],
    },
    restSeconds: { control: { type: 'number', min: 0, max: 999 } },
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

/** No `onPress` (functional review A4): a status region, set over rest, with no "Back to live" and no chevron. */
export const NoLink: Story = { args: { scenario: 'noLink' } }
