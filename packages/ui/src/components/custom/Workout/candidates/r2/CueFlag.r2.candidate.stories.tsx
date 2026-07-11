// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). This shows
// the LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/status.tsx (CueFlag) + r2.css `.r2-cue`
// Rating:   Low-Medium · titan equiv: none (nearest is the generic coaching-card shell concept,
//           not yet built)
// Why:      A trigger-only in-set coaching cue banner (amber/red) that appears only at the
//           VL20/VL28 thresholds — deterministic, not continuous. Renders nothing below threshold
//           (mirrored here as a null-state note rather than a story, since there is nothing to
//           show).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

type Level = 'amber' | 'red'

const LEVEL_COLOR: Record<Level, string> = { amber: t['status-warning'], red: t['status-error'] }
const LEVEL_BG: Record<Level, string> = {
  amber: 'rgba(255,176,32,0.14)',
  red: 'rgba(209,67,67,0.16)',
}
const LEVEL_BORDER: Record<Level, string> = {
  amber: 'rgba(255,176,32,0.4)',
  red: 'rgba(209,67,67,0.45)',
}

/** Static faithful re-render of the R2 CueFlag — deterministic in-set trigger cue. */
function CueFlagSpecimen({ level }: { level: Level }) {
  const text =
    level === 'red'
      ? '■ Velocity loss 31% — end the set now.'
      : '▲ VL20 · target reps met — final rep or end set.'
  return (
    <View
      style={{
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: LEVEL_BG[level],
        borderWidth: 1,
        borderColor: LEVEL_BORDER[level],
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: LEVEL_COLOR[level] }}>{text}</Text>
    </View>
  )
}

const meta: Meta<typeof CueFlagSpecimen> = {
  title: 'Lab/Candidates/R2Live/CueFlag',
  component: CueFlagSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Trigger-only ' +
          'in-set coaching cue banner, shown only at the VL20/VL28 velocity-loss thresholds ' +
          '(deterministic, not continuous). No titan equivalent. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CueFlagSpecimen>

export const Vl20Threshold: Story = { args: { level: 'amber' } }
export const StopNow: Story = { args: { level: 'red' } }
