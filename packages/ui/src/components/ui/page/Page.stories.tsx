import type React from 'react'
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
    blocks: 3,
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
          'Section, Card, EmptyState or Alert in the body. No loading, empty, error or disabled state: ' +
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

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 gap-stack-sm">
      <Text className="text-text-secondary">{label}</Text>
      <Surface className="h-[480px] border border-dashed border-border-default">{children}</Surface>
    </View>
  )
}

/** Header scrolling with the body beside a pinned header, both with the same long body. */
export const Compare: Story = {
  render: ({ title, description, blocks, ...args }) => {
    const header = <PageHeader title={title} description={description} />
    const body = (
      <View className="gap-stack-md">
        {Array.from({ length: Math.max(blocks, 8) }, (_, i) => (
          <Surface key={i} className="h-40 p-inset-md">
            <Text className="text-text-secondary">Block {i + 1}</Text>
          </Surface>
        ))}
      </View>
    )
    return (
      <View className="flex-row gap-inline-lg p-gutter-md">
        <Frame label="Header scrolls">
          <Page {...args} role="group" isHeaderPinned={false} header={header}>
            {body}
          </Page>
        </Frame>
        <Frame label="Header pinned">
          <Page {...args} role="group" isHeaderPinned header={header}>
            {body}
          </Page>
        </Frame>
      </View>
    )
  },
}
