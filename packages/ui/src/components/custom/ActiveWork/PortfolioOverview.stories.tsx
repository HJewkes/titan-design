import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { PortfolioOverview } from './PortfolioOverview'

const meta: Meta<typeof PortfolioOverview> = {
  title: 'Custom/ActiveWork/PortfolioOverview',
  component: PortfolioOverview,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6" testID="page-surface">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** At-a-glance status across every tracked initiative: a KPI row ' +
          'followed by initiative groups. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[Metric](?path=/docs/custom-metric--docs), ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs), and ' +
          '[InitiativeCard](?path=/docs/custom-activework-initiativecard--docs). ' +
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
            title: 'alpha-project — sample workspace tracker',
            slug: 'alpha-project',
            state: 'focused',
            rank: 1,
            shipTarget: '2026-Q3',
            openCount: 4,
            severityCounts: { critical: 0, high: 1, medium: 2, low: 1 },
            topTask: { id: 'AP-6', title: 'Calendar / email / notes import sources' },
          },
        ],
      },
      {
        heading: 'Backburner',
        items: [
          {
            title: 'Garden shed — plan the spring build and materials',
            slug: 'garden-shed',
            state: 'backburner',
            openCount: 2,
            severityCounts: { critical: 0, high: 0, medium: 0, low: 2 },
            topTask: { id: 'GS-1', title: 'Price lumber for /home/example/projects/garden-shed' },
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
            title: 'Reading list',
            slug: 'reading-list',
            state: 'backburner',
            openCount: 0,
            severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
          },
        ],
      },
    ],
  },
}
