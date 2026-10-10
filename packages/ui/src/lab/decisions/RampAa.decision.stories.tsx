import type { Meta, StoryObj } from '@storybook/react-vite'
import { OPTIONS, type OptionKey } from './ramp-aa'
import { DarkReferenceUnit, OptionUnit } from './RampAaView'

const option = (key: OptionKey) => OPTIONS.find((o) => o.key === key)!

const meta: Meta = {
  title: 'Lab/Decisions/Elevation Ramp AA',
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-789, after the owner picked option 3). The same UI on every ' +
          'light plane each option has: the text tiers, an Input border, the status marks, the ' +
          'BarList fills on their track, the hairlines and the shell rail accents. Each row ' +
          'prints its colour by ramp step and its measured ratio (ΔL* for hairlines); a miss ' +
          'is marked in red and drawn as a swatch, not as live text. One story per option, ' +
          'light only; dark is shown once for reference. Options: (1) option 3 as picked; ' +
          '(2) option 3 plus the minimal re-colour set; (3) 3b, Q5 C with stepped insets; (4) a ' +
          'hybrid that keeps today’s darkest content plane. No token changes.',
      },
    },
  },
}
export default meta
type Story = StoryObj

export const Option1AsPicked: Story = {
  name: '1 · Option 3 as picked',
  render: () => <OptionUnit option={option('asPicked')} />,
}

export const Option2Recoloured: Story = {
  name: '2 · Option 3 plus re-colours',
  render: () => <OptionUnit option={option('recoloured')} />,
}

export const Option3Fallback3b: Story = {
  name: '3 · Fall back to 3b',
  render: () => <OptionUnit option={option('q5cInsets')} />,
}

export const Option4Hybrid: Story = {
  name: '4 · Hybrid',
  render: () => <OptionUnit option={option('hybrid')} />,
}

export const DarkReference: Story = {
  name: 'Dark reference',
  render: () => <DarkReferenceUnit />,
}
