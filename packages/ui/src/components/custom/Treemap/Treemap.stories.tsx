import type { Meta, StoryObj } from '@storybook/react-vite'
import { Treemap, type TreemapDatum } from './Treemap'

const meta: Meta<typeof Treemap> = {
  title: 'Custom/Treemap',
  component: Treemap,
  tags: ['autodocs'],
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
  { id: 'router', value: 5035, color: '#F83030', label: 'router.ts' },
  { id: 'engine', value: 4378, color: '#F83030', label: 'engine.ts' },
  { id: 'linker', value: 1695, color: '#F4A736', label: 'linker.ts' },
  { id: 'validate', value: 1288, color: '#F4A736', label: 'validate.ts' },
  { id: 'hook', value: 1050, color: '#F4A736', label: 'hook.ts' },
  { id: 'update', value: 890, color: '#5B9BD5', label: 'update.ts' },
  { id: 'pool', value: 504, color: '#5B9BD5', label: 'pool.ts' },
  { id: 'log', value: 342, color: '#5B9BD5', label: 'log.ts' },
]

export const Default: Story = {
  args: { data: sample, width: 560, height: 300, scale: 'sqrt' },
}

/** A single outlier under a linear scale swallows the canvas... */
export const OutlierLinear: Story = {
  args: {
    data: [{ id: 'mega', value: 205422, color: '#F83030', label: 'mega.ts' }, ...sample],
    width: 560,
    height: 300,
    scale: 'linear',
  },
}

/** ...the same data with a sqrt scale keeps every tile legible. */
export const OutlierSqrt: Story = {
  args: {
    data: [{ id: 'mega', value: 205422, color: '#F83030', label: 'mega.ts' }, ...sample],
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
