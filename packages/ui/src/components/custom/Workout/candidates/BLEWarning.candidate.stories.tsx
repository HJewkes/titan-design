// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/device/BLEWarning.tsx
// Rating:   Low · titan equiv: ui/Alert (status="warning", showIcon) is a near-1:1 match
// Why:      Included for completeness — this is the simplest of the alert family and maps
//           almost directly onto titan's existing Alert; ships as a specimen anyway so the
//           review can confirm it should just become an Alert usage, not a new primitive.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface BLEWarningSpecimenProps {
  environment: 'simulator' | 'expo-go'
  message: string
}

/** Static re-render of the mobile BLEWarning inline banner. */
function BLEWarningSpecimen({ environment, message }: BLEWarningSpecimenProps) {
  const title = environment === 'simulator' ? 'Simulator Detected' : 'Expo Go Detected'

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 12,
        padding: 16,
        backgroundColor: alpha(t['status-warning'], 0.08),
        width: 320,
      }}
    >
      <Text style={{ fontSize: 18, color: t['status-warning'], marginTop: 2 }}>⚠</Text>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ marginBottom: 4, fontWeight: '600', color: t['status-warning'] }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 18, color: t['text-secondary'] }}>{message}</Text>
      </View>
    </View>
  )
}

const meta: Meta<typeof BLEWarningSpecimen> = {
  title: 'Lab/Candidates/Alerts/BLEWarning',
  component: BLEWarningSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Inline icon+title+message ' +
          'warning banner for BLE environment issues (simulator/Expo Go). titan equiv: `ui/Alert` ' +
          '(status="warning") is a near-1:1 match — this specimen exists to confirm that in review. ' +
          'Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BLEWarningSpecimen>

export const Simulator: Story = {
  args: {
    environment: 'simulator',
    message:
      'Bluetooth is unavailable in the iOS Simulator. Connect a real device to test live rep data.',
  },
}

export const ExpoGo: Story = {
  args: {
    environment: 'expo-go',
    message:
      'Expo Go does not support the BLE module. Use a development build to connect a device.',
  },
}
