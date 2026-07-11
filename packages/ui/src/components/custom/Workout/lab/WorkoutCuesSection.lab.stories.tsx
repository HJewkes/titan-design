// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/settings/WorkoutCuesSection.tsx
// Rating:   Medium · titan equiv: none (no icon-header settings card w/ toggle rows)
// Why:      Icon-header card with 3 label/description/Switch toggle rows for
//           haptic/audio/voice cues — titan has no settings-section primitive.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Switch } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function ToggleRow({
  label,
  description,
  value,
}: {
  label: string
  description: string
  value: boolean
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: t['text-primary'] }}>{label}</Text>
        <Text style={{ fontSize: 12, color: t['text-disabled'], marginTop: 2 }}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => {}}
        trackColor={{ false: t['background-subtle'], true: t['brand-primary'] }}
      />
    </View>
  )
}

/** Static faithful re-render of the mobile WorkoutCuesSection (preference load stripped). */
function WorkoutCuesSectionSpecimen({
  hapticEnabled,
  audioEnabled,
  voiceEnabled,
}: {
  hapticEnabled: boolean
  audioEnabled: boolean
  voiceEnabled: boolean
}) {
  return (
    <View
      style={{ width: 340, backgroundColor: t['surface-input'], borderRadius: 12, padding: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: t['brand-primary'],
            marginRight: 10,
          }}
        />
        <Text style={{ fontSize: 17, fontWeight: '700', color: t['text-primary'] }}>
          Workout Cues
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: t['text-disabled'], marginBottom: 12 }}>
        Get notified at 30s, 10s, and when rest ends.
      </Text>
      <ToggleRow
        label="Haptic Feedback"
        description="Vibration during rest countdown"
        value={hapticEnabled}
      />
      <ToggleRow
        label="Audio Cues"
        description="Beep sounds during rest countdown"
        value={audioEnabled}
      />
      <ToggleRow
        label="Voice Coaching"
        description="Hear AI coaching cues spoken aloud"
        value={voiceEnabled}
      />
    </View>
  )
}

const meta: Meta<typeof WorkoutCuesSectionSpecimen> = {
  title: 'Lab/Settings/WorkoutCuesSection',
  component: WorkoutCuesSectionSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Icon-header settings card with ' +
          'label/description/Switch toggle rows for haptic, audio, and voice-coaching cues. titan has ' +
          'no settings-section primitive with this layout. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WorkoutCuesSectionSpecimen>

export const DefaultSettings: Story = {
  args: { hapticEnabled: true, audioEnabled: true, voiceEnabled: false },
}
export const VoiceCoachingOn: Story = {
  args: { hapticEnabled: true, audioEnabled: true, voiceEnabled: true },
}
export const MinimalCues: Story = {
  args: { hapticEnabled: true, audioEnabled: false, voiceEnabled: false },
}
