import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { OPTIONS, type OptionKey } from './elevation-ramps'
import { RampUnit } from './ElevationRampsView'

interface Args {
  option: 'all' | OptionKey
}

function Ramps({ option }: Args) {
  const shown = option === 'all' ? OPTIONS : OPTIONS.filter((o) => o.key === option)
  return (
    <View className="gap-section-md bg-background-base p-gutter-md">
      {shown.map((o) => (
        <RampUnit key={o.key} option={o} />
      ))}
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Lab/Decisions/Elevation Ramps',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { option: 'all' },
  argTypes: {
    option: { control: 'inline-radio', options: ['all', ...OPTIONS.map((o) => o.key)] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-789). Every elevation level from -2 to +5 in dark and light, side ' +
          'by side, per option: the surface hex, the lift as rendered, its contrast against the ' +
          'level below and above, and against the page (level 0) it sits on. A step that is not ' +
          'lighter than the one below is marked in red; 4 and 5 share the overlay plane by design. ' +
          'Options: (1) today on main; (2) Q5 C as picked (it does not define levels -2 and -1, ' +
          'which keep today’s values); (3) a fully monotonic light ramp from existing grey steps; ' +
          '(3b) Q5 C with stepped insets. No token changes. #424 (TD-278, inset wells per plane) ' +
          'depends on whichever ramp the owner picks.',
      },
    },
  },
  render: (args) => <Ramps {...args} />,
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}
