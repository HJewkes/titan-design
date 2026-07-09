import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ExerciseIndicator } from './ExerciseIndicator'

/**
 * `ExerciseIndicator` — a small circular chip in an exercise heading's title line
 * (PR / issue / info). `kind` is an open union backed by a config record, so the
 * taxonomy can grow without touching call sites.
 */
const meta: Meta<typeof ExerciseIndicator> = {
  title: 'Shell/SessionRail/ExerciseCard/ExerciseIndicator',
  component: ExerciseIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A small circular chip in an exercise heading title line (PR / issue / ' +
          'info); `kind` is a config-backed open union. Used-by ↑ ' +
          '[ExerciseCard](?path=/docs/shell-sessionrail-exercisecard--docs) rail heading.',
      },
    },
  },
  argTypes: {
    kind: { control: 'select', options: ['pr', 'issue', 'info'] },
    onPress: { action: 'press' },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 24, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExerciseIndicator>

export const PersonalRecord: Story = { args: { kind: 'pr' } }
export const Issue: Story = { args: { kind: 'issue' } }
export const Info: Story = { args: { kind: 'info' } }

export const AllKinds: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <ExerciseIndicator kind="pr" />
      <ExerciseIndicator kind="issue" />
      <ExerciseIndicator kind="info" />
    </View>
  ),
}
