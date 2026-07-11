// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/ui/inputs/WeightPicker.tsx
// Rating:   Medium · titan equiv: none (no big-numeral + slider weight input)
// Why:      Prominent weight numeral over a linear slider — the native
//           `@react-native-community/slider` is replaced here with a static
//           drawn track + thumb.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const TRACK_WIDTH = 260

/** Static faithful re-render of the mobile WeightPicker (drawn, not draggable). */
function WeightPickerSpecimen({
  value,
  min,
  max,
  unit = 'lbs',
}: {
  value: number
  min: number
  max: number
  unit?: string
}) {
  const pct = (value - min) / (max - min)

  return (
    <View style={{ width: TRACK_WIDTH + 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 48, fontWeight: '700', color: t['brand-primary'] }}>{value}</Text>
      <Text style={{ fontSize: 16, color: t['text-tertiary'], marginBottom: 16 }}>{unit}</Text>

      <View
        style={{
          width: TRACK_WIDTH,
          height: 4,
          borderRadius: 2,
          backgroundColor: t['surface-elevated'],
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            width: pct * TRACK_WIDTH,
            height: 4,
            borderRadius: 2,
            backgroundColor: t['brand-primary'],
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: pct * TRACK_WIDTH - 8,
            top: -6,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: t['brand-primary'],
          }}
        />
      </View>
      <View
        style={{
          width: TRACK_WIDTH,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <Text style={{ fontSize: 11, color: t['text-disabled'] }}>{min}</Text>
        <Text style={{ fontSize: 11, color: t['text-disabled'] }}>{max}</Text>
      </View>
    </View>
  )
}

const meta: Meta<typeof WeightPickerSpecimen> = {
  title: 'Lab/Candidates/Inputs/WeightPicker',
  component: WeightPickerSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Big weight numeral over a linear ' +
          'slider for set-weight entry. titan has no numeral+slider weight input primitive. ' +
          'Static specimen; rebuild for real if promoted.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WeightPickerSpecimen>

export const Light: Story = { args: { value: 95, min: 45, max: 315 } }
export const Working: Story = { args: { value: 135, min: 45, max: 315 } }
export const Heavy: Story = { args: { value: 225, min: 45, max: 315 } }
export const Max: Story = { args: { value: 315, min: 45, max: 315 } }
