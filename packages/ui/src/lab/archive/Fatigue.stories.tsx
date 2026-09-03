/**
 * `Lab/Archive/Fatigue` — superseded fatigue-card explorations, kept for provenance.
 * The aligned direction is `Lab/North Star/4 · Fatigue System` (LivePanelV2 composition);
 * sub-component variants that survived are under `Lab/Components/*`.
 *
 *   - Combined chart: the standalone P1 chart demo, superseded once it was demoted into
 *     the ghost-spark sparkline (`Lab/Components/Ghost Spark`) inside the fatigue card.
 *   - Fatigue card: the older SINGLE-card showcase (two cards side by side, no hero),
 *     superseded by the LivePanelV2 composition (hero + card together).
 *   - Overview: the P2/P3 pieces shown separately — redundant with LivePanelV2_, which
 *     already composes them.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { primitiveColors } from '../../theme/tokens/primitives'
import {
  CombinedChart,
  FatigueCard,
  HeroWithVlBands,
  Page,
  Panel,
  SectionTitle,
  Caption,
  Kicker,
  insetWell,
} from '../north-star/fatigue-lab-shared'

const meta: Meta = {
  title: 'Lab/Archive/Fatigue',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** P1 — the combined ghost-trail + phase/tempo-colored current-rep chart, standalone.
 *  SUPERSEDED: demoted into the ghost-spark sparkline inside the fatigue card. */
export const CombinedChart_: Story = {
  name: 'P1 · Combined chart',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>
          Combined chart — ghost trail + target-tempo bands + tempo-colored rep
        </SectionTitle>
        <Caption>
          The novel centerpiece of the fatigue card. Every prior rep is a faded grey ghost on one
          absolute-time axis (the fan IS the set&apos;s timing drift); the CURRENT rep is the solid
          line. Behind it, the four shaded bands are the PRESCRIBED tempo&apos;s phase regions. The
          current line is colored GREEN when a phase is on its prescribed tempo and warms toward
          amber → red as it deviates (rushing OR lagging). Phase identity reads from geometry
          (eccentric below the zero axis, concentric above) + the bands. The peak concentric
          velocity is marked, tying the read back to the hero.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>
          8-REP CABLE PRESS · rep 8 current · reps 1–7 ghosts · absolute time · line =
          green-on-track tempo
        </Kicker>
        <View style={[{ borderRadius: 12, padding: 14 }, insetWell(primitiveColors.charcoal[900])]}>
          <CombinedChart w={800} h={320} current={7} />
        </View>
      </Panel>
      <Panel width={860}>
        <Kicker>
          EARLY REP (rep 3, on-tempo) vs LATE REP (rep 8, dropped ecc + long con grind)
        </Kicker>
        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          <View
            style={[{ borderRadius: 12, padding: 10 }, insetWell(primitiveColors.charcoal[900])]}
          >
            <CombinedChart w={390} h={220} current={2} />
          </View>
          <View
            style={[{ borderRadius: 12, padding: 10 }, insetWell(primitiveColors.charcoal[900])]}
          >
            <CombinedChart w={390} h={220} current={7} />
          </View>
        </View>
      </Panel>
    </Page>
  ),
}

/** P2 — the older single-card showcase. SUPERSEDED by the LivePanelV2 composition. */
export const FatigueCard_: Story = {
  name: 'P2 · Fatigue card (single card, no hero)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>
          Unified fatigue card — a vertical column that sits beside the hero
        </SectionTitle>
        <Caption>
          One focal read, everything else quiet: a LARGE RPE verdict hero → the three
          &quot;why&quot; dots (left-aligned) → the labeled silver/red ROM progression (bars +
          reference lines + &quot;now X%&quot; caption, always on) → the ghost chart LAST, a bare
          sparkline (green-on-track line + tempo-colored axis) that blooms its annotations on hover.
          Shown across the spectrum: a GOOD early rep and the BREAKING-DOWN late rep. (Verdict
          content is placeholder, to be driven by Workout Analytics.) Superseded by the LivePanelV2
          composition, which pairs this with the velocity hero.
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
        <View style={{ gap: 6 }}>
          <Kicker>REP 3 — good (all three ok)</Kicker>
          <FatigueCard width={324} current={2} />
        </View>
        <View style={{ gap: 6 }}>
          <Kicker>REP 8 — form breaking down (all three alarm)</Kicker>
          <FatigueCard width={324} current={7} />
        </View>
      </View>
    </Page>
  ),
}

/** Overview — the P2/P3 pieces shown separately. Redundant with LivePanelV2_
 *  (`Lab/North Star/4 · Fatigue System`), which already composes them together. */
export const Overview: Story = {
  name: 'Overview (redundant with Live panel v2)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Live fatigue card — the redesigned live panel</SectionTitle>
        <Caption>
          The live panel = the velocity HERO (primary, with VL bands) beside a secondary UNIFIED
          FATIGUE CARD — a vertical column whose centerpiece is the combined ghost-trail +
          tempo-colored current-rep chart, with a ROM-progression read and three fatigue lights.
          Three questions, three color languages: the hero owns the velocity-zone hue, the combined
          chart owns the diverging tempo-adherence color, ROM stays parchment. See `Lab/North Star/4
          · Fatigue System` → Live panel v2 for the composed, non-redundant version of this same
          pairing.
        </Caption>
      </View>
      {/* hero (primary) beside the vertical fatigue card (secondary) — the panel reflow. */}
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <Panel width={720}>
          <Kicker>P3 · HERO + VL BANDS (primary)</Kicker>
          <View
            style={[{ borderRadius: 12, padding: 16 }, insetWell(primitiveColors.charcoal[900])]}
          >
            <HeroWithVlBands width={660} height={470} current={7} />
          </View>
        </Panel>
        <View style={{ gap: 6 }}>
          <Kicker>P2 · FATIGUE CARD (secondary)</Kicker>
          <FatigueCard width={318} current={7} />
        </View>
      </View>
    </Page>
  ),
}
