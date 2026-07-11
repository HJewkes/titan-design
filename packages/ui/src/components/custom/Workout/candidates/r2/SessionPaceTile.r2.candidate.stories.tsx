// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). The toggle
// interaction and the real `CapacityBandChart` reveal animation are stripped
// (a simplified static mini-chart stands in) — this shows the LOOK only.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/pace.tsx + r2.css `.r2-pace`
// Rating:   Medium · titan equiv: real `SessionHeader`'s chunked pace bar (Shell/SessionRail) —
//           R2's tile is a MOCK derivation (no workout-analytics support yet, per component-audit
//           §4.1) bundling volume/load/fatigue + a trim/add suggestion + a capacity trend, where
//           SessionHeader carries a slimmer live glance
// Why:      Session budget readout (elapsed/of-budget, progress bar) + a mocked ahead/behind
//           trim-or-add suggestion + a capacity trend chart — every number here is a stand-in,
//           not derived, and is labeled as such in the source.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Static faithful re-render of the R2 SessionPaceTile — mock session-budget readout. */
function SessionPaceTileSpecimen({
  elapsedSec,
  budgetSec,
  ahead,
  volumePct,
  loadLbs,
}: {
  elapsedSec: number
  budgetSec: number
  ahead: boolean
  volumePct: number
  loadLbs: number
}) {
  const pct = Math.min(100, (elapsedSec / budgetSec) * 100)
  const fillColor = ahead ? t['status-success'] : t['status-warning']
  return (
    <View
      style={{ width: 260, padding: 12, backgroundColor: t['surface-elevated'], borderRadius: 8 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text
          style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: t['brand-primary'] }}
        >
          SESSION PACE
        </Text>
        <Pressable onPress={() => {}}>
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'ui-monospace, monospace',
              color: t['text-tertiary'],
            }}
          >
            {ahead ? 'show behind ▸' : 'show ahead ▸'}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={{ fontSize: 19, fontWeight: '800', color: t['text-primary'] }}>
          {mmss(elapsedSec)}
        </Text>
        <Text style={{ fontSize: 10, color: t['text-secondary'] }}>
          of {mmss(budgetSec)} budget
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: t['background-base'],
          marginVertical: 8,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: fillColor }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        {[
          { label: 'Volume', value: `${volumePct}%` },
          { label: 'Load', value: `${(loadLbs / 1000).toFixed(1)}k` },
          { label: 'Fatigue', value: 'MOD' },
        ].map((m) => (
          <View key={m.label}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: t['text-primary'] }}>
              {m.value}
            </Text>
            <Text style={{ fontSize: 8, color: t['text-tertiary'] }}>{m.label}</Text>
          </View>
        ))}
      </View>
      <Text
        style={{
          fontSize: 10,
          lineHeight: 14,
          borderRadius: 8,
          padding: 8,
          color: fillColor,
          backgroundColor: ahead ? 'rgba(20,184,166,0.1)' : 'rgba(255,176,32,0.12)',
          borderWidth: 1,
          borderColor: ahead ? 'rgba(20,184,166,0.3)' : 'rgba(255,176,32,0.35)',
        }}
      >
        {ahead
          ? '＋ Ahead of pace — ~7 min headroom. Room to add a Cable Fly drop-set.'
          : '▲ Behind pace — ~9 min over budget at this rate. Drop Face Pull to 2 sets to finish on time.'}
      </Text>
    </View>
  )
}

const meta: Meta<typeof SessionPaceTileSpecimen> = {
  title: 'Lab/Candidates/R2Live/SessionPaceTile',
  component: SessionPaceTileSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Mock ' +
          'session-budget readout — elapsed/budget, volume/load/fatigue tiles, and a ' +
          'trim-or-add pacing suggestion. Every number is a stand-in (no workout-analytics ' +
          'derivation exists yet). Compare against the real `SessionHeader` pace glance. ' +
          'Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SessionPaceTileSpecimen>

export const AheadOfPace: Story = {
  args: { elapsedSec: 1450, budgetSec: 3120, ahead: true, volumePct: 62, loadLbs: 8400 },
}
export const BehindPace: Story = {
  args: { elapsedSec: 2380, budgetSec: 3120, ahead: false, volumePct: 71, loadLbs: 11200 },
}
