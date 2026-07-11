// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/VerticalWeightJog.tsx
// Rating:   High · titan equiv: none (no elastic weight jog with last-session hint)
// Why:      Vertical elastic jog-shuttle for weight with an inline "Last: XX lbs"
//           hint — titan has no comparable weight input with session-recall context.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

const DRUM_HEIGHT = 96

interface VerticalWeightJogSpecimenProps {
  weight: number
  disabled?: boolean
  lastSessionWeight?: number
}

/** Static re-render of the mobile VerticalWeightJog at rest (no drag/tick, pillStretch = 0). */
function VerticalWeightJogSpecimen({
  weight,
  disabled = false,
  lastSessionWeight,
}: VerticalWeightJogSpecimenProps) {
  return (
    <View style={{ alignItems: 'center', opacity: disabled ? 0.35 : 1 }}>
      <View style={{ height: DRUM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: alpha(t['brand-primary'], 0.15),
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 72,
            minHeight: 60,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: t['brand-primary'],
              textAlign: 'center',
            }}
          >
            {weight}
          </Text>
        </View>
      </View>
      <Text
        style={{
          marginTop: 4,
          fontSize: 9,
          fontWeight: '600',
          color: t['text-disabled'],
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        lbs
      </Text>
      {lastSessionWeight !== undefined && (
        <Text
          style={{
            marginTop: 2,
            fontSize: 9,
            fontWeight: '500',
            color: t['text-tertiary'],
            textAlign: 'center',
          }}
        >
          {`Last: ${lastSessionWeight} lbs`}
        </Text>
      )}
    </View>
  )
}

const meta: Meta<typeof VerticalWeightJogSpecimen> = {
  title: 'Lab/Candidates/Inputs/VerticalWeightJog',
  component: VerticalWeightJogSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Vertical elastic jog-shuttle for ' +
          'weight input with an optional "Last: XX lbs" session-recall hint below. titan has no ' +
          'comparable weight jog. Rendered at a resting value (no stretch). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof VerticalWeightJogSpecimen>

export const WithLastSession: Story = { args: { weight: 185, lastSessionWeight: 175 } }
export const NoLastSessionHint: Story = { args: { weight: 95 } }
export const HeavyWeight: Story = { args: { weight: 315, lastSessionWeight: 305 } }
export const Disabled: Story = { args: { weight: 135, lastSessionWeight: 130, disabled: true } }
