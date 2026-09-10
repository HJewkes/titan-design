import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { Surface } from '../../ui/surface'
import { SessionList } from './SessionList'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

/**
 * **SessionList** — the selectable list half of the session reader. The host
 * holds `selectedId`; this story keeps it in Storybook args so clicking a row
 * updates the Controls panel.
 *
 * Composes `Eyebrow` · `SessionListItem`.
 */
const meta: Meta<typeof SessionList> = {
  title: 'Custom/ActiveWork/SessionList',
  component: SessionList,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    sessions: SESSION_FIXTURE,
    now: SESSION_NOW,
    selectedId: SESSION_FIXTURE[0]!.id,
  },
  argTypes: {
    sessions: { table: { disable: true } },
    now: { table: { disable: true } },
    selectedId: { control: 'select', options: SESSION_FIXTURE.map((s) => s.id) },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return <SessionList {...args} onSelect={(s) => updateArgs({ selectedId: s.id })} />
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen w-72 p-6" testID="page-surface">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composes **Eyebrow** · **Divider** · **SessionListItem**. Used-by ↑ the Session Reader composition. Selection is controlled by the host; sessions group under a month divider once the list spans more than one.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof SessionList>

/** Six sessions across two months, newest selected. */
export const Default: Story = {}

/** One month only: no period dividers. */
export const SingleMonth: Story = {
  args: { sessions: SESSION_FIXTURE.filter((s) => s.ended.startsWith('2026-07')) },
}

/** Nothing selected yet. */
export const NoSelection: Story = {
  args: { selectedId: undefined },
}

/** A custom heading in place of the count. */
export const CustomLabel: Story = {
  args: { label: 'Recent sessions' },
}
