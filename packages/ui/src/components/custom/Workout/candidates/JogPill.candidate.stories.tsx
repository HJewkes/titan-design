// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/JogPill.tsx
// Rating:   High · titan equiv: none (no elastic jog-shuttle numeric input)
// Why:      Drag-to-jog pill with elastic stretch + accelerating tick — titan has
//           only static steppers/inputs, nothing with this shuttle interaction shape.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface JogPillSpecimenProps {
  value: number
  formatValue?: (v: number) => string
  orientation?: 'vertical' | 'horizontal'
  label?: string
  color?: string
  disabled?: boolean
  pillWidth?: number
  pillHeight?: number
  fontSize?: number
}

/** Static re-render of the mobile JogPill at rest (no drag/tick, pillStretch = 0). */
function JogPillSpecimen({
  value,
  formatValue = String,
  orientation = 'vertical',
  label,
  color = t['brand-primary'],
  disabled = false,
  pillWidth,
  pillHeight,
  fontSize = 16,
}: JogPillSpecimenProps) {
  const isHorizontal = orientation === 'horizontal'
  return (
    <View style={{ alignItems: 'center', opacity: disabled ? 0.35 : 1 }}>
      <View
        style={{
          backgroundColor: alpha(color, 0.15),
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: isHorizontal ? 'row' : 'column',
          minWidth: pillWidth ?? (isHorizontal ? 80 : 60),
          minHeight: pillHeight ?? (isHorizontal ? 28 : 48),
          borderRadius: 12,
          paddingHorizontal: isHorizontal ? 12 : 14,
          paddingVertical: isHorizontal ? 6 : 10,
        }}
      >
        <Text
          style={{
            fontSize,
            fontWeight: '700',
            color,
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatValue(value)}
        </Text>
      </View>
      {label && (
        <Text
          style={{
            marginTop: 3,
            fontSize: 9,
            fontWeight: '600',
            color: t['text-disabled'],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  )
}

const meta: Meta<typeof JogPillSpecimen> = {
  title: 'Lab/Candidates/Inputs/JogPill',
  component: JogPillSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Elastic jog-shuttle numeric pill — ' +
          'drag stretches the pill and accelerates ticking. titan has no equivalent shuttle input. ' +
          'Rendered here at a resting value (no stretch). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof JogPillSpecimen>

export const VerticalWeight: Story = { args: { value: 185, orientation: 'vertical', label: 'lbs' } }
export const HorizontalRest: Story = {
  args: {
    value: 90,
    orientation: 'horizontal',
    color: t['text-tertiary'],
    pillWidth: 64,
    pillHeight: 20,
    fontSize: 11,
    formatValue: (v) => `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, '0')}`,
  },
}
export const WithLabel: Story = {
  args: { value: 8, orientation: 'vertical', label: 'reps', fontSize: 20 },
}
export const Disabled: Story = {
  args: { value: 135, orientation: 'vertical', label: 'lbs', disabled: true },
}
