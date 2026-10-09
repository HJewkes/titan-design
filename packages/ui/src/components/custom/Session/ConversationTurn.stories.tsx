import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ConversationTurn } from './ConversationTurn'
import {
  SESSION_ALL_ERRORS,
  SESSION_DEFAULT,
  SESSION_HOSTILE,
  SESSION_LONG_TEXT,
  SESSION_NO_TOOLS,
  SESSION_ONE_HUGE_TURN,
  SESSION_ORIGINS,
  SESSION_PENDING,
  SESSION_TOOLS_ONLY,
} from './session-fixture'
import type { SessionTimeline, TimelineTurn } from './session-types'

const turnWhere = (s: SessionTimeline, test: (t: TimelineTurn) => boolean) => s.turns.find(test)!
const byOrigin = (origin: TimelineTurn['origin'], marker: string | null = null) =>
  turnWhere(
    SESSION_ORIGINS,
    (t) => t.origin === origin && (marker === null || t.injectedMarker === marker)
  )

const TURNS: Record<string, TimelineTurn> = {
  'prompt with tools': SESSION_DEFAULT.turns[3]!,
  'text only': SESSION_NO_TOOLS.turns[1]!,
  'tools only': SESSION_TOOLS_ONLY.turns[0]!,
  injected: byOrigin('injected', 'reminder'),
  channel: byOrigin('injected', 'channel'),
  compaction: byOrigin('compaction'),
  'all errors': SESSION_ALL_ERRORS.turns[0]!,
  pending: SESSION_PENDING.turns.at(-1)!,
  'long text': SESSION_LONG_TEXT.turns[0]!,
  markdown: SESSION_LONG_TEXT.turns[2]!,
  huge: SESSION_ONE_HUGE_TURN.turns[0]!,
  hostile: SESSION_HOSTILE.turns[0]!,
}

const meta: Meta<typeof ConversationTurn> = {
  title: 'Custom/Session/ConversationTurn',
  component: ConversationTurn,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { turn: TURNS['prompt with tools'], isDimmed: false, showDate: false, isUTC: true },
  argTypes: {
    turn: { control: 'select', options: Object.keys(TURNS), mapping: TURNS },
    expanded: { control: 'boolean' },
    isDimmed: { control: 'boolean' },
    showDate: { control: 'boolean' },
    isUTC: { control: 'boolean' },
    previewChars: { control: 'number' },
    maxToolRows: { control: 'number' },
    onExpandedChange: { control: false },
    onToolCallPress: { control: false },
    onRequestFullText: { control: false },
    roleLabels: { control: 'object' },
    linkers: { control: false },
  },
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 720 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** One turn of an agent session: its opener, the assistant’s messages in ' +
          '`seq` order and every tool call of the turn in one disclosure. User text is plain ' +
          'text; assistant text is markdown. Composes ' +
          '[ToolCallRow](?path=/docs/custom-session-toolcallrow--docs) + ' +
          '[MarkdownProse](?path=/docs/custom-prose-markdownprose--docs) + ' +
          '[Card](?path=/docs/components-molecules-card--docs) + ' +
          '[Pill](?path=/docs/components-atoms-pill--docs) + ' +
          '[Collapse](?path=/docs/components-organisms-accordion--docs) + ' +
          '[Typography](?path=/docs/foundations-typography--docs). Use the `turn` control for ' +
          'each opener and data shape. No loading state: the conversation holds the skeleton. ' +
          'Empty applies in part: a missing opener, text or tool group drops that block. No error ' +
          'state: a failed call is data, and the host renders a failed read with `Alert`. No ' +
          'disabled state: a reader, not a control.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof ConversationTurn>

export const Default: Story = {}
