// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/dashboard/DeloadBanner.tsx
// Rating:   High · titan equiv: none (no alert + inline stat-pill row combo)
// Why:      Analytics-dashboard alert banner that pairs a message with a row of small
//           stat pills (volume reduction %, duration) — titan's Alert has no pill-row slot.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')
const ACCENT = t['status-warning']

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: alpha(ACCENT, 0.12),
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>{value}</Text>
      <Text style={{ fontSize: 12, color: t['text-disabled'] }}>{label}</Text>
    </View>
  )
}

interface DeloadBannerSpecimenProps {
  message: string
  volumeReductionPercent: number
  durationDays: number
}

/** Static re-render of the mobile DeloadBanner (message + volume/duration stat pills). */
function DeloadBannerSpecimen({
  message,
  volumeReductionPercent,
  durationDays,
}: DeloadBannerSpecimenProps) {
  return (
    <View style={{ width: 320, borderRadius: 16, backgroundColor: t['surface-elevated'] }}>
      <View style={{ borderRadius: 12, padding: 16, backgroundColor: alpha(ACCENT, 0.06) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 22, color: ACCENT }}>🛌</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>
              Deload Week Recommended
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: t['text-secondary'] }}>
              {message}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <StatPill label="Volume" value={`${volumeReductionPercent}%`} />
              <StatPill label="Duration" value={`${durationDays}d`} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const meta: Meta<typeof DeloadBannerSpecimen> = {
  title: 'Lab/Candidates/Alerts/DeloadBanner',
  component: DeloadBannerSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Analytics-dashboard alert that ' +
          'pairs a recommendation message with a row of compact stat pills (volume reduction %, ' +
          "duration). titan's Alert has no pill-row slot for this. Static specimen.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeloadBannerSpecimen>

export const StandardDeload: Story = {
  args: {
    message:
      'Training load has stayed elevated for 4 weeks straight. Back off to let recovery catch up.',
    volumeReductionPercent: 65,
    durationDays: 7,
  },
}

export const AggressiveDeload: Story = {
  args: {
    message:
      'Volume and intensity have both spiked sharply — a deeper reset is recommended before continuing.',
    volumeReductionPercent: 50,
    durationDays: 10,
  },
}

export const ShortDeload: Story = {
  args: {
    message:
      'Minor fatigue accumulation detected. A short, light week should be enough to recover.',
    volumeReductionPercent: 80,
    durationDays: 4,
  },
}
