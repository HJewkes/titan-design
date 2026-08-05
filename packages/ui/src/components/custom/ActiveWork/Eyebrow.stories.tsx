import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eyebrow } from './Eyebrow'

const meta: Meta<typeof Eyebrow> = {
  title: 'Components/Molecules/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
  args: { children: 'Focused · by rank' },
  argTypes: {
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** An uppercase micro-label used above a value or a section of ' +
          "content. Composes [Typography](?path=/docs/custom-typography--docs)'s `overline` variant.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Eyebrow>

export const Default: Story = {}
