import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { FatigueLights } from './FatigueLights'
import { Surface } from '../../ui/surface'
import { StorySpecimen, StorySpecimens } from '../../../lab/story-canvas'
import { FATIGUE_STATES } from './fatigue-mock'

const meta: Meta<typeof FatigueLights> = {
  title: 'Custom/Fatigue/Fatigue Lights',
  component: FatigueLights,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    // The lights sit in a panel card beside the verdict on the session summary page.
    canvas: 'panel',
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The three VEL/ROM/TEMPO "why" dots behind the verdict. Composes the shared `StatusDot` ' +
          '(glow) inside a `Tooltip` that reveals the dimension detail on hover. `dimensions === null` ' +
          '⇒ three neutral dots (warming up). `variant="chips"` draws each dimension as a neutral ' +
          '[Pill](?path=/docs/components-atoms-pill--docs) led by a ' +
          '[StatusGlyph](?path=/docs/components-atoms-statusglyph--docs), label in neutral ink.',
      },
    },
  },
  args: {
    variant: 'chips',
    spread: false,
    dimensions: { velocityLoss: 'alarm', rom: 'warn', tempo: 'ok' },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['dots', 'chips'] },
    spread: { control: 'boolean' },
    dimensions: { control: 'object' },
  },
}
export default meta
type Story = StoryObj<typeof FatigueLights>

export const Default: Story = {
  // Draws its own raised card at the in-card width, so it needs only the page.
  parameters: { canvas: 'page' },
  render: (args) => (
    <Surface level="raised" className="p-inset-md" style={{ width: 396 }}>
      <FatigueLights {...args} />
    </Surface>
  ),
}

export const AcrossStates: Story = {
  render: () => (
    <StorySpecimens>
      {FATIGUE_STATES.map((s) => (
        <StorySpecimen key={s.name} label={s.name}>
          <FatigueLights dimensions={s.model.verdict?.dimensions ?? null} />
        </StorySpecimen>
      ))}
      <StorySpecimen label="WARMING UP">
        <FatigueLights dimensions={null} />
      </StorySpecimen>
    </StorySpecimens>
  ),
}

/** Spread evenly across a fixed width (the in-card layout). */
export const Spread: Story = {
  render: () => (
    <View style={{ width: 280 }}>
      <FatigueLights dimensions={FATIGUE_STATES[3].model.verdict?.dimensions ?? null} spread />
    </View>
  ),
}
