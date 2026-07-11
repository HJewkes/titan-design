// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). This isolates
// R2's NET-NEW rail chrome only — the rail's item list itself is the REAL
// titan `ExerciseCard` (already in Storybook, not re-ported here). Shows the
// LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/rail.tsx (SessionRail head + live-pending row)
//           + r2.css `.r2-rail-head`, `.r2-rail-pending`
// Rating:   Medium · titan equiv: real titan `SessionRail` organism (Shell/SessionRail) — R2's
//           header adds a live/review context dot + set-count meta that `SessionRail`'s
//           `SessionHeader` does not carry in this exact shape
// Why:      Context bar (live-dot + "Live session"/"Reviewing" + set meta) that frames the
//           rail's real `ExerciseCard` list, plus the live pending-set row (`PlaceholderStrip`
//           segments + "N/M reps" label) shown only on the in-flight exercise.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** Static faithful re-render of R2's SessionRail header + live-pending-set row. */
function SessionRailHeaderSpecimen({
  context,
  title,
  meta,
  pendingReps,
  targetReps,
}: {
  context: 'live' | 'review'
  title: string
  meta: string
  pendingReps: number | null
  targetReps: number
}) {
  return (
    <View
      style={{
        width: 296,
        backgroundColor: t['background-subtle'],
        borderWidth: 1,
        borderColor: t['border-default'],
        borderRadius: 8,
      }}
    >
      <View
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: t['border-default'],
          gap: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: context === 'review' ? t['status-info'] : t['status-success'],
            }}
          />
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: t['text-tertiary'],
            }}
          >
            {context === 'review' ? 'Reviewing · session Mar 11' : 'Live session'}
          </Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '800', color: t['text-primary'] }}>{title}</Text>
        <Text
          style={{
            fontSize: 10,
            fontFamily: 'ui-monospace, monospace',
            color: t['text-secondary'],
          }}
        >
          {meta}
        </Text>
      </View>
      {pendingReps != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: targetReps }, (_, i) => (
              <View
                key={i}
                style={{
                  width: 10,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i < pendingReps ? t['brand-primary'] : t['border-strong'],
                }}
              />
            ))}
          </View>
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              color: t['brand-primary'],
            }}
          >
            set live · {pendingReps}/{targetReps} reps
          </Text>
        </View>
      )}
    </View>
  )
}

const meta: Meta<typeof SessionRailHeaderSpecimen> = {
  title: 'Lab/Candidates/R2Live/SessionRailHeader',
  component: SessionRailHeaderSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          "**Candidate visual specimen** (R2 dashboard harness → titan review). The rail's " +
          'context bar (live/review dot + set meta) and the live pending-set segmented row — the ' +
          'NET-NEW chrome that frames the real titan `ExerciseCard` list. Compare against the ' +
          'real `SessionRail` organism. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SessionRailHeaderSpecimen>

export const LiveWithPendingSet: Story = {
  args: {
    context: 'live',
    title: 'Pull A · Intensification',
    meta: 'set 4 live',
    pendingReps: 3,
    targetReps: 8,
  },
}
export const Reviewing: Story = {
  args: {
    context: 'review',
    title: 'Pull A · Intensification',
    meta: '22 sets · 48 min · complete',
    pendingReps: null,
    targetReps: 8,
  },
}
