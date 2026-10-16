// Keyboard paths as play functions, in a real browser, because jsdom's synthetic hover and focus
// hide RNW's nested-Pressable traps. Hidden from the sidebar and docs (`!dev`, `!autodocs`).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pressable, View } from 'react-native'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { AgentHoverCard } from './AgentHoverCard'
import { AgentRoster } from './AgentRoster'
import { AGENTS_NOW, AGENT_AVAILABLE, AGENT_BLOCKED, AGENT_WORKING } from './agent-fixture'

const THREE = [AGENT_AVAILABLE, AGENT_WORKING, AGENT_BLOCKED]

function Playground() {
  return (
    <View className="gap-section-sm">
      <AgentRoster agents={THREE} now={AGENTS_NOW} />
      <AgentHoverCard agent={AGENT_BLOCKED} now={AGENTS_NOW} openDelay={0} closeDelay={0}>
        <Pressable accessibilityRole="link" onPress={() => {}} className="self-start">
          <Typography variant="body2" color="primary">
            kiln-watcher
          </Typography>
        </Pressable>
      </AgentHoverCard>
    </View>
  )
}

const meta: Meta = {
  title: 'Custom/Agents/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: 360 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
  render: () => <Playground />,
}
export default meta
type Story = StoryObj

function option(canvas: HTMLElement, name: string) {
  return within(canvas).getByRole('option', { name: new RegExp(`^${name},`) })
}

export const RosterArrowsMoveFocusAndEnterSelects: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(option(canvasElement, 'kiln-watcher')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(option(canvasElement, 'orchard-planner')).toHaveFocus()
    await expect(option(canvasElement, 'orchard-planner')).toHaveAttribute('aria-selected', 'false')
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(option(canvasElement, 'orchard-planner')).toHaveAttribute('aria-selected', 'true')
    )
    await userEvent.keyboard('{End}')
    await expect(option(canvasElement, 'quarry-scout')).toHaveFocus()
    await userEvent.keyboard(' ')
    await waitFor(() =>
      expect(option(canvasElement, 'quarry-scout')).toHaveAttribute('aria-selected', 'true')
    )
    await userEvent.keyboard('{Home}')
    await expect(option(canvasElement, 'kiln-watcher')).toHaveFocus()
  },
}

export const HoverCardOpensOnFocusAndClosesOnEscape: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'kiln-watcher' })
    link.focus()
    const card = await within(document.body).findByRole('tooltip')
    await expect(card).toHaveTextContent('Needs approval to rotate the kiln schedule')
    await expect(link).toHaveAttribute('aria-describedby', card.id)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull())
  },
}
