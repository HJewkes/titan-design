import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from './Kbd'

const meta: Meta<typeof Kbd> = {
  title: 'Components/Atoms/Kbd',
  component: Kbd,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { keys: ['⌘', 'K'], size: 'sm' },
  argTypes: {
    keys: { control: 'object' },
    size: { control: 'select', options: ['sm', 'md'] },
    accessibilityLabel: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A display-only keyboard shortcut hint, one keycap per key; the root carries the ' +
          'spoken name ("Command K"). Composes [Typography](?path=/docs/foundations-typography--docs) ' +
          '(`mono`).\n\n' +
          '**States.** Loading: does not apply, because keys are static strings. Empty: `keys=[]` ' +
          'renders null. Error: does not apply, because there is no data source. Disabled: does not ' +
          'apply, because Kbd is not interactive. A disabled row dims its own content.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {}
