/**
 * `Lab/Components/Ghost Spark` — the resting-vs-hover ghost sparkline used inside the
 * Fatigue System's unified fatigue card (`Lab/North Star/4 · Fatigue System`). Relocated
 * from the fatigue-card exploration so a variant reference survives for hardening.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { PANEL_BG, SparkCombinedChart, Page, SectionTitle, Caption, Kicker } from '../north-star/fatigue-lab-shared'

const meta: Meta = {
  title: 'Lab/Components/Ghost Spark',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** P1b — the ghost spark, resting vs its hover (revealed) state. */
export const SparkChart: Story = {
  name: 'P1b · Ghost spark (rest vs hover)',
  render: () => {
    const box = (child: ReactNode) => (
      <View style={{ width: 380, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>{child}</View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Ghost spark — glance at rest, detail on hover</SectionTitle>
          <Caption>
            The ghost chart DEMOTED to a sparkline: at rest it&apos;s just the shapes + color — the faded ghost trails, the
            GREEN-ON-TRACK current line (green on-tempo, warming amber → red as a phase rushes/lags), and the phase-colored
            AXIS (the zero axis itself is the phase mark, in the TempoDisplay phase-identity language — ecc magenta, con
            cyan-blue, pauses grey) — with no frame, labels or peak marker. On HOVER the ANNOTATIONS fade in: the ECC/CON axis
            labels, the peak marker, and the compact prescribed-tempo tuple (bare colored digits + dashes — magenta ecc /
            cyan con, no backing), overlaid top-left. The chart stays FRAMELESS (no box). Geometry is identical, so nothing
            shifts. (Left = resting,
            hover live in Storybook; right = the revealed state forced for the screenshot.)
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ gap: 8 }}>
            <Kicker>RESTING — bare sparkline (hover me)</Kicker>
            {box(<SparkCombinedChart w={348} h={190} current={7} forceRevealed={false} />)}
          </View>
          <View style={{ gap: 8 }}>
            <Kicker>HOVER — annotations faded in</Kicker>
            {box(<SparkCombinedChart w={348} h={190} current={7} forceRevealed />)}
          </View>
        </View>
      </Page>
    )
  },
}
