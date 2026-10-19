import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../surface'
import { Typography } from '../../typography'
import { AnnotationMark } from './AnnotationMark'
import { ANNOTATION_DEFAULTS } from './annotation-geometry'

const KINDS = Object.keys(ANNOTATION_DEFAULTS)
const COLORS = ['primary', 'secondary', 'success', 'error', 'warning', 'info']
const NODE_BOX = { x: 72, y: 56, w: 176, h: 64 }

const meta: Meta<typeof AnnotationMark> = {
  title: 'Components/Molecules/AnnotationMark',
  component: AnnotationMark,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { kind: 'box', box: NODE_BOX, progress: 1, seed: 'node', roughness: 1 },
  argTypes: {
    kind: { control: 'select', options: KINDS },
    box: { control: 'object' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    seed: { control: 'text' },
    color: { control: 'select', options: COLORS },
    roughness: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    iterations: { control: { type: 'number', min: 1, max: 4, step: 1 } },
    padding: { control: { type: 'number', min: 0, max: 16, step: 1 } },
    strokeWidth: { control: { type: 'number', min: 1, max: 8, step: 1 } },
  },
  render: (args) => (
    <View className="relative h-[176px] w-[320px]">
      <Surface
        raise={1}
        className="absolute justify-center p-inset-md"
        style={{ left: NODE_BOX.x, top: NODE_BOX.y, width: NODE_BOX.w, height: NODE_BOX.h }}
      >
        <Typography variant="body2">payments</Typography>
      </Surface>
      <AnnotationMark {...args} />
    </View>
  ),
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One hand-drawn mark round an anchor `box` in its parent’s px, drawn on as `progress` ' +
          'runs 0..1. A map layer feeds the box of a node after `project`, so the mark tracks the node through a ' +
          'camera move; [Annotate](?path=/docs/components-molecules-annotate--docs) feeds a measured word. ' +
          'Composes nothing: it paints an `aria-hidden` SVG from `annotationStrokes` and the paths toolkit’s ' +
          '`drawOn`. The story’s node is a [Surface](?path=/docs/components-atoms-surface--docs). No loading, ' +
          'empty, error or disabled state: it decorates a box the consumer already has and takes no input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AnnotationMark>

export const Default: Story = {}
