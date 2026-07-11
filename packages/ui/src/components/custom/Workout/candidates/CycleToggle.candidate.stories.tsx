// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/CycleToggle.tsx
// Rating:   Medium · titan equiv: none (no tap-to-cycle pill)
// Why:      Compact pill that advances through a fixed option list on tap —
//           used for Set/Rep and Velocity/Force/Position toggles. Rendered
//           here at a single held option (no cycling on press).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TouchableOpacity, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface CycleToggleOption {
  value: string
  label: string
}

/** Static faithful re-render of the mobile CycleToggle (held at one option, onPress is a no-op). */
function CycleToggleSpecimen({
  options,
  value,
  activeColor = t['brand-primary'],
}: {
  options: readonly CycleToggleOption[]
  value: string
  activeColor?: string
}) {
  const current = options.find((o) => o.value === value)
  const label = current?.label ?? value

  return (
    <TouchableOpacity
      onPress={() => {}}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}, tap to switch`}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: alpha(activeColor, 0.15),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: activeColor }}>{label}</Text>
    </TouchableOpacity>
  )
}

const meta: Meta<typeof CycleToggleSpecimen> = {
  title: 'Lab/Candidates/Inputs/CycleToggle',
  component: CycleToggleSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Small pill that advances through ' +
          'a fixed option list on tap (Set/Rep, Velocity/Force/Position). titan has no tap-to-cycle ' +
          'toggle primitive. Static specimen; rebuild for real if promoted.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CycleToggleSpecimen>

const VIEW_OPTIONS = [
  { value: 'set', label: 'SET' },
  { value: 'rep', label: 'REP' },
]

const SIGNAL_OPTIONS = [
  { value: 'velocity', label: 'VELOCITY' },
  { value: 'force', label: 'FORCE' },
  { value: 'position', label: 'POSITION' },
]

export const SetView: Story = { args: { options: VIEW_OPTIONS, value: 'set' } }
export const RepView: Story = { args: { options: VIEW_OPTIONS, value: 'rep' } }
export const VelocitySignal: Story = {
  args: { options: SIGNAL_OPTIONS, value: 'velocity', activeColor: t['status-info'] },
}
