import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { Surface } from '../surface'
import { Page, PageHeader, type PageProps } from './Page'

interface StoryArgs extends PageProps {
  title: string
  description: string
  showHeader: boolean
  showTrailing: boolean
  blocks: number
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/Page',
  component: Page,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    gutter: 'md',
    maxWidth: 'full',
    isScrollable: true,
    isHeaderPinned: false,
    title: 'Overview',
    description: 'Synthetic content for the page frame.',
    showHeader: true,
    showTrailing: false,
    blocks: 8,
  },
  argTypes: {
    gutter: { control: 'select', options: ['sm', 'md'] },
    maxWidth: { control: 'select', options: ['narrow', 'wide', 'full'] },
    isScrollable: { control: 'boolean' },
    isHeaderPinned: { control: 'boolean' },
    showHeader: { control: 'boolean' },
    showTrailing: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    blocks: { control: { type: 'range', min: 0, max: 12, step: 1 } },
    header: { control: false },
    children: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Molecule.** Composes [Typography](?path=/docs/foundations-typography--docs). A view puts ' +
          'Section, Card, EmptyState or Alert in the body. Pin the header with `isHeaderPinned`, which also casts a shadow once content scrolls under it. Change one control at a time: flip `maxWidth` and compare against the same frame, not against another frame. No loading, empty, error or disabled state: ' +
          'the page holds no data, so the view renders those in the body. Do not nest a Page in a Page.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {
  decorators: [
    (Story) => (
      <Surface className="h-[640px] border border-dashed border-border-default">
        <Story />
      </Surface>
    ),
  ],
  render: ({ title, description, showHeader, showTrailing, blocks, ...args }) => (
    <Page
      {...args}
      header={
        showHeader ? (
          <PageHeader
            title={title}
            description={description}
            trailing={
              showTrailing ? <Text className="text-text-secondary">Action</Text> : undefined
            }
          />
        ) : undefined
      }
    >
      <View className="gap-stack-md">
        {Array.from({ length: blocks }, (_, i) => (
          <Surface key={i} className="h-40 p-inset-md">
            <Text className="text-text-secondary">Block {i + 1}</Text>
          </Surface>
        ))}
      </View>
    </Page>
  ),
}
