import type { Meta, StoryObj } from '@storybook/react-vite'
import { Scatter, type ScatterDatum } from './Scatter'

const meta: Meta<typeof Scatter> = {
  title: 'Custom/Scatter',
  component: Scatter,
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 240, max: 800, step: 20 } },
    height: { control: { type: 'range', min: 180, max: 600, step: 20 } },
    diagonal: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Scatter>

/** Modules on the instability × abstractness "main sequence". */
const mainSequence: ScatterDatum[] = [
  { id: 'core', x: 0.08, y: 0.85, r: 10, color: '#14B8A6', label: 'core' },
  { id: 'domain', x: 0.22, y: 0.7, r: 8, color: '#14B8A6', label: 'domain' },
  { id: 'services', x: 0.45, y: 0.4, r: 12, color: '#5B9BD5', label: 'services' },
  { id: 'api', x: 0.6, y: 0.35, r: 7, color: '#5B9BD5', label: 'api' },
  { id: 'cli', x: 0.9, y: 0.08, r: 9, color: '#F4A736', label: 'cli' },
  { id: 'utils', x: 0.85, y: 0.75, r: 6, color: '#F83030', label: 'utils (pain?)' },
]

export const Default: Story = {
  args: {
    data: mainSequence,
    width: 480,
    height: 340,
    diagonal: true,
    axis: { xLabel: 'Instability (I)', yLabel: 'Abstractness (A)', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
  },
}

export const NoDiagonal: Story = {
  args: {
    data: mainSequence,
    width: 480,
    height: 340,
    axis: { xLabel: 'Instability (I)', yLabel: 'Abstractness (A)', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
  },
}

export const Selected: Story = {
  args: {
    data: mainSequence,
    width: 480,
    height: 340,
    diagonal: true,
    selectedId: 'utils',
    axis: { xLabel: 'Instability (I)', yLabel: 'Abstractness (A)', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
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
    data: [...mainSequence, { id: 'legacy', x: 0.98, y: 0.98, r: 16, color: '#F83030', label: 'legacy.ts' }],
    width: 480,
    height: 340,
    diagonal: true,
    axis: { xLabel: 'Instability (I)', yLabel: 'Abstractness (A)', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
  },
}

export const Empty: Story = {
  args: {
    data: [],
    width: 400,
    height: 300,
    axis: { xLabel: 'Instability (I)', yLabel: 'Abstractness (A)', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
  },
}
