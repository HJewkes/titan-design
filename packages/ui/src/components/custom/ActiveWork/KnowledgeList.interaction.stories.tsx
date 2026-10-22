// The list's keyboard path as play functions, in a real browser. Hidden from the sidebar and
// docs (`!dev`, `!autodocs`); `KnowledgeList.test.tsx` covers the same path in jsdom.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Surface } from '../../ui/surface'
import { KnowledgeList, type KnowledgeListProps } from './KnowledgeList'
import { KNOWLEDGE_ITEMS, KNOWLEDGE_NOW } from './knowledge-fixture'

const meta: Meta<KnowledgeListProps> = {
  title: 'Custom/ActiveWork/KnowledgeList/Interactions',
  component: KnowledgeList,
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  args: {
    items: KNOWLEDGE_ITEMS,
    now: KNOWLEDGE_NOW,
    table: { pageSize: 10 },
    onSelectedIdChange: fn(),
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <View className="w-full max-w-[1100px]">
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta
type Story = StoryObj<KnowledgeListProps>

export const EnterOnATitleSelectsItsRow: Story = {
  play: async ({ canvasElement, args }) => {
    const row = within(canvasElement).getAllByTestId('knowledge-row')[1]!
    const link = within(row).getByRole('link')
    link.focus()
    await expect(args.onSelectedIdChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(row).toHaveAttribute('aria-current', 'true'))
    await expect(args.onSelectedIdChange).toHaveBeenCalledTimes(1)
  },
}

export const EnterOnAHeaderCyclesTheSort: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('button', { name: 'Sort by Title' })
    header.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(canvas.getByRole('columnheader', { name: /Title/ })).toHaveAttribute(
        'aria-sort',
        'ascending'
      )
    )
  },
}
