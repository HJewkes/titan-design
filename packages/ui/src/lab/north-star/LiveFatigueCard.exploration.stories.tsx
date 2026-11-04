/**
 * `Lab/North Star/4 - Fatigue System` — DESIGN EXPLORATION (not shipped).
 *
 * The ALIGNED composition for the redesigned LIVE PANEL on the wall dashboard: the
 * velocity HERO (primary, `VelocityStrip` + VL threshold bands) beside the secondary
 * UNIFIED FATIGUE CARD (verdict hero + "why" dots + ROM progression + ghost-trail chart).
 * This file keeps the two stories that show that composition; the sub-component variant
 * examples that led here have hardened into `Custom/Fatigue/*` (Ghost Spark, Verdict
 * Hero, Velocity Hero) and the superseded single-piece explorations moved to
 * `Lab/Archive/Fatigue` (Combined chart, the older single Fatigue card, the P2/P3 Overview).
 *
 * CHANNEL DISCIPLINE — three questions, three deliberately distinct color languages:
 *   • The HERO owns the one saturated VELOCITY-ZONE hue (green→red ramp, by m/s).
 *   • The COMBINED CHART owns a diverging TEMPO-ADHERENCE color: warm when a phase
 *     runs FASTER than its prescribed tempo (rushing), cool when SLOWER (lagging),
 *     neutral parchment when on-tempo — with a per-phase base tone so phase identity
 *     and tempo adherence ride the ONE line color together.
 *   • ROM is neutral PARCHMENT geometry; the status lights use status tones only.
 *
 * Mocked realistically: a fatiguing 8-rep cable press taken deep — velocity decays,
 * ROM shrinks, tempo degrades, and reps 4 & 7 are cheats. Units honest: velocity m/s,
 * load lb, time s. Nothing here modifies a shipped component; the hero CONSUMES the
 * shipped VelocityStrip.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { StorySpecimen } from '../story-canvas'
import { FATIGUE_STATES, LivePanelV2, Page, SectionTitle, Caption } from './fatigue-lab-shared'

const meta: Meta = {
  title: 'Lab/North Star/4 - Fatigue System',
  tags: ['status:lab', '!status:review'],
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** The full live panel composition — THE aligned direction. */
export const LivePanelV2_: Story = {
  name: 'Live panel v2 (composition)',
  render: () => <LivePanelV2 current={7} />,
}

/** Live-view state variants — the whole system across the verdict spectrum. */
export const LiveStates: Story = {
  name: 'Live states (Good → Breaking down)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Live-view states — the system across the fatigue spectrum</SectionTitle>
        <Caption>
          The live panel (velocity hero + fatigue card) rendered per verdict state, with plausible
          mock data driving the whole system — RPE, the three status dots, the green-on-track ghost
          line, and the ROM progression all respond together. GOOD (early, low RPE, all-green dots +
          green line, full ROM) → SLOWING (mid-set, VEL dot amber, RPE mid) → GRINDING (deep
          velocity loss but clean form — VEL alarm, ROM/tempo ok, RPE high) → FORM BREAKING DOWN
          (late/cheat rep — red, dropped-ecc red line, cut ROM). Aura flood tracks the state.
        </Caption>
      </View>
      {FATIGUE_STATES.map((s) => (
        <StorySpecimen key={s.name} label={s.name}>
          <LivePanelV2 current={s.current} fatigue={s.read} aura={s.aura} />
        </StorySpecimen>
      ))}
    </Page>
  ),
}
