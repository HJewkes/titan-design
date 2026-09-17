import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Surface } from '../../ui/surface'
import { Composer } from './Composer'

const meta: Meta<typeof Composer> = {
  title: 'Custom/Chat/Composer',
  component: Composer,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The message input bar. Enter sends, Shift+Enter breaks the line. It ' +
          'sits in normal flow under the thread, so it stays above the keyboard without ' +
          'KeyboardAvoidingView. Composes ' +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Input](?path=/docs/components-input--docs) + ' +
          '[Button](?path=/docs/components-button--docs).',
      },
    },
  },
  args: {
    onSend: fn(),
    placeholder: 'Message Coach',
    isDisabled: false,
    isSending: false,
    sendLabel: 'Send',
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 390 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Composer>

export const Default: Story = {}

export const Sending: Story = { args: { value: 'Works for me.', isSending: true } }

export const Disabled: Story = { args: { isDisabled: true, placeholder: 'Chat is read-only' } }
