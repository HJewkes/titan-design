// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). This shows
// the LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/status.tsx (StatusPill) + r2.css `.r2-status-pill`
// Rating:   Medium · titan equiv: none (StatusDot atom is a bare dot; no pill+dot+verdict-text
//           composite exists)
// Why:      Human-readable auto-regulation verdict — productive / threshold / stop — driven by
//           velocity-loss %, glowing dot + colored pill text. Read-once summary of FatigueMeter's
//           needle position.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

type Level = '' | 'amber' | 'red'

function auraFor(lossPct: number, repCount: number): Level {
  if (repCount === 0) return ''
  if (lossPct >= 28) return 'red'
  if (lossPct >= 20) return 'amber'
  return ''
}

const LEVEL_COLOR: Record<Level, string> = {
  '': t['status-success'],
  amber: t['status-warning'],
  red: t['status-error'],
}
const LEVEL_BG: Record<Level, string> = {
  '': 'rgba(20,184,166,0.13)',
  amber: 'rgba(255,176,32,0.14)',
  red: 'rgba(209,67,67,0.16)',
}
const LEVEL_BORDER: Record<Level, string> = {
  '': 'rgba(20,184,166,0.35)',
  amber: 'rgba(255,176,32,0.4)',
  red: 'rgba(209,67,67,0.45)',
}

/** Static faithful re-render of the R2 StatusPill — auto-reg verdict pill. */
function StatusPillSpecimen({ lossPct, repCount }: { lossPct: number; repCount: number }) {
  const level = auraFor(lossPct, repCount)
  const color = LEVEL_COLOR[level]
  const text =
    level === 'red'
      ? `Stop · velocity loss ${Math.round(lossPct)}%`
      : level === 'amber'
        ? 'Threshold · VL20 reached'
        : 'Productive · in the band'
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        alignSelf: 'flex-start',
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 9,
        backgroundColor: LEVEL_BG[level],
        borderWidth: 1,
        borderColor: LEVEL_BORDER[level],
      }}
    >
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 13, fontWeight: '800', color }}>{text}</Text>
    </View>
  )
}

const meta: Meta<typeof StatusPillSpecimen> = {
  title: 'Lab/Candidates/R2Live/StatusPill',
  component: StatusPillSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Auto-regulation ' +
          'verdict pill — productive / threshold / stop — glowing dot + colored text, driven by ' +
          'velocity-loss %. No titan equivalent composite exists. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StatusPillSpecimen>

export const Productive: Story = { args: { lossPct: 8, repCount: 3 } }
export const Threshold: Story = { args: { lossPct: 21, repCount: 6 } }
export const Stop: Story = { args: { lossPct: 31, repCount: 8 } }
