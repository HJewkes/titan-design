// TEMPLATE: one Default story driven by args and argTypes. Variants and states are controls,
// never separate AllVariants stories. Delete this header.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Example } from './Example'

const meta: Meta<typeof Example> = {
  // Group per CLAUDE.md > Storybook Pattern: Components/Atoms|Molecules|Organisms/<Name> for ui/.
  title: 'Components/Molecules/Example',
  component: Example,
  // Status tag per packages/ui/MATURITY.md; negate the inherited default when you set one.
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { label: 'Live', isSelected: false, isDisabled: false },
  argTypes: {
    label: { control: 'text' },
    isSelected: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    // Handlers: control: false. Object props: control: 'object'.
    onSelectedChange: { action: 'selectedChange', control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes ' +
          '[Indicator](?path=/docs/components-atoms-indicator--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs) (`monoLabel`). ' +
          'Use the `isSelected` control to switch.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Example>

export const Default: Story = {}
