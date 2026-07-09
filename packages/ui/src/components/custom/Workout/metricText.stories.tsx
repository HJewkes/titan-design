import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MetricCell } from './metricText'

/**
 * `MetricCell` — the shared "segmented metric" typography primitive (Inter · 600 ·
 * letter-spacing 1). Value cells take a primary color, separators a muted one. The
 * single source of the value/separator look shared by SetsRepsLoad and TempoDisplay.
 */
const meta: Meta<typeof MetricCell> = {
  title: 'Shell/SessionRail/ExerciseCardHeading/ExerciseHeading/SetsRepsLoad/MetricCell',
  component: MetricCell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Primitive.** The shared Inter·600·letter-spacing-1 value/separator cell. ' +
          'Extracted so the two prescription readouts read as one visual language instead of ' +
          'drifting copies. Used-by ↑ ' +
          '[SetsRepsLoad](?path=/docs/shell-sessionrail-exercisecardheading-exerciseheading-setsrepsload--docs) + ' +
          '[TempoDisplay](?path=/docs/shell-sessionrail-exercisecardheading-exerciseheading-tempodisplay--docs).',
      },
    },
  },
  argTypes: {
    color: { control: 'color' },
    fontSize: { control: { type: 'range', min: 9, max: 24, step: 1 } },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 20, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MetricCell>

export const ValueCell: Story = {
  args: { children: '145', color: '#F3F4F6', fontSize: 11 },
}

export const Separator: Story = {
  args: { children: '×', color: '#6B7280', fontSize: 11 },
  parameters: { docs: { description: { story: 'A muted separator cell (× / @ / -).' } } },
}

export const InContext: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <MetricCell color="#F3F4F6">5</MetricCell>
      <MetricCell color="#6B7280">&nbsp;×&nbsp;</MetricCell>
      <MetricCell color="#F3F4F6">8</MetricCell>
      <MetricCell color="#6B7280">&nbsp;@&nbsp;</MetricCell>
      <MetricCell color="#F3F4F6">145</MetricCell>
      <MetricCell color="#6B7280">&nbsp;lb</MetricCell>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Value + separator cells composed into the sets × reps @ load language.',
      },
    },
  },
}
