// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/ui/ContextualTooltip.tsx
// Rating:   Medium · titan equiv: none (no dismissible one-time coach-mark card)
// Why:      Tinted tip card that teaches a VBT concept the moment it becomes
//           relevant, with a "Got it" dismiss — titan has no onboarding coach-mark.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'
import { InfoIcon } from '../../../icons'

const t = getSemanticColors('dark')

/** Static faithful re-render of the mobile ContextualTooltip (always visible — seen-check stripped). */
function ContextualTooltipSpecimen({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        width: 320,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: alpha(t['brand-primary'], 0.1),
        borderWidth: 1,
        borderColor: alpha(t['brand-primary'], 0.2),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <InfoIcon size={18} color={t['brand-primary']} />
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 13, fontWeight: '600', color: t['text-primary'], marginBottom: 2 }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: t['text-secondary'], lineHeight: 17 }}>{body}</Text>
        </View>
        <Pressable onPress={() => {}} hitSlop={8}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: t['brand-primary'] }}>Got it</Text>
        </Pressable>
      </View>
    </View>
  )
}

const meta: Meta<typeof ContextualTooltipSpecimen> = {
  title: 'Lab/Candidates/Coaching/ContextualTooltip',
  component: ContextualTooltipSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Dismissible one-time coach-mark: ' +
          'tinted card, info glyph, title + explanatory body, and a "Got it" dismiss. Milestone-seen ' +
          'gating stripped — always shown. titan has no coach-mark primitive. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ContextualTooltipSpecimen>

export const VelocityTip: Story = {
  args: {
    title: 'What is bar speed?',
    body: 'We measure how fast the bar moves on each rep. Slower reps near failure usually mean higher effort.',
  },
}
export const RPETip: Story = {
  args: {
    title: 'Rating your effort',
    body: 'RPE is a 1-10 scale for how hard a set felt. An RPE of 9 means you had about 1 rep left in the tank.',
  },
}
export const TempoTip: Story = {
  args: {
    title: 'Reading the tempo grid',
    body: 'Tempo shows the seconds spent in each phase of the rep: eccentric, pause, concentric, and bottom pause.',
  },
}
