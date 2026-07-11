// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/mode/EccentricSlider.tsx
// Rating:   Medium · titan equiv: none (no signed/bipolar slider)
// Why:      Signed (±195) eccentric-load slider, color-coded by sign around a
//           zero center — the native `@react-native-community/slider` is
//           replaced here with a static drawn track + thumb.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const MIN = -195
const MAX = 195
const TRACK_WIDTH = 260

function formatValue(v: number): string {
  return v > 0 ? `+${v}` : String(v)
}

/** Static faithful re-render of the mobile EccentricSlider (drawn, not draggable). */
function EccentricSliderSpecimen({ value }: { value: number }) {
  const color = value > 0 ? t['status-success'] : value < 0 ? t['status-error'] : t['text-disabled']
  const zeroPct = (0 - MIN) / (MAX - MIN)
  const valuePct = (value - MIN) / (MAX - MIN)
  const fillLeft = Math.min(zeroPct, valuePct) * TRACK_WIDTH
  const fillWidth = Math.abs(valuePct - zeroPct) * TRACK_WIDTH

  return (
    <View style={{ width: TRACK_WIDTH + 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 36, fontWeight: '700', color }}>{formatValue(value)}</Text>
      <Text style={{ fontSize: 13, color: t['text-tertiary'], marginBottom: 16 }}>
        {value > 0 ? 'Overload' : value < 0 ? 'Underload' : 'Balanced'}
      </Text>

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
            left: fillLeft,
            width: fillWidth,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: valuePct * TRACK_WIDTH - 8,
            top: -6,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: color,
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
        <Text style={{ fontSize: 11, color: t['text-disabled'] }}>-195</Text>
        <Text style={{ fontSize: 11, color: t['text-disabled'] }}>0</Text>
        <Text style={{ fontSize: 11, color: t['text-disabled'] }}>+195</Text>
      </View>

      <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: t['text-disabled'] }}>
        {value > 0
          ? 'Eccentric overload: more resistance when lowering'
          : value < 0
            ? 'Eccentric underload: less resistance when lowering'
            : 'Equal resistance for lifting and lowering'}
      </Text>
    </View>
  )
}

const meta: Meta<typeof EccentricSliderSpecimen> = {
  title: 'Lab/Candidates/Inputs/EccentricSlider',
  component: EccentricSliderSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Signed (±195) slider for eccentric ' +
          'load, fills from a zero center and flips green/red by sign. titan has no bipolar/signed ' +
          'slider primitive. Static specimen; rebuild for real if promoted.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof EccentricSliderSpecimen>

export const Balanced: Story = { args: { value: 0 } }
export const Overload: Story = { args: { value: 40 } }
export const StrongOverload: Story = { args: { value: 150 } }
export const Underload: Story = { args: { value: -60 } }
