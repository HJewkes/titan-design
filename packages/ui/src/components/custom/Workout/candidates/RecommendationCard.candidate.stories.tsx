// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/planning/RecommendationCard.tsx
// Rating:   High · titan equiv: none (no "success result" composite exists)
// Why:      Multi-block discovery-result composite — checkmark success banner, a huge
//           weight numeral, a stat row, analysis copy, and a warmup list — all in one
//           screen-level card. titan has nothing at this altitude.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface WarmupSet {
  weight: number
  reps: number
  restSeconds: number
}

interface RecommendationCardSpecimenProps {
  exerciseName: string
  goalLabel: string
  workingWeight: number
  repRange: [number, number]
  confidence: 'low' | 'medium' | 'high'
  explanation: string
  warmupSets: WarmupSet[]
}

/** Static re-render of the mobile RecommendationCard discovery-result screen. */
function RecommendationCardSpecimen({
  exerciseName,
  goalLabel,
  workingWeight,
  repRange,
  confidence,
  explanation,
  warmupSets,
}: RecommendationCardSpecimenProps) {
  const confidenceColor =
    confidence === 'high'
      ? t['status-success']
      : confidence === 'medium'
        ? t['status-warning']
        : t['text-tertiary']

  return (
    <View style={{ width: 340 }}>
      <View
        style={{
          marginBottom: 16,
          alignItems: 'center',
          borderRadius: 24,
          padding: 24,
          backgroundColor: alpha(t['status-success'], 0.08),
          borderWidth: 1,
          borderColor: alpha(t['status-success'], 0.19),
        }}
      >
        <View
          style={{
            marginBottom: 16,
            height: 80,
            width: 80,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 40,
            backgroundColor: t['status-success'],
          }}
        >
          <Text style={{ fontSize: 40, color: 'white', fontWeight: '700' }}>✓</Text>
        </View>
        <Text
          style={{ marginBottom: 8, fontSize: 22, fontWeight: '700', color: t['status-success'] }}
        >
          Discovery Complete!
        </Text>
        <Text style={{ textAlign: 'center', color: t['status-success-light'] }}>
          Your optimal working weight has been found.
        </Text>
      </View>

      <View
        style={{
          marginBottom: 16,
          borderRadius: 16,
          padding: 24,
          backgroundColor: t['surface-elevated'],
        }}
      >
        <Text
          style={{ marginBottom: 8, fontSize: 13, fontWeight: '500', color: t['text-disabled'] }}
        >
          {exerciseName} • {goalLabel}
        </Text>
        <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={{ fontSize: 56, fontWeight: '700', color: t['brand-primary'] }}>
            {workingWeight}
          </Text>
          <Text style={{ marginLeft: 8, fontSize: 22, color: t['text-disabled'] }}>lbs</Text>
        </View>
        <View style={{ borderRadius: 12, backgroundColor: t['surface-input'] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: t['text-disabled'] }}>Rep Range</Text>
              <Text
                style={{ marginTop: 4, fontSize: 17, fontWeight: '700', color: t['text-primary'] }}
              >
                {repRange[0]}-{repRange[1]}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: t['border-default'] }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: t['text-disabled'] }}>Confidence</Text>
              <Text
                style={{ marginTop: 4, fontSize: 17, fontWeight: '700', color: confidenceColor }}
              >
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={{
          marginBottom: 16,
          borderRadius: 16,
          padding: 24,
          backgroundColor: t['surface-elevated'],
        }}
      >
        <Text
          style={{
            marginBottom: 12,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1,
            color: t['text-disabled'],
          }}
        >
          ANALYSIS
        </Text>
        <Text style={{ lineHeight: 22, color: t['text-secondary'] }}>{explanation}</Text>
      </View>

      <View
        style={{
          marginBottom: 16,
          borderRadius: 16,
          padding: 24,
          backgroundColor: t['surface-elevated'],
        }}
      >
        <Text
          style={{
            marginBottom: 16,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1,
            color: t['text-disabled'],
          }}
        >
          RECOMMENDED WARMUP
        </Text>
        {warmupSets.map((set, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: i < warmupSets.length - 1 ? 1 : 0,
              borderBottomColor: t['border-default'],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  marginRight: 16,
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  backgroundColor: t['background-subtle'],
                }}
              >
                <Text style={{ fontWeight: '700', color: t['text-secondary'] }}>{i + 1}</Text>
              </View>
              <Text style={{ fontWeight: '500', color: t['text-primary'] }}>
                {set.weight} lbs × {set.reps}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: t['text-disabled'] }}>{set.restSeconds}s rest</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => {}}
        style={{
          alignItems: 'center',
          borderRadius: 16,
          padding: 20,
          backgroundColor: t['brand-primary-dark'],
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: 'white' }}>Start Training</Text>
      </Pressable>
    </View>
  )
}

const meta: Meta<typeof RecommendationCardSpecimen> = {
  title: 'Lab/Candidates/Alerts/RecommendationCard',
  component: RecommendationCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). End-of-discovery result screen — ' +
          'success banner, a huge working-weight numeral, a rep-range/confidence stat row, analysis ' +
          'copy, a numbered warmup list, and a primary CTA. titan has no comparable "success result" ' +
          'composite. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RecommendationCardSpecimen>

export const HighConfidence: Story = {
  args: {
    exerciseName: 'Barbell Back Squat',
    goalLabel: 'Strength',
    workingWeight: 225,
    repRange: [4, 6],
    confidence: 'high',
    explanation:
      'Velocity stayed consistent across all discovery sets at 225 lbs, with rep quality holding through the target range. This weight should let you train near your strength zone with reliable bar speed.',
    warmupSets: [
      { weight: 95, reps: 8, restSeconds: 60 },
      { weight: 135, reps: 5, restSeconds: 90 },
      { weight: 185, reps: 3, restSeconds: 120 },
    ],
  },
}

export const MediumConfidence: Story = {
  args: {
    exerciseName: 'Romanian Deadlift',
    goalLabel: 'Muscle Growth',
    workingWeight: 185,
    repRange: [8, 12],
    confidence: 'medium',
    explanation:
      'Velocity dropped off slightly earlier than expected during discovery, so this weight is a solid starting point but may need a small adjustment after your first working sets.',
    warmupSets: [
      { weight: 95, reps: 10, restSeconds: 45 },
      { weight: 135, reps: 6, restSeconds: 60 },
    ],
  },
}
