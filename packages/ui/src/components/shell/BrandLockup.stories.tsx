import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { BrandLockup } from './BrandLockup'

const meta: Meta<typeof BrandLockup> = {
  title: 'Shell/Molecules/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes [VoltrasMark](?path=/docs/shell-atoms-icons--docs) (icon) + ' +
          '[Typography](?path=/docs/custom-typography--docs) (wordmark + subtitle).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BrandLockup>

export const Default: Story = { args: {} }

export const NoSubtitle: Story = { args: { showSubtitle: false } }

export const CustomSubtitle: Story = {
  render: () => (
    <View className="gap-3">
      <BrandLockup subtitle="wall dashboard" />
      <BrandLockup subtitle="coach console" />
    </View>
  ),
}
