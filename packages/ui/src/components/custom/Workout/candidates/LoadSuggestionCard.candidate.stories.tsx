// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/LoadSuggestionCard.tsx
// Rating:   High · titan equiv: none (no card variant keys color/icon off a direction enum)
// Why:      Weight-adjustment recommendation card — icon, tint, and a confidence badge all
//           derive from an increase/decrease/maintain direction; titan has no such card.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

type Direction = 'increase' | 'decrease' | 'maintain'
type Confidence = 'low' | 'medium' | 'high'

interface LoadSuggestionCardSpecimenProps {
  currentWeight: number
  suggestedWeight: number
  direction: Direction
  reason: string
  confidence: Confidence
}

/** Static re-render of the mobile LoadSuggestionCard (direction-driven icon/tint/badge). */
function LoadSuggestionCardSpecimen({
  currentWeight,
  suggestedWeight,
  direction,
  reason,
  confidence,
}: LoadSuggestionCardSpecimenProps) {
  const glyph = direction === 'increase' ? '↑' : direction === 'decrease' ? '↓' : '✓'
  const iconColor =
    direction === 'increase'
      ? t['status-success']
      : direction === 'decrease'
        ? t['status-warning']
        : t['brand-primary']
  const bgColor = alpha(iconColor, 0.08)
  const delta = suggestedWeight - currentWeight
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`

  return (
    <View
      style={{
        borderRadius: 12,
        padding: 16,
        backgroundColor: bgColor,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: 320,
      }}
    >
      <Text style={{ fontSize: 26, color: iconColor }}>{glyph}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: t['text-primary'] }}>
          {direction === 'maintain'
            ? `Keep ${currentWeight} lbs`
            : `${direction === 'increase' ? 'Increase' : 'Decrease'} to ${suggestedWeight} lbs`}
        </Text>
        {direction !== 'maintain' && (
          <Text style={{ marginTop: 4, fontSize: 13, color: iconColor }}>{deltaText} lbs</Text>
        )}
        <Text style={{ marginTop: 4, fontSize: 12, color: t['text-disabled'] }}>{reason}</Text>
      </View>
      {confidence !== 'low' && (
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: alpha(iconColor, 0.12),
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '500', color: iconColor }}>{confidence}</Text>
        </View>
      )}
    </View>
  )
}

const meta: Meta<typeof LoadSuggestionCardSpecimen> = {
  title: 'Lab/Candidates/Alerts/LoadSuggestionCard',
  component: LoadSuggestionCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Between-set weight-adjustment ' +
          'card — icon, tint, and headline all derive from an increase/decrease/maintain direction, ' +
          'plus an optional confidence badge. titan has no comparable direction-driven card. ' +
          'Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LoadSuggestionCardSpecimen>

export const Increase: Story = {
  args: {
    currentWeight: 185,
    suggestedWeight: 195,
    direction: 'increase',
    reason: 'Velocity stayed above target across all sets — ready for more load.',
    confidence: 'high',
  },
}

export const Decrease: Story = {
  args: {
    currentWeight: 225,
    suggestedWeight: 205,
    direction: 'decrease',
    reason: 'Rep quality dropped sharply on the last two sets.',
    confidence: 'medium',
  },
}

export const Maintain: Story = {
  args: {
    currentWeight: 135,
    suggestedWeight: 135,
    direction: 'maintain',
    reason: 'Velocity and rep consistency are right on target.',
    confidence: 'high',
  },
}

export const LowConfidence: Story = {
  args: {
    currentWeight: 95,
    suggestedWeight: 100,
    direction: 'increase',
    reason: 'Limited history for this exercise — recommendation is provisional.',
    confidence: 'low',
  },
}
