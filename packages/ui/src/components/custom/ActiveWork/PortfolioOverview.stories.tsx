import type { Meta, StoryObj } from '@storybook/react-vite'
import { PortfolioOverview } from './PortfolioOverview'

const meta: Meta<typeof PortfolioOverview> = {
  title: 'ActiveWork/PortfolioOverview',
  component: PortfolioOverview,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** At-a-glance status across every tracked initiative: a KPI row ' +
          'followed by initiative groups. Composes ' +
          '[Card](?path=/docs/components-card--docs), ' +
          '[Metric](?path=/docs/components-molecules-metric--docs), ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs), and ' +
          '[InitiativeCard](?path=/docs/activework-initiativecard--docs). ' +
          'Presentational only — the caller supplies `stats` and `sections`.',
      },
    },
  },
  args: {
    title: 'Portfolio',
    subtitle: '2 initiatives · 6 open tasks',
    stats: [
      { value: '1', label: 'Focused' },
      { value: '6', label: 'Open tasks' },
      { value: '2', label: 'Initiatives' },
      { value: '2', label: 'With open work' },
    ],
    sections: [
      {
        heading: 'Focused · by rank',
        items: [
          {
            title: 'active-work — durable workspace state',
            slug: 'active-work',
            state: 'focused',
            rank: 1,
            shipTarget: '2026-Q3',
            openCount: 4,
            severityCounts: { critical: 0, high: 1, medium: 2, low: 1 },
            topTask: { id: 'AW-6', title: 'Linear / Jira / Slack discovery sources' },
          },
        ],
      },
      {
        heading: 'Backburner',
        items: [
          {
            title: 'Computer organization — review legacy project dirs',
            slug: 'computer-organization',
            state: 'backburner',
            openCount: 2,
            severityCounts: { critical: 0, high: 0, medium: 0, low: 2 },
            topTask: { id: 'CO-1', title: 'Review ~/Documents/projects/agents-skills' },
          },
        ],
      },
    ],
  },
}
export default meta
type Story = StoryObj<typeof PortfolioOverview>

export const Default: Story = {}

export const NoOpenWork: Story = {
  args: {
    subtitle: '2 initiatives · 0 open tasks',
    stats: [
      { value: '0', label: 'Focused' },
      { value: '0', label: 'Open tasks' },
      { value: '2', label: 'Initiatives' },
      { value: '0', label: 'With open work' },
    ],
    sections: [
      {
        heading: 'Backburner',
        items: [
          {
            title: 'Audiobook app',
            slug: 'audiobook',
            state: 'backburner',
            openCount: 0,
            severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
          },
        ],
      },
    ],
  },
}
