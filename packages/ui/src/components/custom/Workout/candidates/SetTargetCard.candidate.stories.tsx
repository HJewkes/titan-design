// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/SetTargetCard.tsx
// Rating:   High · titan equiv: none (no big-numeral pre-set target card)
// Why:      Shown in the 'ready' state before recording starts — a huge weight
//           numeral with a target reps/RIR stat row underneath.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface SetTargetCardSpecimenProps {
  setNumber: number
  totalSets: number
  weight: number
  targetReps: number
  rirTarget?: number
  isWarmup?: boolean
  isDiscovery?: boolean
}

/** Static re-render of SetTargetCard (Card/CardContent/Surface flattened to Views). */
function SetTargetCardSpecimen({
  setNumber,
  totalSets,
  weight,
  targetReps,
  rirTarget,
  isWarmup,
  isDiscovery,
}: SetTargetCardSpecimenProps) {
  const badgeColor = isWarmup ? t['status-warning'] : t['brand-primary']
  const badgeLabel = isDiscovery ? 'Testing' : isWarmup ? 'Warmup' : 'Working'
  const kicker = isDiscovery ? 'Discovery Set' : isWarmup ? 'Warmup' : 'Set'

  return (
    <View
      style={{ width: 320, backgroundColor: t['surface-elevated'], borderRadius: 16, padding: 24 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: '600', color: t['text-disabled'] }}>
          {kicker} {setNumber} of {totalSets}
        </Text>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: alpha(badgeColor, 0.12),
          }}
        >
          <Text style={{ fontWeight: '700', color: badgeColor }}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text style={{ fontSize: 56, fontWeight: '700', color: t['brand-primary'] }}>{weight}</Text>
        <Text style={{ marginTop: 4, fontSize: 20, color: t['text-disabled'] }}>lbs</Text>
      </View>

      <View style={{ backgroundColor: t['surface-input'], borderRadius: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18 }}>↻</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: t['text-disabled'] }}>
              Target Reps
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 18, fontWeight: '700', color: t['text-primary'] }}
            >
              {targetReps}
            </Text>
          </View>
          {rirTarget !== undefined && (
            <>
              <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 18 }}>💪</Text>
                <Text style={{ marginTop: 4, fontSize: 13, color: t['text-disabled'] }}>
                  Target RIR
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 18,
                    fontWeight: '700',
                    color: t['text-primary'],
                  }}
                >
                  {rirTarget}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: t['text-disabled'] }}>
        {isDiscovery
          ? 'Complete all reps with good form. Stop if weight feels too heavy.'
          : 'Press START when ready to begin recording.'}
      </Text>
    </View>
  )
}

const meta: Meta<typeof SetTargetCardSpecimen> = {
  title: 'Lab/Candidates/Live/SetTargetCard',
  component: SetTargetCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Pre-set "ready" card: a huge ' +
          'weight numeral over a target reps/RIR stat row. titan has no equivalent big-numeral ' +
          'target card. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SetTargetCardSpecimen>

export const WorkingSet: Story = {
  args: { setNumber: 3, totalSets: 5, weight: 225, targetReps: 8, rirTarget: 2 },
}
export const WarmupSet: Story = {
  args: { setNumber: 1, totalSets: 5, weight: 135, targetReps: 12, isWarmup: true },
}
export const DiscoverySet: Story = {
  args: { setNumber: 1, totalSets: 3, weight: 185, targetReps: 5, isDiscovery: true },
}
