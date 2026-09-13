import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Sparkline } from './Sparkline'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const meta: Meta<typeof Sparkline> = {
  title: 'Custom/Workout/DataViz/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'number',
      description: 'Chart width in pixels',
    },
    height: {
      control: 'number',
      description: 'Chart height in pixels',
    },
    color: {
      control: 'color',
      description: 'Line and dot color',
    },
    showDots: {
      control: 'boolean',
      description: 'Show dots at data points',
    },
    highlightLast: {
      control: 'boolean',
      description: 'Highlight the last data point with a larger dot',
    },
  },
}

export default meta
type Story = StoryObj<typeof Sparkline>

const ascending = [10, 15, 22, 28, 35, 42, 50]
const descending = [50, 45, 38, 30, 22, 15, 10]
const uCurve = [40, 25, 15, 10, 12, 20, 35]
const flat = [20, 21, 19, 20, 21, 20, 19]
const volatile = [10, 35, 15, 45, 20, 40, 25]

export const Default: Story = {
  args: {
    data: ascending,
  },
}

export const Ascending: Story = {
  args: {
    data: ascending,
    showDots: true,
  },
}

export const Descending: Story = {
  args: {
    data: descending,
    showDots: true,
    color: t['status-error-vivid'],
  },
}

export const UCurve: Story = {
  args: {
    data: uCurve,
    showDots: true,
    color: t['status-success'],
  },
}

export const Flat: Story = {
  args: {
    data: flat,
    showDots: true,
    color: t['status-warning-light'],
  },
}

export const WithReferenceLines: Story = {
  args: {
    data: ascending,
    showDots: true,
    referenceLines: [
      { value: 30, color: t['status-error-vivid'], dashed: true },
      { value: 45, color: t['status-success'], dashed: false },
    ],
  },
}

export const HighlightLast: Story = {
  args: {
    data: ascending,
    highlightLast: true,
  },
}

export const DotsAndHighlightLast: Story = {
  args: {
    data: volatile,
    showDots: true,
    highlightLast: true,
    color: t['status-warning'],
  },
}

export const CustomSize: Story = {
  args: {
    data: ascending,
    width: 120,
    height: 50,
    showDots: true,
  },
}

export const AllShapes: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 16 }}>
      <Sparkline data={ascending} showDots highlightLast />
      <Sparkline data={descending} showDots color={t['status-error-vivid']} />
      <Sparkline data={uCurve} showDots color={t['status-success']} />
      <Sparkline data={flat} showDots color={t['status-warning-light']} />
      <Sparkline data={volatile} showDots color={t['status-warning']} highlightLast />
    </View>
  ),
}
