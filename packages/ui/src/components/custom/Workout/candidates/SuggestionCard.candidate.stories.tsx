// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/SuggestionCard.tsx
// Rating:   Medium · titan equiv: none (no "suggested next exercise" card)
// Why:      Tinted card w/ "Suggested" badge, one-tap Start pill, and a
//           history-or-reason subline. titan has no suggestion-card pattern.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

/** Static faithful re-render of the mobile SuggestionCard (onStart is a no-op). */
function SuggestionCardSpecimen({
  exerciseName,
  reason,
  historyLabel,
}: {
  exerciseName: string
  reason: string
  historyLabel?: string
}) {
  return (
    <View
      style={{
        width: 340,
        borderRadius: 16,
        backgroundColor: alpha(t['brand-primary'], 0.07),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
        }}
      >
        <View style={{ marginRight: 12, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: t['brand-primary'] }}>✦</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: t['brand-primary'],
              }}
            >
              Suggested
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t['text-primary'] }}>
            {exerciseName}
          </Text>
          {historyLabel ? (
            <Text style={{ marginTop: 2, fontSize: 12, color: t['text-secondary'] }}>
              {historyLabel}
            </Text>
          ) : (
            <Text style={{ marginTop: 2, fontSize: 12, color: t['text-disabled'] }}>{reason}</Text>
          )}
        </View>

        <Pressable onPress={() => {}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: t['brand-primary'],
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: t['on-brand-primary'] }}>
              Start
            </Text>
            <Text style={{ fontSize: 13, color: t['on-brand-primary'] }}>→</Text>
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const meta: Meta<typeof SuggestionCardSpecimen> = {
  title: 'Lab/Candidates/Cards/SuggestionCard',
  component: SuggestionCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Brand-tinted card surfacing the ' +
          'top workout suggestion with a pill Start button; shows last-session stats or a reason ' +
          'string when no history exists. titan has no suggestion-card pattern. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SuggestionCardSpecimen>

export const WithHistory: Story = {
  args: {
    exerciseName: 'Barbell Bench Press',
    reason: 'Popular in your program',
    historyLabel: '185 lb × 8 · last Tuesday',
  },
}

export const NoHistoryReason: Story = {
  args: {
    exerciseName: 'Cable Fly',
    reason: 'New exercise for your program',
  },
}

export const LongExerciseName: Story = {
  args: {
    exerciseName: 'Single-Arm Incline Dumbbell Row',
    reason: 'Balances last week’s pulling volume',
    historyLabel: '65 lb × 10 · last Thursday',
  },
}
