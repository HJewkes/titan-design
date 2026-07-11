// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/SetLog.tsx
// Rating:   High · titan equiv: partial (SetRow/SetTableHeader are compact rows
//           without an inline live chart, active-set card, or coaching-cue bar)
// Why:      The in-flow rep log: completed rows, a live active-set card with a
//           tempo phase bar + coaching cue, and dimmed planned rows.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

const row = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: 6,
  paddingHorizontal: 12,
  gap: 8,
}
const setLabel = { fontSize: 13, fontWeight: '600' as const, color: t['text-primary'], width: 44 }
const detail = { fontSize: 13, color: t['text-secondary'], flex: 1 }
const metric = { fontSize: 13, color: t['text-primary'] }
const rpeText = {
  fontSize: 12,
  color: t['text-secondary'],
  minWidth: 60,
  textAlign: 'right' as const,
}

function CompletedRow({
  n,
  reps,
  weight,
  vel,
  rpe,
}: {
  n: number
  reps: number
  weight: number
  vel: number
  rpe: number
}) {
  return (
    <View style={{ backgroundColor: t['surface-elevated'], borderRadius: 12, marginTop: 8 }}>
      <View style={row}>
        <Text style={setLabel}>Set {n}</Text>
        <Text style={detail}>
          {reps} reps · {weight} lbs
        </Text>
        <Text style={metric}>{vel.toFixed(2)} m/s</Text>
        <Text style={rpeText}>RPE {rpe.toFixed(1)}</Text>
      </View>
    </View>
  )
}

/** Simplified 3-segment tempo phase bar (Con/Hold/Ecc), no live tick. */
function TempoPhaseBar({
  activePhase,
  fillPct,
}: {
  activePhase: 'con' | 'hold' | 'ecc'
  fillPct: number
}) {
  const segments = [
    { key: 'con', label: 'Con', color: t['status-success'], flex: 2 },
    { key: 'hold', label: 'Hold', color: t['brand-primary'], flex: 1 },
    { key: 'ecc', label: 'Ecc', color: t['status-warning'], flex: 3 },
  ] as const
  const order = ['con', 'hold', 'ecc']
  const activeIdx = order.indexOf(activePhase)
  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {segments.map((s) => (
          <View key={s.key} style={{ flex: s.flex, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: t['text-disabled'] }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 2, height: 20 }}>
        {segments.map((s, i) => (
          <View
            key={s.key}
            style={{
              flex: s.flex,
              backgroundColor: alpha('#ffffff', 0.06),
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {i < activeIdx && (
              <View style={{ height: '100%', backgroundColor: alpha(s.color, 0.35) }} />
            )}
            {i === activeIdx && (
              <View
                style={{
                  height: '100%',
                  width: `${fillPct}%`,
                  backgroundColor: alpha(s.color, 0.4),
                }}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

function ActiveSetCard({
  n,
  reps,
  target,
  weight,
  rpe,
  rir,
  cue,
  phase,
}: {
  n: number
  reps: number
  target: number
  weight: number
  rpe: number
  rir: number
  cue: { text: string; color: string }
  phase: 'con' | 'hold' | 'ecc'
}) {
  return (
    <View
      style={{
        marginTop: 8,
        backgroundColor: t['surface-elevated'],
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: t['brand-primary'],
        padding: 12,
      }}
    >
      <View
        style={[
          row,
          {
            backgroundColor: alpha(t['brand-primary'], 0.06),
            borderRadius: 8,
            paddingHorizontal: 0,
          },
        ]}
      >
        <Text style={setLabel}>Set {n}</Text>
        <Text style={[detail, { color: t['brand-primary'] }]}>
          {reps}/{target} reps · {weight} lbs
        </Text>
        <Text style={[rpeText, { color: t['status-warning'] }]}>RPE {rpe.toFixed(1)}</Text>
        <Text style={rpeText}>RIR ~{rir}</Text>
      </View>
      <View style={{ paddingTop: 8 }}>
        <TempoPhaseBar activePhase={phase} fillPct={65} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cue.color }} />
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, fontWeight: '500', color: cue.color, flex: 1 }}
        >
          {cue.text}
        </Text>
      </View>
    </View>
  )
}

function PlannedRow({ n, reps, weight }: { n: number; reps: number; weight: number }) {
  return (
    <View
      style={{
        backgroundColor: t['surface-elevated'],
        borderRadius: 12,
        marginTop: 4,
        opacity: 0.5,
      }}
    >
      <View style={row}>
        <Text style={setLabel}>Set {n}</Text>
        <Text style={detail}>
          {reps} reps · {weight} lbs
        </Text>
      </View>
    </View>
  )
}

/** Static representative composition: 2 completed rows + 1 active card + 1 planned row. */
function SetLogSpecimen({
  activePhase,
  cue,
}: {
  activePhase: 'con' | 'hold' | 'ecc'
  cue: { text: string; color: string }
}) {
  return (
    <View style={{ width: 340 }}>
      <CompletedRow n={1} reps={10} weight={135} vel={0.61} rpe={6.5} />
      <CompletedRow n={2} reps={9} weight={135} vel={0.52} rpe={7.5} />
      <ActiveSetCard
        n={3}
        reps={5}
        target={8}
        weight={135}
        rpe={8.2}
        rir={2}
        cue={cue}
        phase={activePhase}
      />
      <PlannedRow n={4} reps={8} weight={135} />
    </View>
  )
}

const meta: Meta<typeof SetLogSpecimen> = {
  title: 'Lab/Candidates/Live/SetLog',
  component: SetLogSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). In-flow rep log: completed ' +
          'rows, a live active-set card (segmented tempo bar + coaching cue), and dimmed planned ' +
          'rows. titan only has compact `SetRow`/`SetTableHeader` — no live active-set card. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SetLogSpecimen>

export const GoodPaceCue: Story = {
  args: { activePhase: 'ecc', cue: { text: 'Good working pace', color: t['status-success'] } },
}
export const VelocityLossCue: Story = {
  args: {
    activePhase: 'con',
    cue: { text: 'High velocity loss — nearing limit', color: t['status-warning'] },
  },
}
export const SetupNoteCue: Story = {
  args: {
    activePhase: 'hold',
    cue: { text: 'Keep elbows tucked, full stretch at bottom', color: t['text-secondary'] },
  },
}
