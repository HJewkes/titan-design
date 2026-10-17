import type { Meta, StoryObj } from '@storybook/react-vite'
import { AmbientStage } from './AmbientStage'
import { Typography } from '../typography'

const meta: Meta<typeof AmbientStage> = {
  title: 'Components/Organisms/AmbientStage',
  component: AmbientStage,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { seed: 0 },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 } },
  },
  render: (args) => (
    <AmbientStage
      {...args}
      className="items-center justify-center"
      style={{ width: 960, height: 540 }}
    >
      <Typography variant="h2">Stage plane</Typography>
    </AmbientStage>
  ),
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** The stage material: `background-base` with the `.atmosphere-warm` brand ' +
          'washes behind the content and the static `.grain` page-root tile over it, both hidden from ' +
          'assistive tech. `seed` picks the grain field. Both layers are static. On native it is the plain plane. ' +
          'Loading, empty, error and disabled do not apply: it is a decorative layer.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AmbientStage>

export const Default: Story = {}
