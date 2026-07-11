// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/ScrollDial.tsx
// Rating:   High · titan equiv: none (no neumorphic combination-lock style drum)
// Why:      Vertical scroll-wheel numeric drum with inset neumorphic channel and
//           faded neighbor rows — titan has no comparable drum-style stepper.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

const ITEM_HEIGHT = 32
const VISIBLE_ITEMS = 3
const DIAL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS

interface ScrollDialSpecimenProps {
  value: number
  min: number
  max: number
  label?: string
  width?: number
  formatValue?: (v: number) => string
  activeColor?: string
  disabled?: boolean
}

function DialSlot({ text, opacity }: { text: string; opacity: number }) {
  return (
    <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: alpha(t['text-disabled'], opacity),
          textAlign: 'center',
        }}
      >
        {text}
      </Text>
    </View>
  )
}

/** Static re-render of the mobile ScrollDial. Drag/wheel/tap-nudge stripped —
 * rendered at rest, centered on `value` with faded neighbor rows visible. */
function ScrollDialSpecimen({
  value,
  min,
  max,
  label,
  width = 40,
  formatValue,
  activeColor = t['text-primary'],
  disabled = false,
}: ScrollDialSpecimenProps) {
  const fmt = formatValue ?? String
  const prev2 = disabled ? '' : value + 2 <= max ? fmt(value + 2) : ''
  const prev = disabled ? '' : value + 1 <= max ? fmt(value + 1) : ''
  const current = disabled ? '–' : fmt(value)
  const next = disabled ? '' : value - 1 >= min ? fmt(value - 1) : ''
  const next2 = disabled ? '' : value - 2 >= min ? fmt(value - 2) : ''

  return (
    <View style={{ width, alignItems: 'center', opacity: disabled ? 0.35 : 1 }}>
      <View
        style={{
          height: DIAL_HEIGHT,
          width,
          overflow: 'hidden',
          borderRadius: 12,
          backgroundColor: '#0d0d0d',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: -ITEM_HEIGHT }}>
          <DialSlot text={prev2} opacity={0.08} />
          <DialSlot text={prev} opacity={0.25} />
          <View
            style={{
              height: ITEM_HEIGHT,
              width: width - 4,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 6,
              backgroundColor: alpha('#fff', 0.1),
            }}
          >
            <Text
              style={{ fontSize: 17, fontWeight: '800', color: activeColor, textAlign: 'center' }}
            >
              {current}
            </Text>
          </View>
          <DialSlot text={next} opacity={0.25} />
          <DialSlot text={next2} opacity={0.08} />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            backgroundColor: alpha('#0d0d0d', 0.45),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            backgroundColor: alpha('#0d0d0d', 0.45),
          }}
        />
      </View>
      {label && (
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
          {label}
        </Text>
      )}
    </View>
  )
}

const meta: Meta<typeof ScrollDialSpecimen> = {
  title: 'Lab/Candidates/Inputs/ScrollDial',
  component: ScrollDialSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Neumorphic vertical scroll-wheel ' +
          'drum, combination-lock style, with faded neighbor rows either side of the raised current ' +
          'value. titan has no comparable drum stepper. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ScrollDialSpecimen>

export const MidValue: Story = { args: { value: 8, min: 0, max: 20, label: 'reps' } }
export const NearMax: Story = { args: { value: 19, min: 0, max: 20, label: 'reps' } }
export const NearMin: Story = { args: { value: 1, min: 0, max: 20, label: 'reps' } }
export const Disabled: Story = {
  args: { value: 8, min: 0, max: 20, label: 'reps', disabled: true },
}
