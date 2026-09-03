/**
 * `Lab/Components/Velocity Hero` — the velocity hero with VL (velocity-loss) threshold
 * bands layered behind the bars, used as the primary read in the Fatigue System
 * (`Lab/North Star/4 · Fatigue System`). Relocated from the fatigue-card exploration so a
 * variant reference survives for hardening.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import {
  HeroWithVlBands,
  Panel,
  Page,
  SectionTitle,
  Caption,
  Kicker,
  insetWell,
} from '../north-star/fatigue-lab-shared'
import { primitiveColors } from '../../theme/tokens/primitives'

const meta: Meta = {
  title: 'Lab/Components/Velocity Hero',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** P3 — the hero with VL bands layered in. */
export const HeroWithVlBands_: Story = {
  name: 'P3 · Hero + VL bands',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Velocity hero with velocity-loss bands layered in</SectionTitle>
        <Caption>
          The shipped VelocityStrip hero (the primary live chart, the one saturated velocity-zone
          hue), enhanced with the VL 20% / VL 30% threshold lines and the warn / alarm decision
          bands behind the bars — on the hero&apos;s own peak scale, so a bar crossing into the
          amber then red band reads as &quot;these are your last effective reps&quot; in the hero
          itself. That is why the fatigue card carries no separate VL% chart: velocity loss lives
          here, in the hero.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>
          8-REP SET · bars = per-rep mean concentric velocity · bands = VL decision zones
        </Kicker>
        <View style={[{ borderRadius: 12, padding: 16 }, insetWell(primitiveColors.charcoal[900])]}>
          <HeroWithVlBands width={800} height={320} current={7} />
        </View>
      </Panel>
    </Page>
  ),
}
