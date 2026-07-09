import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Tile } from './Tile'
import { getSemanticColors } from '../../../theme'

const ACCENT = getSemanticColors('dark')['status-warning']
const SUCCESS = getSemanticColors('dark')['status-success']

const meta: Meta<typeof Tile> = {
  title: 'Components/Atoms/Tile',
  component: Tile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '**Atom.** A compact card preset; grouped by SessionMetrics / ScheduleTiles.',
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Uppercase micro-label' },
    value: { control: 'text', description: 'Primary mono value' },
    valueColor: { control: 'color', description: 'Tints the value' },
    align: {
      control: 'radio',
      options: ['center', 'start'],
      description: 'Content alignment',
    },
  },
}

export default meta
type Story = StoryObj<typeof Tile>

export const Default: Story = {
  args: {
    label: 'Volume',
    value: '76%',
    align: 'center',
  },
}

export const Row: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 4, width: 246 }}>
      <Tile label="Volume" value="76%" />
      <Tile label="Load" value="7.3k" />
      <Tile label="Fatigue" value="MOD" valueColor={ACCENT} />
    </View>
  ),
}

export const ScheduleTiles: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 4, width: 246 }}>
      <Tile label="Date" value="Jul 10" />
      <Tile label="Time" value="6:30 PM" />
      <Tile label="Until" value="5h" valueColor={ACCENT} />
    </View>
  ),
}

export const ValueColors: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 4, width: 246 }}>
      <Tile label="Default" value="12" />
      <Tile label="Success" value="OK" valueColor={SUCCESS} />
      <Tile label="Warning" value="MOD" valueColor={ACCENT} />
    </View>
  ),
}

export const StartAligned: Story = {
  args: {
    label: 'Program',
    value: 'Pull A',
    align: 'start',
  },
}
