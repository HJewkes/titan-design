/**
 * `Lab/Components/Verdict Hero` — the verdict-as-hero treatment options (word-led vs
 * RPE-metric-led) used in the Fatigue System's unified fatigue card
 * (`Lab/North Star/4 · Fatigue System`). Relocated from the fatigue-card exploration so a
 * variant reference survives for hardening.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { FatigueCard, Page, SectionTitle, Caption, Kicker } from '../north-star/fatigue-lab-shared'

const meta: Meta = {
  title: 'Lab/Components/Verdict Hero',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** P2a — the verdict-as-hero, word-led vs metric-led, compared across states. */
export const VerdictHero_: Story = {
  name: 'P2a · Verdict hero (options)',
  render: () => {
    const col = (mode: 'word' | 'metric', title: string, note: string) => (
      <View style={{ gap: 8, width: 340 }}>
        <Kicker>{title}</Kicker>
        <Caption>{note}</Caption>
        <FatigueCard width={340} heroMode={mode} current={7} />
        <FatigueCard width={340} heroMode={mode} current={2} />
      </View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Verdict as hero — two treatments to compare</SectionTitle>
          <Caption>
            The aggregated verdict promoted to the card&apos;s focal read, in the StopSetDecision idiom — a big tone-colored
            headline integrated into the card (no nested alert box), a short supporting line, and the three &quot;why&quot;
            dots (velocity-loss · ROM · tempo) beneath it, metric on hover. RIGHT (the default, used in the North Star card)
            leads with the RPE ESTIMATE as the big number, the tone verdict word, and a supporting line explaining the RPE
            (reps in reserve / proximity to failure). LEFT is the verdict-word-led alternative. Each shown breaking-down (rep
            8, RPE 10) over good (rep 3, RPE 7.5).
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>
          {col('word', 'OPTION A — verdict-word-led', 'The aggregated state IS the headline.')}
          {col('metric', 'OPTION B — RPE-led (default, stop-set idiom)', 'A lead RPE number + verdict word + reps-in-reserve.')}
        </View>
      </Page>
    )
  },
}
