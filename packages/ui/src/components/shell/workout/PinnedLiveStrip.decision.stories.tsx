import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../custom/Typography'
import { WorkoutShell } from './WorkoutShell'
import { PinnedLiveStrip, type PinnedLiveStripPhoneMeta } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S, type LiveStripScenario } from './pinnedLiveStrip-fixture'

interface DecisionArgs {
  scenario: LiveStripScenario
  phoneMeta?: PinnedLiveStripPhoneMeta
}

const SHELL_STATE = {
  set: 'live',
  fatigue: 'live',
  longName: 'live',
  rest: 'rest',
  idle: 'idle',
} as const

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

/**
 * VW-429: the pinned live strip, CHOSEN design, in the wall shell.
 *
 * Round 1 (mocks) chose variant B and dropped the velocity-loss text. Round 2 CHOSE the 72px
 * trimmed wall row; the 88px row is NOT CHOSEN and deleted (REJECTED.md). Fatigue keeps the red
 * edge and wash; the tag stays the live tag. The countdown takes the rep count's fixed slot.
 * Round 4 compares three phone title rows (`phoneMeta`): flow, chevron-only, and pinned. Canvas width drives the layout (below 640px the strip stacks), so
 * shoot at 1920 and 360. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Pinned Live Strip',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    scenario: {
      control: 'inline-radio',
      options: ['set', 'rest', 'fatigue', 'idle', 'longName'],
    },
    phoneMeta: { control: 'inline-radio', options: ['flow', 'chevron', 'pinned'] },
  },
  render: ({ scenario, phoneMeta }) => (
    <WorkoutShell
      activeKey="program"
      liveKey={scenario === 'idle' ? null : 'live'}
      state={SHELL_STATE[scenario]}
      subtitle="planning"
    >
      <View className="flex-1 gap-section-sm p-gutter-sm" testID="page-content">
        <PinnedLiveStrip {...S[scenario]} phoneMeta={phoneMeta} />
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

/** Option a (flow): the long title wraps and "Set 2/3" + chevron drop under it. */
export const LongName: Story = { args: { scenario: 'longName', phoneMeta: 'flow' } }

/** Option b (chevron): the chevron stays top right, the set count is hidden, the title wraps. */
export const LongNameChevron: Story = { args: { scenario: 'longName', phoneMeta: 'chevron' } }

/** Option c (pinned): "Set 2/3" + chevron stay top right, the title wraps beside them. */
export const LongNamePinned: Story = { args: { scenario: 'longName', phoneMeta: 'pinned' } }

/** Option b with a short name. */
export const ShortNameChevron: Story = { args: { scenario: 'set', phoneMeta: 'chevron' } }

/** Option c with a short name. */
export const ShortNamePinned: Story = { args: { scenario: 'set', phoneMeta: 'pinned' } }
