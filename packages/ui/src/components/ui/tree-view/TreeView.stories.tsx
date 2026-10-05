import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TreeViewStory, type TreeViewStoryArgs } from './fixture-slots'
import { fixtures } from './fixtures'
import { TreeView } from './TreeView'

const meta: Meta<TreeViewStoryArgs> = {
  title: 'Components/Organisms/TreeView',
  component: TreeView as Meta<TreeViewStoryArgs>['component'],
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    fixture: 'default',
    density: 'comfortable',
    height: 360,
    isDisabled: false,
    isLoading: false,
    isTruncated: false,
    onSelect: fn(),
    onLoadChildren: fn(),
  },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(fixtures) },
    density: { control: 'inline-radio', options: ['comfortable', 'dense'] },
    height: { control: { type: 'number', min: 120, step: 40 } },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isTruncated: { control: 'boolean' },
    onSelect: { control: false },
    onLoadChildren: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** An APG Tree View over a flat `parentId` list, windowed through `computeWindow` ' +
          'when `height` is set. Composes [Typography](?path=/docs/foundations-typography--docs), ' +
          '[Spinner](?path=/docs/components-atoms-spinner--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs). Children load lazily: ' +
          'expanding a row whose children are not loaded shows a Spinner, and this story’s load ' +
          'fails, so the row closes again for a retry. Use the `fixture` control for the 11 fixtures.',
      },
    },
  },
  render: function Render(args) {
    return <TreeViewStory {...args} />
  },
}
export default meta
type Story = StoryObj<TreeViewStoryArgs>

export const Default: Story = {}
