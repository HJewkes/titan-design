import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SessionConversation } from './SessionConversation'
import { SESSION_DEFAULT, SESSION_FIXTURES } from './session-fixture'
import type { TimelineTurn } from './session-types'

const TURNS: Record<string, TimelineTurn[]> = Object.fromEntries(
  Object.entries(SESSION_FIXTURES).map(([name, session]) => [name, session.turns])
)

const meta: Meta<typeof SessionConversation> = {
  title: 'Custom/Session/SessionConversation',
  component: SessionConversation,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { turns: SESSION_DEFAULT.turns, searchQuery: '', isLoading: false, isUTC: true },
  argTypes: {
    turns: { control: 'select', options: Object.keys(TURNS), mapping: TURNS },
    searchQuery: { control: 'text' },
    isLoading: { control: 'boolean' },
    isUTC: { control: 'boolean' },
    expandedTurns: { control: 'object' },
    previewChars: { control: 'number' },
    maxToolRows: { control: 'number' },
    roleLabels: { control: 'object' },
    emptyState: { control: false },
    linkers: { control: false },
    onExpandedTurnsChange: { control: false },
    onToolCallPress: { control: false },
    onRequestFullText: { control: false },
  },
  decorators: [
    (Story) => (
      <View style={{ height: 640, maxWidth: 720 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** An agent session read back as a conversation, with the idle gaps the ' +
          'read model marked. `searchQuery` dims the turns that do not match and announces the ' +
          'count; it never opens a tool group. Not virtualised: closed tool groups mount no rows. ' +
          'Composes [ConversationTurn](?path=/docs/custom-session-conversationturn--docs) + ' +
          '[GapIndicator](?path=/docs/custom-session-gapindicator--docs) + ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) + ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs). Use the `turns` ' +
          'control for each fixture, `searchQuery` for dimming and `isLoading` for the skeleton. ' +
          'Empty: `SESSION_EMPTY` shows the default `emptyState`. No error state: the component ' +
          'holds no fetch, so the host renders a failed read with `Alert`. No disabled state: a ' +
          'reader, not a control.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof SessionConversation>

export const Default: Story = {}
