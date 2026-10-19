import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../surface'
import { blogHighlights, blogSchema } from './fixtures'
import { SchemaCard } from './SchemaCard'
import { schemaCardDurationS } from './schema-card-motion'

const durationS = schemaCardDurationS(blogSchema, blogHighlights)

const meta: Meta<typeof SchemaCard> = {
  title: 'Components/Organisms/SchemaCard',
  component: SchemaCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    data: blogSchema,
    highlights: blogHighlights,
    t: 3.8,
    tableWidth: 192,
    accessibilityLabel: 'Blog tables',
    isLoading: false,
  },
  argTypes: {
    data: { control: 'object' },
    highlights: { control: 'object' },
    t: { control: { type: 'range', min: 0, max: Math.ceil(durationS * 10) / 10, step: 0.05 } },
    tableWidth: { control: { type: 'number', min: 144, step: 8 } },
    accessibilityLabel: { control: 'text' },
    isLoading: { control: 'boolean' },
    emptyState: { control: false },
  },
  decorators: [
    (Story) => (
      // The card's home is a MapCard at elevation 3; frame it on that plane.
      <View className="items-start p-section-md">
        <Surface elevation={3} className="p-inset-lg">
          <Story />
        </Surface>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** Tables, their fields and the relations between them, laid out from data with ' +
          'nothing measured at render. `t` (seconds) reveals it: each table rises in, its rows follow in ' +
          'turn, and a connector draws on once both of its rows are in, then shows its cardinality marks ' +
          '(crow’s foot for many, bar for one). `highlights` fill a row for a window. Without `t`, or with ' +
          'reduced motion, the card is settled. Composes ' +
          '[Surface](?path=/docs/components-atoms-surface--docs), ' +
          '[Typography](?path=/docs/foundations-typography--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs); connectors use the motion ' +
          'path toolkit (`drawOn`). Empty: clear `data.tables`. No error or disabled state: the card ' +
          'shows data the consumer already holds and takes no input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SchemaCard>

export const Default: Story = {}
