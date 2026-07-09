import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandLockup } from './BrandLockup'

const meta: Meta<typeof BrandLockup> = {
  title: 'Shell/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs'],
  args: { subtitle: 'wall dashboard', showSubtitle: true },
  argTypes: {
    subtitle: { control: 'text' },
    showSubtitle: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes [VoltrasMark](?path=/docs/foundations-icons--docs) (icon) + ' +
          '[Typography](?path=/docs/foundations-typography--docs) (wordmark + subtitle). ' +
          'Toggle `showSubtitle` to see the responsive collapse.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BrandLockup>

export const Default: Story = {}
