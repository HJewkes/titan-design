import type { Meta, StoryObj } from '@storybook/react-vite'
import { Scatter, type ScatterDatum } from './Scatter'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const meta: Meta<typeof Scatter> = {
  title: 'Components/Atoms/Scatter',
  component: Scatter,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A domain-free scatter plot: points placed on two linear axes, sized by `r` and ' +
          'coloured per datum. Composes [EmptyState](?path=/docs/components-molecules-emptystate--docs) as the default `emptyState`, drawn ' +
          'in place of the plot when `data` is empty (set the `data` control to `[]`, or see the `Empty` story). ' +
          'The frame, gridlines and point marks are `View`s, `Text`s and `Pressable`s, and theme colours come ' +
          'through `useSurfaceMode` and `getSemanticColors`.\n\n' +
          'No loading state: the consumer passes data that is already loaded. No error state: a chart ' +
          'cannot fail to get its data; the consumer renders a failure with `Alert`. No disabled state: ' +
          'the chart is a read-out, and a point is pressable only when `onPress` is set.',
      },
    },
  },
  argTypes: {
    width: { control: { type: 'range', min: 240, max: 800, step: 20 } },
    height: { control: { type: 'range', min: 180, max: 600, step: 20 } },
    data: { control: 'object' },
    referenceLines: { control: 'object' },
    emptyState: { control: false },
    diagonal: { control: 'boolean', table: { disable: true } },
  },
}
export default meta
type Story = StoryObj<typeof Scatter>

/** Modules on the instability × abstractness "main sequence". */
const mainSequence: ScatterDatum[] = [
  { id: 'core', x: 0.08, y: 0.85, r: 10, color: t['data-1'], label: 'core' },
  { id: 'domain', x: 0.22, y: 0.7, r: 8, color: t['data-1'], label: 'domain' },
  { id: 'services', x: 0.45, y: 0.4, r: 12, color: t['data-7'], label: 'services' },
  { id: 'api', x: 0.6, y: 0.35, r: 7, color: t['data-7'], label: 'api' },
  { id: 'cli', x: 0.9, y: 0.08, r: 9, color: t['data-6'], label: 'cli' },
  { id: 'utils', x: 0.85, y: 0.75, r: 6, color: t['data-4'], label: 'utils (pain?)' },
]

export const Default: Story = {
  args: {
    data: mainSequence,
    width: 480,
    height: 340,
    referenceLines: [{ slope: -1, intercept: 1, id: 'main-sequence', label: 'Main sequence' }],
    axis: {
      xLabel: 'Instability (I)',
      yLabel: 'Abstractness (A)',
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    },
  },
}

export const NoDiagonal: Story = {
  args: {
    data: mainSequence,
    width: 480,
    height: 340,
    axis: {
      xLabel: 'Instability (I)',
      yLabel: 'Abstractness (A)',
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    },
  },
}

export const Selected: Story = {
  args: {
    data: mainSequence,
    width: 480,
    height: 340,
    referenceLines: [{ slope: -1, intercept: 1, id: 'main-sequence', label: 'Main sequence' }],
    selectedId: 'utils',
    axis: {
      xLabel: 'Instability (I)',
      yLabel: 'Abstractness (A)',
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    },
  },
}

/** Auto-domain from a single point — the frame still renders cleanly. */
export const SinglePoint: Story = {
  args: {
    data: [{ id: 'only', x: 0.5, y: 0.5, r: 10, label: 'only module' }],
    width: 400,
    height: 300,
    axis: { xLabel: 'I', yLabel: 'A' },
  },
}

/** An outlier far outside the main cluster, kept legible by an explicit domain. */
export const Outlier: Story = {
  args: {
    data: [
      ...mainSequence,
      { id: 'legacy', x: 0.98, y: 0.98, r: 16, color: t['data-4'], label: 'legacy.ts' },
    ],
    width: 480,
    height: 340,
    referenceLines: [{ slope: -1, intercept: 1, id: 'main-sequence', label: 'Main sequence' }],
    axis: {
      xLabel: 'Instability (I)',
      yLabel: 'Abstractness (A)',
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    },
  },
}

export const Empty: Story = {
  args: {
    data: [],
    width: 400,
    height: 300,
    axis: {
      xLabel: 'Instability (I)',
      yLabel: 'Abstractness (A)',
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    },
  },
}

/** The categorical fallback under the light theme. */
export const Light: Story = {
  globals: { theme: 'light' },
  args: {
    ...Default.args,
    data: mainSequence.map(({ color: _color, ...d }) => d),
  },
}
