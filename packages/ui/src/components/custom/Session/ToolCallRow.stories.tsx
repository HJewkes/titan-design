import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ToolCallRow } from './ToolCallRow'
import {
  SESSION_ALL_ERRORS,
  SESSION_DEFAULT,
  SESSION_HOSTILE,
  SESSION_PENDING,
} from './session-fixture'
import type { SessionTimeline, TimelineToolCall } from './session-types'

const callsOf = (s: SessionTimeline) => s.turns.flatMap((t) => t.toolCalls)
const first = (s: SessionTimeline, test: (c: TimelineToolCall) => boolean) => callsOf(s).find(test)!

const SUCCEEDED = first(SESSION_DEFAULT, (c) => c.outcome === 'success' && c.name === 'Read')

const CALLS: Record<string, TimelineToolCall> = {
  success: SUCCEEDED,
  error: first(SESSION_ALL_ERRORS, () => true),
  unknown: { ...SUCCEEDED, outcome: 'unknown', durationMs: null },
  pending: first(SESSION_PENDING, (c) => c.outcome === 'pending'),
  subagent: first(SESSION_DEFAULT, (c) => c.family === 'subagent'),
  sidechain: { ...SUCCEEDED, sidechain: true },
  'long summary': { ...SUCCEEDED, inputSummary: `src/orchard/${'pear-'.repeat(40)}ledger.ts` },
  hostile: first(SESSION_HOSTILE, (c) => (c.errorMessage ?? '').includes('<b>')),
}

const meta: Meta<typeof ToolCallRow> = {
  title: 'Custom/Session/ToolCallRow',
  component: ToolCallRow,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { call: SUCCEEDED, isUTC: true },
  argTypes: {
    call: { control: 'select', options: Object.keys(CALLS), mapping: CALLS },
    isUTC: { control: 'boolean' },
    onPress: { control: false },
  },
  decorators: [
    (Story) => (
      <View role="list" style={{ maxWidth: 640 }}>
        <View role="listitem">
          <Story />
        </View>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One tool call: time, outcome dot, family badge, tool name, what it acted ' +
          'on, the outcome in words and the observed duration. A failed call keeps its error ' +
          'text behind a disclosure, as literal text. Composes ' +
          '[ToolBadge](?path=/docs/custom-session-toolbadge--docs) + ' +
          '[Indicator](?path=/docs/components-atoms-indicator--docs) + ' +
          '[DateTime](?path=/docs/components-molecules-datetime--docs) + ' +
          '[Typography](?path=/docs/foundations-typography--docs) + ' +
          '[Collapse](?path=/docs/components-organisms-accordion--docs). Use the `call` control ' +
          'for each outcome. No loading or empty state: the host lists calls it already holds, ' +
          'and an empty summary shows the name alone. No error state: a failed call is data. ' +
          'No disabled state: without `onPress` the row is inert.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof ToolCallRow>

export const Default: Story = {}
