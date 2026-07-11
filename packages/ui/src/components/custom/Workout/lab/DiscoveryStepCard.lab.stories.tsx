// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/planning/DiscoveryStepCard.tsx
// Rating:   High · titan equiv: none (no hero-numeral discovery card)
// Why:      Phase badge + giant weight numeral + reps/sets-done stat row +
//           velocity-expectation pill. titan has no weight-discovery pattern.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

type DiscoveryPhase = 'not_started' | 'exploring' | 'dialing_in' | 'complete'

const PHASE_CONFIG: Record<DiscoveryPhase, { label: string; color: string; glyph: string }> = {
  not_started: { label: 'Ready', color: t['text-disabled'], glyph: '○' },
  exploring: { label: 'Exploring', color: t['brand-primary'], glyph: '◎' },
  dialing_in: { label: 'Dialing In', color: t['status-warning'], glyph: '◉' },
  complete: { label: 'Complete', color: t['status-success'], glyph: '✓' },
}

/** Static faithful re-render of the mobile DiscoveryStepCard. */
function DiscoveryStepCardSpecimen({
  weight,
  targetReps,
  completedCount,
  stepNumber,
  phase,
  purpose,
  velocityExpectation,
}: {
  weight: number
  targetReps: number
  completedCount: number
  stepNumber: number
  phase: DiscoveryPhase
  purpose: string
  velocityExpectation?: string
}) {
  const phaseConfig = PHASE_CONFIG[phase]

  return (
    <View
      style={{ width: 320, borderRadius: 16, backgroundColor: t['surface-elevated'], padding: 24 }}
    >
      <View
        style={{
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: alpha(phaseConfig.color, 0.12),
          }}
        >
          <Text style={{ marginRight: 4, fontSize: 13, color: phaseConfig.color }}>
            {phaseConfig.glyph}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: phaseConfig.color }}>
            {phaseConfig.label}
          </Text>
        </View>
        <Text style={{ fontWeight: '600', color: t['text-disabled'] }}>Step {stepNumber}</Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text style={{ fontSize: 64, fontWeight: '700', color: t['brand-primary'] }}>{weight}</Text>
        <Text style={{ marginTop: 4, fontSize: 20, color: t['text-disabled'] }}>lbs</Text>
      </View>

      <View style={{ borderRadius: 12, backgroundColor: t['surface-input'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: t['text-disabled'] }}>↻</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: t['text-disabled'] }}>
              Target Reps
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: t['text-primary'] }}
            >
              {targetReps}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: t['text-disabled'] }}>▤</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: t['text-disabled'] }}>Sets Done</Text>
            <Text
              style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: t['text-primary'] }}
            >
              {completedCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: '500',
            color: t['text-secondary'],
          }}
        >
          {purpose}
        </Text>
      </View>

      {velocityExpectation && (
        <View
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: alpha(t['brand-primary'], 0.06),
          }}
        >
          <Text style={{ marginRight: 6, fontSize: 14, color: t['brand-primary'] }}>⚡</Text>
          <Text style={{ fontSize: 13, color: t['brand-primary'] }}>{velocityExpectation}</Text>
        </View>
      )}
    </View>
  )
}

const meta: Meta<typeof DiscoveryStepCardSpecimen> = {
  title: 'Lab/Discovery/DiscoveryStepCard',
  component: DiscoveryStepCardSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Phase badge, hero weight numeral, ' +
          'reps/sets-done stat row, and a velocity-expectation pill for weight-discovery flows. titan ' +
          'has no equivalent hero-numeral card. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DiscoveryStepCardSpecimen>

export const Exploring: Story = {
  args: {
    weight: 95,
    targetReps: 8,
    completedCount: 1,
    stepNumber: 2,
    phase: 'exploring',
    purpose: 'Find a weight where reps 6–8 feel challenging but controlled.',
    velocityExpectation: 'Expect ~0.75 m/s on rep 1',
  },
}

export const DialingIn: Story = {
  args: {
    weight: 135,
    targetReps: 8,
    completedCount: 3,
    stepNumber: 4,
    phase: 'dialing_in',
    purpose: 'Narrow in on the working weight for this exercise.',
    velocityExpectation: 'Expect ~0.55 m/s on rep 1',
  },
}

export const Complete: Story = {
  args: {
    weight: 155,
    targetReps: 8,
    completedCount: 5,
    stepNumber: 5,
    phase: 'complete',
    purpose: 'Working weight locked in for this program block.',
  },
}
