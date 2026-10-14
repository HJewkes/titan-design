import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../surface'
import { Typography } from '../../typography'
import type { MorphPart } from './match-parts'
import { Morph } from './Morph'

interface Label extends MorphPart {
  label: string
}

interface Scene {
  from: Label[]
  to: Label[]
  keyMap: Record<string, string>
  width: number
  height: number
  boxed: boolean
  arc: number
}

const token = (id: string, x: number, label = id, key?: string): Label => ({
  id,
  key,
  label,
  box: { x, y: 40, width: 40, height: 40 },
})

const node = (id: string, x: number, y: number): Label => ({
  id,
  label: id,
  box: { x, y, width: 96, height: 40 },
})

// a² + b² = c² becomes c² − b² = a²: four terms travel, `+` leaves and `−` arrives.
const EQUATION: Scene = {
  from: [
    token('a2', 0, 'a²'),
    token('plus', 48, '+'),
    token('b2', 96, 'b²'),
    token('eq', 144, '='),
    token('c2', 192, 'c²'),
  ],
  to: [
    token('c2', 0, 'c²'),
    token('minus', 48, '−'),
    token('b2', 96, 'b²'),
    token('eq', 144, '='),
    token('a2', 192, 'a²'),
  ],
  keyMap: {},
  width: 232,
  height: 120,
  boxed: false,
  arc: 0.2,
}

// A module map between two snapshots: `cache` is renamed `memo` and drops a row, `legacy` goes,
// `ui` takes its place and `queue` arrives where `cache` was.
const MODULES: Scene = {
  from: [
    node('api', 0, 0),
    node('store', 112, 0),
    node('cache', 224, 0),
    node('legacy', 0, 56),
    node('ui', 112, 56),
  ],
  to: [
    node('api', 0, 0),
    node('store', 112, 0),
    node('queue', 224, 0),
    node('ui', 0, 56),
    node('memo', 224, 56),
  ],
  keyMap: { cache: 'memo' },
  width: 320,
  height: 96,
  boxed: true,
  arc: 0,
}

const SCENES = { equation: EQUATION, modules: MODULES }

interface StoryArgs {
  t: number
  scene: keyof typeof SCENES
  useKeyMap: boolean
}

function paint(part: Label, boxed: boolean) {
  const text = (
    <Typography variant={boxed ? 'monoLabel' : 'h3'} color="primary">
      {part.label}
    </Typography>
  )
  if (!boxed) return <View className="flex-1 items-center justify-center">{text}</View>
  return (
    <Surface raise={1} className="flex-1 items-center justify-center">
      {text}
    </Surface>
  )
}

function Render({ t, scene, useKeyMap }: StoryArgs) {
  const { from, to, keyMap, width, height, boxed, arc } = SCENES[scene]
  return (
    <Morph
      from={from}
      to={to}
      keyMap={useKeyMap ? keyMap : undefined}
      arc={arc}
      progress={t}
      width={width}
      height={height}
      renderPart={(part) => paint(part, boxed)}
      accessibilityLabel={`${scene} morph`}
    />
  )
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/Morph',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { t: 0.5, scene: 'modules', useKeyMap: true },
  argTypes: {
    t: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    scene: { control: 'select', options: Object.keys(SCENES) },
    useKeyMap: { control: 'boolean' },
  },
  render: Render,
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** in `/motion`: a keyed morph between two scenes, after Manim’s ' +
          'TransformMatchingParts. Parts with equal keys move and scale to their new box; a `keyMap` ' +
          'entry carries a renamed part across with a cross-fade; the rest fade out over the first half ' +
          'and in over the second. `t` is the morph’s progress, so it seeks frame-exactly. Under ' +
          'reduced motion it shows the target scene. The parts here are painted with ' +
          '[Surface](?path=/docs/components-atoms-surface--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). No loading, empty, error or ' +
          'disabled state: it paints parts the consumer already has and takes no input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
