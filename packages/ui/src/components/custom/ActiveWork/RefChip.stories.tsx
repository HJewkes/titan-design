import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { RefChip } from './RefChip'
import { REF_KIND_ORDER } from './ref-kind'
import { TASK_PR_STATE_META } from './task-pr'

const meta: Meta<typeof RefChip> = {
  title: 'Custom/ActiveWork/RefChip',
  component: RefChip,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  decorators: [
    (Story) => (
      <Surface level="base" className="p-6">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A typed pointer at another entity: the kind glyph, the label and an optional ' +
          'status. Composes [Pill](?path=/docs/components-atoms-pill--docs) (neutral; the status is a ' +
          'nested tone pill) inside [Link](?path=/docs/components-atoms-link--docs). The kind table ' +
          '(`REF_KIND_META`, `refGraphKinds()`) is exported so a graph node of a kind matches its chip. ' +
          'With neither `href` nor `onPressRef` the chip is static: no link role, no tab stop. A real ' +
          '`<a href>` on web arrives with Link itself (TD-493). Loading, empty and error do not apply: ' +
          'a ref is already-loaded data. Disabled does not apply: a ref with nowhere to go is static.',
      },
    },
  },
  args: {
    kind: 'pr',
    id: 'pr:52',
    label: '#52',
    status: TASK_PR_STATE_META.merged,
    href: '#/prs/52',
    size: 'sm',
  },
  argTypes: {
    kind: { control: 'select', options: REF_KIND_ORDER },
    label: { control: 'text' },
    status: { control: 'object' },
    href: { control: 'text' },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    id: { control: false },
    onPressRef: { control: false },
    className: { control: false },
    testID: { control: false },
  },
}
export default meta

type Story = StoryObj<typeof RefChip>

export const Default: Story = {}
