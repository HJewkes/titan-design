// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/JunkVolumeAlert.tsx
// Rating:   Medium · titan equiv: ui/Alert (generic status banner, no metric footer row)
// Why:      Domain-specific severity banner (stop vs. declining) with a rep-drop /
//           velocity-recovery stat line — titan's Alert has no metric footer slot.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface JunkVolumeAlertSpecimenProps {
  isJunkVolume: boolean
  message: string
  repDropPercent: number
  velocityRecoveryPercent: number
}

/** Static re-render of the mobile JunkVolumeAlert (stop-circle vs trending-down glyph). */
function JunkVolumeAlertSpecimen({
  isJunkVolume,
  message,
  repDropPercent,
  velocityRecoveryPercent,
}: JunkVolumeAlertSpecimenProps) {
  const color = isJunkVolume ? t['status-error'] : t['status-warning']
  const glyph = isJunkVolume ? '⛔' : '↓'

  return (
    <View
      style={{
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: alpha(color, 0.08),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: 320,
      }}
    >
      <Text style={{ fontSize: 22, color }}>{glyph}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color }}>
          {isJunkVolume ? 'Junk Volume Detected' : 'Performance Declining'}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: t['text-disabled'] }}>{message}</Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: t['text-disabled'] }}>
          Rep drop: {repDropPercent.toFixed(0)}% | Velocity recovery:{' '}
          {velocityRecoveryPercent.toFixed(0)}%
        </Text>
      </View>
    </View>
  )
}

const meta: Meta<typeof JunkVolumeAlertSpecimen> = {
  title: 'Lab/Candidates/Alerts/JunkVolumeAlert',
  component: JunkVolumeAlertSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Icon+message alert banner that ' +
          'fires when set quality degrades beyond a productive threshold; escalates from a warning ' +
          '(declining) to an error (stop) tint. titan equiv: `ui/Alert` (generic status banner, no ' +
          'metric footer). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof JunkVolumeAlertSpecimen>

export const PerformanceDeclining: Story = {
  args: {
    isJunkVolume: false,
    message: 'Rep velocity is dropping faster than usual between sets.',
    repDropPercent: 18,
    velocityRecoveryPercent: 62,
  },
}

export const JunkVolumeDetected: Story = {
  args: {
    isJunkVolume: true,
    message: 'Bar speed and rep quality have collapsed — consider ending this exercise.',
    repDropPercent: 41,
    velocityRecoveryPercent: 29,
  },
}
