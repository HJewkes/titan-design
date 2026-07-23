/**
 * `Lab/Components/Phase Marks` — the prescribed-phase treatment (full-height bands vs
 * colored-axis segments) used behind the Fatigue System's combined chart
 * (`Lab/North Star/4 · Fatigue System`). Relocated from the fatigue-card exploration so a
 * variant reference survives for hardening.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { PANEL_BG, CombinedChart, Page, SectionTitle, Caption, Kicker } from '../north-star/fatigue-lab-shared'

const meta: Meta = {
  title: 'Lab/Components/Phase Marks',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** P1c — phase marks: the current full-height BANDS vs the base line-SEGMENTS. */
export const PhaseMarks: Story = {
  name: 'P1c · Phase marks (bands vs segments)',
  render: () => {
    const cell = (label: string, marks: 'bands' | 'segments') => (
      <View style={{ gap: 8 }}>
        <Kicker>{label}</Kicker>
        <View style={{ width: 440, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
          <CombinedChart w={408} h={230} current={7} compact revealed axisCaptions={false} phaseMarks={marks} />
        </View>
      </View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Phase marks — full-height bands vs the colored AXIS</SectionTitle>
          <Caption>
            The prescribed ecc / pause / con / hold regions drawn two ways, to judge. LEFT = full-height shaded BANDS (heavier
            — the phase floods the whole plot). RIGHT = the zero AXIS itself color-coded by phase along its length, each
            segment sized to that phase&apos;s prescribed time extent (ecc = magenta, con = cyan-blue, pauses grey — the
            TempoDisplay phase-identity language), only ECC +
            CON labelled, the hold segment present only when the prescribed hold &gt; 0. The axis version is wired into the
            card as the default (used in the North Star fatigue card). Both shown revealed; at rest the labels drop and only
            the marks + line remain.
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          {cell('BANDS — full-height washes', 'bands')}
          {cell('AXIS SEGMENTS — default (axis IS the phase mark)', 'segments')}
        </View>
      </Page>
    )
  },
}
