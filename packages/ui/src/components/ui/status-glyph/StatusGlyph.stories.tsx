import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusGlyph } from './StatusGlyph'

const meta: Meta<typeof StatusGlyph> = {
  title: 'Components/Atoms/StatusGlyph',
  component: StatusGlyph,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { tone: 'error', label: 'Failed', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: ['success', 'warning', 'error', 'neutral'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    label: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** One status condition as a shaped mark: circle-check (success), alert-triangle ' +
          '(warning), octagon-x (error) or a dashed ring (neutral), filled with the matching ' +
          '`status-*` token (`text-secondary` for neutral). The shape differs per tone, so status ' +
          'never rests on colour alone, and `label` is the accessible name. It is the collapsed ' +
          'form of a status word (design floor F1/F2): a consumer that hides the word wraps the ' +
          'glyph in [Tooltip](?path=/docs/components-molecules-tooltip--docs) with the same word. ' +
          'Composes the [icon set](?path=/docs/foundations-icons--docs). Loading, empty, error and ' +
          'disabled states do not apply: it renders a value its parent already holds and takes no input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StatusGlyph>

export const Default: Story = {}
