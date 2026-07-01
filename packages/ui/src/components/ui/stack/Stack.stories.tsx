import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Stack, HStack, VStack } from './Stack'

const meta: Meta<typeof Stack> = {
  title: 'Components/Stack',
  component: Stack,
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12],
      description: 'Gap between children (Tailwind spacing scale)',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Cross-axis alignment',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around'],
      description: 'Main-axis alignment',
    },
    wrap: {
      control: 'boolean',
      description: 'Whether children should wrap',
    },
  },
}

export default meta
type Story = StoryObj<typeof Stack>

function Box({ children }: { children: string }) {
  return (
    <View className="rounded bg-brand-primary px-4 py-2">
      <Text className="text-sm text-white">{children}</Text>
    </View>
  )
}

export const Default: Story = {
  args: {
    gap: 4,
  },
  render: (args) => (
    <Stack {...args}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Stack>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <HStack gap={4} align="center">
      <Box>Left</Box>
      <Box>Center</Box>
      <Box>Right</Box>
    </HStack>
  ),
}

export const Vertical: Story = {
  render: () => (
    <VStack gap={4} align="start">
      <Box>Top</Box>
      <Box>Middle</Box>
      <Box>Bottom</Box>
    </VStack>
  ),
}

export const WithAlignment: Story = {
  render: () => (
    <VStack gap={6}>
      <Text className="text-sm font-medium text-neutral-400">justify=&quot;between&quot;</Text>
      <HStack gap={2} justify="between" className="w-full">
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </HStack>

      <Text className="text-sm font-medium text-neutral-400">align=&quot;center&quot;</Text>
      <HStack gap={2} align="center">
        <View className="rounded bg-brand-primary px-4 py-1">
          <Text className="text-sm text-white">Short</Text>
        </View>
        <View className="rounded bg-brand-primary px-4 py-4">
          <Text className="text-sm text-white">Tall</Text>
        </View>
        <View className="rounded bg-brand-primary px-4 py-2">
          <Text className="text-sm text-white">Medium</Text>
        </View>
      </HStack>
    </VStack>
  ),
}

export const WithWrapping: Story = {
  render: () => (
    <HStack gap={2} wrap className="max-w-xs">
      {Array.from({ length: 8 }, (_, i) => (
        <Box key={i}>Tag {i + 1}</Box>
      ))}
    </HStack>
  ),
}

export const GapScale: Story = {
  render: () => (
    <VStack gap={6}>
      {([0, 1, 2, 4, 6, 8, 12] as const).map((g) => (
        <VStack key={g} gap={1}>
          <Text className="text-xs text-neutral-400">gap={g}</Text>
          <HStack gap={g}>
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </HStack>
        </VStack>
      ))}
    </VStack>
  ),
}
