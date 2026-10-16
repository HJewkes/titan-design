import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChapterCard } from './ChapterCard'

const meta: Meta<typeof ChapterCard> = {
  title: 'Components/Molecules/ChapterCard',
  component: ChapterCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    index: 2,
    kicker: 'Chapter',
    title: 'Mapping time to a scale',
    progress: 0.5,
  },
  argTypes: {
    index: { control: { type: 'number', min: 0, step: 1 } },
    title: { control: 'text' },
    kicker: { control: 'text' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A chapter title card for a video chapter start, held for at most 2 s (decision 308). ' +
          '`progress` runs it in over the first 20% and out over the last 17%: the exit takes 0.85 of the ' +
          'entrance. With reduced motion, or without `progress`, it holds still and fully visible. Composes ' +
          '[Surface](?path=/docs/components-atoms-surface--docs), ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). No loading, empty, error or disabled ' +
          'state: it shows text the consumer already has and takes no input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ChapterCard>

export const Default: Story = {}
