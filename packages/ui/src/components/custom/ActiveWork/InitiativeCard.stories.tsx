import type { Meta, StoryObj } from '@storybook/react-vite'
import { InitiativeCard } from './InitiativeCard'

const meta: Meta<typeof InitiativeCard> = {
  title: 'ActiveWork/InitiativeCard',
  component: InitiativeCard,
  tags: ['autodocs'],
  args: {
    title: 'active-work — durable workspace state',
    slug: 'active-work',
    state: 'focused',
    rank: 1,
    shipTarget: '2026-Q3',
    openCount: 4,
    severityCounts: { critical: 0, high: 1, medium: 2, low: 1 },
    topTask: { id: 'AW-6', title: 'Linear / Jira / Slack discovery sources' },
  },
  argTypes: {
    state: { control: 'select', options: ['focused', 'backburner', 'paused', 'done'] },
    rank: { control: 'number' },
    shipTarget: { control: 'text' },
    openCount: { control: 'number' },
    severityCounts: { control: 'object' },
    topTask: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Card.** An at-a-glance summary of one initiative: state, rank, open-task ' +
          'count, a severity-mix bar, and its top-priority open task. Composes ' +
          '[Card](?path=/docs/components-card--docs), ' +
          '[Pill](?path=/docs/components-pill--docs), StatusDot, and SegmentedBar ' +
          '(from the Workout family). Used by ' +
          '[PortfolioOverview](?path=/docs/activework-portfoliooverview--docs).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof InitiativeCard>

export const Default: Story = {}

export const NoOpenTasks: Story = {
  args: {
    state: 'done',
    rank: undefined,
    openCount: 0,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    topTask: undefined,
  },
}

export const Backburner: Story = {
  args: {
    state: 'backburner',
    rank: undefined,
    shipTarget: undefined,
    openCount: 2,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 2 },
    topTask: { id: 'CO-1', title: 'Review ~/Documents/projects/agents-skills — archived' },
  },
}
