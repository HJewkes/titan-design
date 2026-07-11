// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/mode/IncrementRow.tsx
// Rating:   Medium · titan equiv: none (no quick-increment button row)
// Why:      Row of ±1/±5/±10 chips for fast load/target adjustment mid-set.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, TouchableOpacity } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

const INCREMENTS = [-10, -5, -1, 1, 5, 10] as const

/** Static faithful re-render of the mobile IncrementRow (onPress is a no-op). */
function IncrementRowSpecimen({ value, min, max }: { value: number; min: number; max: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {INCREMENTS.map((inc) => {
        const next = value + inc
        const disabled = next < min || next > max
        const label = inc > 0 ? `+${inc}` : String(inc)
        return (
          <TouchableOpacity
            key={inc}
            onPress={() => {}}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${inc > 0 ? 'Increase' : 'Decrease'} by ${Math.abs(inc)} pounds`}
            style={{
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: alpha(t['brand-primary'], disabled ? 0.05 : 0.12),
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: disabled ? t['text-disabled'] : t['brand-primary'],
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const meta: Meta<typeof IncrementRowSpecimen> = {
  title: 'Lab/Candidates/Inputs/IncrementRow',
  component: IncrementRowSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Row of ±1/±5/±10 quick-increment ' +
          'chips for fast weight/target adjustment. titan has no equivalent quick-increment control. ' +
          'Static specimen; rebuild for real if promoted.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof IncrementRowSpecimen>

export const MidRange: Story = { args: { value: 135, min: 5, max: 315 } }
export const NearMax: Story = { args: { value: 310, min: 5, max: 315 } }
export const NearMin: Story = { args: { value: 10, min: 5, max: 315 } }
