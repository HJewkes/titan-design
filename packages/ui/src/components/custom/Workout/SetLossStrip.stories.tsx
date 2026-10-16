import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { SetLossStrip } from './SetLossStrip'
import {
  BILATERAL_SETS,
  NOT_SCORED_SETS,
  NO_DATA_SETS,
  SESSION_SETS,
  WARMUP_SETS,
} from './setLossStripFixture'

const meta: Meta<typeof SetLossStrip> = {
  title: 'Custom/Workout/SetLossStrip',
  component: SetLossStrip,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    sets: SESSION_SETS,
    markedIndex: 4,
    markedTone: 'warning',
    markedLabel: 'Grinding',
    bestE1rmIndex: 2,
    scale: 'phone',
    columns: 4,
  },
  argTypes: {
    sets: { control: 'object' },
    thresholds: { control: 'object' },
    lossCeilingPct: { control: { type: 'number', min: 10, max: 100, step: 5 } },
    markedIndex: { control: 'number' },
    markedTone: { control: 'select', options: ['success', 'warning', 'error', 'neutral'] },
    markedLabel: { control: 'text' },
    bestE1rmIndex: { control: 'number' },
    scale: { control: 'select', options: ['phone', 'wall'] },
    columns: { control: 'number' },
  },
  decorators: [
    (Story) => (
      // Light-theme categorical-0 clears 3:1 only on a raised plane, so the strip sits on one.
      <Surface level="raised" className="self-start p-inset-md">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Custom/Workout** — one exercise’s sets as velocity-loss bars on a fixed scale against ' +
          'the VL lines, with set, reps, load and e1RM rows aligned under each bar. Composes ' +
          '[StatusGlyph](?path=/docs/components-atoms-statusglyph--docs) (the marked set), ' +
          '[Indicator](?path=/docs/components-atoms-indicator--docs) (best e1RM), ' +
          '[Typography](?path=/docs/foundations-typography--docs), `DashedReferenceLine` from ' +
          'VelocityLossBands and the GoalTrajectoryCalibrating hatch (no data). Loading, error and ' +
          'disabled do not apply: the strip renders a finished session its parent already holds and ' +
          'takes no input. An exercise with no sets renders no strip; the parent omits it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SetLossStrip>

export const Default: Story = {}

export const NoData: Story = {
  args: { sets: NO_DATA_SETS, markedIndex: 3, markedTone: 'error', bestE1rmIndex: 1 },
}

export const WarmUp: Story = {
  args: { sets: WARMUP_SETS, markedIndex: 4, markedTone: 'success', markedLabel: 'Moved well' },
}

export const NotScored: Story = {
  args: { sets: NOT_SCORED_SETS, markedIndex: 3, markedTone: 'neutral', markedLabel: 'Steady' },
}

export const Bilateral: Story = {
  args: { sets: BILATERAL_SETS, markedIndex: 4, markedTone: 'warning', bestE1rmIndex: undefined },
}
