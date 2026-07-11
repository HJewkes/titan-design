// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/ExerciseSessionActionButtons.tsx
// Rating:   Medium · titan equiv: none (no state-machine action bar)
// Why:      Context-aware action bar that swaps buttons per session UI state
//           (ready / recording / resting). Buttons render for look only —
//           onPress wired to no-ops.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function SolidButton({
  label,
  icon,
  color = t['brand-primary'],
}: {
  label: string
  icon: string
  color?: string
}) {
  return (
    <Pressable
      onPress={() => {}}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color,
        borderRadius: 16,
        paddingVertical: 14,
        flex: 1,
      }}
    >
      <Text style={{ fontSize: 16, color: '#fff', marginRight: 8 }}>{icon}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{label}</Text>
    </Pressable>
  )
}

function OutlineButton({
  label,
  icon,
  iconOnly,
}: {
  label?: string
  icon: string
  iconOnly?: boolean
}) {
  return (
    <Pressable
      onPress={() => {}}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: t['brand-primary'],
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: iconOnly ? 18 : 0,
        flex: iconOnly ? undefined : 1,
      }}
    >
      <Text style={{ fontSize: 16, color: t['brand-primary'], marginRight: iconOnly ? 0 : 8 }}>
        {icon}
      </Text>
      {label && (
        <Text style={{ fontSize: 15, fontWeight: '700', color: t['brand-primary'] }}>{label}</Text>
      )}
    </Pressable>
  )
}

type UIState = 'ready' | 'recording' | 'resting'

/** Static re-render: which button row shows depends on `uiState`. */
function ExerciseSessionActionButtonsSpecimen({ uiState }: { uiState: UIState }) {
  return (
    <View style={{ width: 320 }}>
      {uiState === 'ready' && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 3 }}>
            <SolidButton label="START" icon="▶" />
          </View>
          <View style={{ flex: 1 }}>
            <OutlineButton icon="✕" iconOnly />
          </View>
        </View>
      )}
      {uiState === 'recording' && (
        <View style={{ gap: 8 }}>
          <OutlineButton label="Done Set" icon="✓" />
          <SolidButton label="Stop & Save" icon="■" color={t['status-error']} />
        </View>
      )}
      {uiState === 'resting' && (
        <View style={{ gap: 8 }}>
          <OutlineButton label="Skip Rest" icon="⏩" />
          <SolidButton label="Stop & Save" icon="■" color={t['status-error']} />
        </View>
      )}
    </View>
  )
}

const meta: Meta<typeof ExerciseSessionActionButtonsSpecimen> = {
  title: 'Lab/Candidates/Live/ExerciseSessionActionButtons',
  component: ExerciseSessionActionButtonsSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Context-aware action bar that ' +
          'swaps buttons per session state (Start / Done Set + Stop / Skip Rest + Stop). titan has ' +
          'no equivalent state-machine action bar. Static specimen — buttons wired to no-ops.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ExerciseSessionActionButtonsSpecimen>

export const Ready: Story = { args: { uiState: 'ready' } }
export const Recording: Story = { args: { uiState: 'recording' } }
export const Resting: Story = { args: { uiState: 'resting' } }
