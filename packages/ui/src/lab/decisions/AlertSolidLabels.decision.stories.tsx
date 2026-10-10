import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertSolidOptions, OPTIONS } from './alert-solid-options'

/**
 * TD-482 (#444): the solid Alert label, glyph and material options from Gate 2 batch 5
 * round 2, for the owner to pick between. Option 1 is what the component ships. Each row
 * is captioned with its measured WCAG ratio (label hex on `-solid` fill hex). Switch the
 * `option` control; the theme toolbar switches the fills.
 */
const meta: Meta<typeof AlertSolidOptions> = {
  title: 'Lab/Decisions/Alert Solid Labels',
  component: AlertSolidOptions,
  tags: ['status:lab', '!status:review'],
  args: { option: 'white-paper' },
  argTypes: {
    option: {
      control: 'select',
      options: Object.keys(OPTIONS),
      description: Object.entries(OPTIONS)
        .map(([key, spec]) => `\`${key}\`: ${spec.title}`)
        .join('. '),
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Lab decision** for [Alert](?path=/docs/components-molecules-alert--docs) `variant="solid"`. ' +
          'The 14px label needs 4.5:1 (AA); the 20px bold glyph is large text and needs 3:1. ' +
          'No token or primitive is added: every label colour is an existing `on-status-*` token, ' +
          "a rung of the tone's own ramp, or grey 950.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AlertSolidOptions>

export const Default: Story = {}
