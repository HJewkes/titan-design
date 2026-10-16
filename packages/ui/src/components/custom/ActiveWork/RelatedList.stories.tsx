import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { RelatedList } from './RelatedList'
import { REF_FIXTURE } from './ref-fixture'

const meta: Meta<typeof RelatedList> = {
  title: 'Custom/ActiveWork/RelatedList',
  component: RelatedList,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  decorators: [
    (Story) => (
      <Surface level="base" className="max-w-sm p-6">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "**List.** A detail page's related panel: refs grouped by kind in a fixed order, each group " +
          'headed by its plural and a count. Composes [RefChip](?path=/docs/custom-activework-refchip--docs), ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) (`isLoading`) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs) (the default `emptyState`; ' +
          'empty the `refs` control to see it). Error does not apply: the host that fetches the refs ' +
          'renders a failure. Disabled does not apply: the list is not a control.',
      },
    },
  },
  args: { refs: REF_FIXTURE, isLoading: false },
  argTypes: {
    refs: { control: 'object' },
    isLoading: { control: 'boolean' },
    onPressRef: { control: false },
    emptyState: { control: false },
    className: { control: false },
    testID: { control: false },
  },
}
export default meta

type Story = StoryObj<typeof RelatedList>

export const Default: Story = {}
