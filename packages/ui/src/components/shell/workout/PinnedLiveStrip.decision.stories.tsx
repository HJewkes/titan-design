import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../custom/Typography'
import { WorkoutShell } from './WorkoutShell'
import { PinnedLiveStrip, type PinnedLiveStripWallSize } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S, type LiveStripScenario } from './pinnedLiveStrip-fixture'

interface DecisionArgs {
  scenario: LiveStripScenario
  wallSize: PinnedLiveStripWallSize
}

const SHELL_STATE = { set: 'live', fatigue: 'live', rest: 'rest', idle: 'idle' } as const

/** A neutral stand-in for whichever non-live page the lifter navigated to. */
function PageBody() {
  return (
    <View className="gap-section-sm">
      {['Planning', 'Per-lift', 'Whole body'].map((heading) => (
        <Surface
          key={heading}
          raise={1}
          className="p-inset-xl gap-stack-md"
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
 * VW-429 round 2: the pinned live strip as a titan component, in the wall shell.
 *
 * Round 1 chose variant B (88px) and dropped the velocity-loss text: fatigue is the strip's
 * colour and the rep bars. `wallSize: trimmed` is the 72px alternative offered because the
 * wall row felt beefy; the phone form is the same in both. Canvas width drives the layout
 * (below 640px the strip stacks), so shoot at 1920 and 360. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Pinned Live Strip',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    scenario: { control: 'inline-radio', options: ['set', 'rest', 'fatigue', 'idle'] },
    wallSize: { control: 'inline-radio', options: ['standard', 'trimmed'] },
  },
  render: ({ scenario, wallSize }) => (
    <WorkoutShell
      activeKey="program"
      liveKey={scenario === 'idle' ? null : 'live'}
      state={SHELL_STATE[scenario]}
      subtitle="planning"
    >
      <View className="flex-1 gap-section-sm p-gutter-sm" testID="page-content">
        <PinnedLiveStrip {...S[scenario]} wallSize={wallSize} />
        <PageBody />
      </View>
    </WorkoutShell>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** Set in progress, rep 5 of 8, standard 88px wall row. */
export const Set: Story = { args: { scenario: 'set', wallSize: 'standard' } }

/** Resting, 0:47 of 1:30 left. */
export const Rest: Story = { args: { scenario: 'rest', wallSize: 'standard' } }

/** Fatigued past the cut-off: strip colour and bars only, no text. */
export const Fatigue: Story = { args: { scenario: 'fatigue', wallSize: 'standard' } }

/** Idle: no strip; the page starts at the top. */
export const Idle: Story = { args: { scenario: 'idle', wallSize: 'standard' } }

/** The trimmed 72px wall row, set in progress. */
export const SetTrimmed: Story = { args: { scenario: 'set', wallSize: 'trimmed' } }

/** The trimmed 72px wall row, resting. */
export const RestTrimmed: Story = { args: { scenario: 'rest', wallSize: 'trimmed' } }

/** The trimmed 72px wall row, fatigued. */
export const FatigueTrimmed: Story = { args: { scenario: 'fatigue', wallSize: 'trimmed' } }
