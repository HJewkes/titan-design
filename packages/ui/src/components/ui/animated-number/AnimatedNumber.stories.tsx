import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatedNumber } from './AnimatedNumber'

const meta: Meta<typeof AnimatedNumber> = {
  title: 'Components/Atoms/AnimatedNumber',
  component: AnimatedNumber,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { value: 1234.5, from: 0, progress: 0.5, mode: 'count', decimals: 1, size: 'lg' },
  argTypes: {
    value: { control: 'number' },
    from: { control: 'number' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    mode: { control: 'select', options: ['count', 'reel'] },
    decimals: { control: { type: 'number', min: 0, max: 3, step: 1 } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    format: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** Composes [Typography](?path=/docs/foundations-typography--docs) (heading face, ' +
          '`tabular-nums`). Time is a prop: drag `progress` from 0 to 1. `count` rewrites the text on an ' +
          'ease-out curve; `reel` rolls one clipped column per digit, keyed by place value. At progress 1 ' +
          'the text is exactly `format(value)`, and assistive tech always hears the final value. Reduced ' +
          'motion renders the final value. Loading, empty, error and disabled do not apply: the number is ' +
          'a pure function of its props.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AnimatedNumber>

export const Default: Story = {}
