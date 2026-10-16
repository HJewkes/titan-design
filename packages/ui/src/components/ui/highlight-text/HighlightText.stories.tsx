import type { Meta, StoryObj } from '@storybook/react-vite'
import { HighlightText } from './HighlightText'

const meta: Meta<typeof HighlightText> = {
  title: 'Components/Atoms/HighlightText',
  component: HighlightText,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    text: 'Open recent project',
    ranges: [
      { start: 0, end: 4 },
      { start: 12, end: 15 },
    ],
    variant: 'body2',
    color: 'primary',
  },
  argTypes: {
    text: { control: 'text' },
    ranges: { control: 'object' },
    variant: { control: 'select', options: ['body1', 'body2', 'caption', 'mono'] },
    color: { control: 'select', options: ['primary', 'disabled'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A string with matched ranges (end exclusive) emphasised by weight only, so no ' +
          'colour pair is added. Composes [Typography](?path=/docs/foundations-typography--docs). ' +
          'Loading: does not apply, because the consumer passes a loaded string. ' +
          "Empty: text `''` renders null, and ranges `[]` renders the text plain. " +
          'Error: does not apply, because there is no data source. ' +
          "Disabled: does not apply, because it is not interactive; a disabled row passes `color='disabled'`.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HighlightText>

export const Default: Story = {}
