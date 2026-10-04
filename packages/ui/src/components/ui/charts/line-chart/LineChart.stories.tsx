import type { Meta, StoryObj } from '@storybook/react-vite'

import { byName, lineFixtures } from './fixtures'
import { LineChart } from './LineChart'
import type { LineChartProps } from './types'

type Args = Omit<LineChartProps, 'series' | 'metricLabel'> & { fixture: string }

const meta: Meta<Args> = {
  title: 'Components/Organisms/LineChart',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    fixture: 'Default',
    width: 720,
    height: 320,
    isLoading: false,
    animate: true,
    showLegend: false,
  },
  argTypes: {
    fixture: { control: 'select', options: lineFixtures.map((fixture) => fixture.name) },
    width: { control: { type: 'range', min: 240, max: 1200, step: 20 } },
    height: { control: { type: 'range', min: 160, max: 600, step: 20 } },
    xScale: { control: 'select', options: [undefined, 'time', 'linear'] },
    isLoading: { control: 'boolean' },
    animate: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    defaultActivePointId: { control: 'text' },
    onPointPress: { control: false },
    onActivePointChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** A line chart of one to six series, painted as one image named by a generated ' +
          'summary, with a single tab stop whose arrow keys step the points. Composes ' +
          '[Typography](?path=/docs/foundations-typography--docs) for labels, ' +
          '[Tooltip](?path=/docs/components-molecules-tooltip--docs) for the active-point readout, ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) while `isLoading`, and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs) when no series has a ' +
          'finite value. The `fixture` control switches the data; `xScale` left unset follows the ' +
          'fixture. Error does not apply: the consumer renders an Alert in place of the chart. ' +
          'Disabled does not apply to a picture, and the tab stop stays so reading is never blocked.',
      },
    },
  },
  render: ({ fixture, xScale, ...args }) => {
    const data = byName(fixture)
    return (
      <LineChart
        {...args}
        key={fixture}
        series={data.series}
        xScale={xScale ?? data.xScale}
        metricLabel={data.metricLabel}
        unit={data.unit}
        includeZero={data.includeZero}
        referenceLines={data.referenceLines}
        boundaries={data.boundaries}
      />
    )
  },
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}
