import type { Meta, StoryObj } from '@storybook/react-vite'
import { Treemap, type TreemapDatum } from './Treemap'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const meta: Meta<typeof Treemap> = {
  title: 'Custom/Charts/Treemap',
  component: Treemap,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  argTypes: {
    width: { control: { type: 'range', min: 200, max: 900, step: 20 } },
    height: { control: { type: 'range', min: 120, max: 600, step: 20 } },
    scale: { control: 'select', options: ['linear', 'sqrt', 'log'] },
    maxTiles: { control: { type: 'range', min: 4, max: 80, step: 1 } },
  },
}
export default meta
type Story = StoryObj<typeof Treemap>

const sample: TreemapDatum[] = [
  { id: 'router', value: 5035, color: t['data-4'], label: 'router.ts' },
  { id: 'engine', value: 4378, color: t['data-4'], label: 'engine.ts' },
  { id: 'linker', value: 1695, color: t['data-6'], label: 'linker.ts' },
  { id: 'validate', value: 1288, color: t['data-6'], label: 'validate.ts' },
  { id: 'hook', value: 1050, color: t['data-6'], label: 'hook.ts' },
  { id: 'update', value: 890, color: t['data-7'], label: 'update.ts' },
  { id: 'pool', value: 504, color: t['data-7'], label: 'pool.ts' },
  { id: 'log', value: 342, color: t['data-7'], label: 'log.ts' },
]

export const Default: Story = {
  args: { data: sample, width: 560, height: 300, scale: 'sqrt' },
}

/** A single outlier under a linear scale swallows the canvas... */
export const OutlierLinear: Story = {
  args: {
    data: [{ id: 'mega', value: 205422, color: t['data-4'], label: 'mega.ts' }, ...sample],
    width: 560,
    height: 300,
    scale: 'linear',
  },
}

/** ...the same data with a sqrt scale keeps every tile legible. */
export const OutlierSqrt: Story = {
  args: {
    data: [{ id: 'mega', value: 205422, color: t['data-4'], label: 'mega.ts' }, ...sample],
    width: 560,
    height: 300,
    scale: 'sqrt',
  },
}

export const Truncated: Story = {
  args: {
    data: Array.from({ length: 200 }, (_, i) => ({ id: `n${i}`, value: 200 - i })),
    width: 560,
    height: 300,
    maxTiles: 40,
  },
}
