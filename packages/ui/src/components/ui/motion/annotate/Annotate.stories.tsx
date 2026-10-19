import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Typography } from '../../typography'
import { Annotate } from './Annotate'
import { ANNOTATION_DEFAULTS } from './annotation-geometry'

const KINDS = Object.keys(ANNOTATION_DEFAULTS)
const COLORS = ['primary', 'secondary', 'success', 'error', 'warning', 'info']

const meta: Meta<typeof Annotate> = {
  title: 'Components/Molecules/Annotate',
  component: Annotate,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { kind: 'circle', progress: 1, seed: 1, roughness: 1 },
  argTypes: {
    kind: { control: 'select', options: KINDS },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    seed: { control: 'text' },
    color: { control: 'select', options: COLORS },
    roughness: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    iterations: { control: { type: 'number', min: 1, max: 4, step: 1 } },
    padding: { control: { type: 'number', min: 0, max: 16, step: 1 } },
    strokeWidth: { control: { type: 'number', min: 1, max: 8, step: 1 } },
    children: { control: false },
    box: { control: false },
  },
  render: (args) => (
    <View className="flex-row flex-wrap items-center gap-inline-md p-section-lg">
      <Typography variant="h3">One seed draws every</Typography>
      <Annotate {...args}>
        <Typography variant="h3">stroke</Typography>
      </Annotate>
      <Typography variant="h3">the same way.</Typography>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** (the rough-notation idea, MIT, see `ui/motion/LICENSE-rough-notation`). Marks its ' +
          'children with a hand-drawn highlight, underline, box, circle, strike-through or cross, drawn on as ' +
          '`progress` runs 0..1. Measures the children and hands their box to ' +
          '[AnnotationMark](?path=/docs/components-molecules-annotationmark--docs); a highlight paints behind ' +
          'them, every other mark over them. The same `seed` draws the same wobble on every render. With reduced ' +
          'motion, or without `progress`, the finished mark shows. The mark is decorative: say the fact in the ' +
          'words or the narration too. No loading, empty, error or disabled state: it decorates content the ' +
          'consumer already has and takes no input. Ships from `@titan-design/react-ui/motion` only.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Annotate>

export const Default: Story = {}
