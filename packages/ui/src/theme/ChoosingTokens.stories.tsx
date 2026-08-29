import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import tokensDoc from '../../TOKENS.md?raw'
import { Typography } from '../components/custom/Typography'

/**
 * Rendered straight from `packages/ui/TOKENS.md` via Vite's `?raw`, deliberately
 * as its markdown source rather than a hand-built React page. A prettier page
 * would be a second copy of the rules that can drift from the file — and a token
 * guide that disagrees with itself is worse than a plain one. The content is
 * mostly aligned tables, which read fine in mono.
 */
function ChoosingTokens() {
  return (
    <View className="gap-4 p-6">
      <Typography variant="h3" className="text-text-primary">
        Choosing tokens
      </Typography>
      <Typography variant="body2" className="text-text-secondary">
        The decision table to read before writing a component. Source of truth:{' '}
        <Text className="font-mono text-text-primary">packages/ui/TOKENS.md</Text> — this page
        renders that file, so the two cannot disagree.
      </Typography>
      <View className="rounded-lg bg-surface-raised p-4">
        <Text className="font-mono text-xs leading-5 text-text-secondary">{tokensDoc}</Text>
      </View>
    </View>
  )
}

const meta: Meta<typeof ChoosingTokens> = {
  title: 'Foundations/Choosing Tokens',
  component: ChoosingTokens,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Which palette for which meaning, how to resolve a colour in code, and the type/spacing ' +
          'scales. Rendered from `packages/ui/TOKENS.md`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ChoosingTokens>

export const Default: Story = {}
