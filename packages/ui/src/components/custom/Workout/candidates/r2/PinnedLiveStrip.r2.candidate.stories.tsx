// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). The real
// `VelocityStrip` mini variant is stood in with a simplified bar row to keep
// this specimen self-contained — this shows the LOOK only.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/strip.tsx + r2.css `.r2-strip`
// Rating:   High · titan equiv: none as a composite; it wraps the real `VelocityStrip` (mini) +
//           `Metric` in a sticky top bar, a shell titan does not have
// Why:      Keeps the live set visible whenever the operator walks away from the Live view —
//           the "persistent live strip bridges passive and interactive" mechanism, traced
//           directly to fable Direction D's glance-overlay brief (the strip that survives
//           behind any drill/overlay).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function miniBarColor(v: number): string {
  if (v >= 0.75) return '#2ed573'
  if (v >= 0.5) return '#ffd43b'
  if (v >= 0.3) return '#ffa502'
  return '#ff4757'
}

/** Static faithful re-render of the R2 PinnedLiveStrip — sticky live/rest keeper bar. */
function PinnedLiveStripSpecimen({
  reps,
  targetReps,
  exerciseName,
  setLabel,
  resting,
  restLabel,
}: {
  reps: number[]
  targetReps: number
  exerciseName: string
  setLabel: string
  resting: boolean
  restLabel: string
}) {
  const mean = reps.length ? reps.reduce((a, b) => a + b, 0) / reps.length : 0
  return (
    <View
      style={{
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 14,
        backgroundColor: t['surface-elevated'],
        borderBottomWidth: 1,
        borderBottomColor: t['border-strong'],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t['status-success'] }}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            textTransform: 'uppercase',
            color: t['status-success'],
          }}
        >
          {resting ? 'Resting' : 'Live'}
        </Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: t['text-primary'] }}>
        {exerciseName} · {setLabel}
      </Text>
      {resting ? (
        <Text
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 15,
            fontWeight: '800',
            color: t['brand-primary'],
          }}
        >
          {restLabel}
        </Text>
      ) : (
        <>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: t['text-primary'] }}>
              {reps.length}/{targetReps}
            </Text>
            <Text style={{ fontSize: 8, color: t['text-tertiary'] }}>Rep</Text>
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: t['text-primary'] }}>
              {mean.toFixed(2)} m/s
            </Text>
            <Text style={{ fontSize: 8, color: t['text-tertiary'] }}>Mean con</Text>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: 120, height: 22 }}
          >
            {reps.map((v, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(4, v * 24),
                  backgroundColor: miniBarColor(v),
                  borderRadius: 1,
                }}
              />
            ))}
          </View>
        </>
      )}
      <Pressable style={{ marginLeft: 'auto' }} onPress={() => {}}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: t['brand-primary'] }}>
          return to Live ▸
        </Text>
      </Pressable>
    </View>
  )
}

const meta: Meta<typeof PinnedLiveStripSpecimen> = {
  title: 'Lab/Candidates/R2Live/PinnedLiveStrip',
  component: PinnedLiveStripSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Sticky top bar ' +
          'that pins the running set whenever the operator navigates away from Live — composes ' +
          'the real `VelocityStrip` mini + `Metric` in-app. No titan shell equivalent. ' +
          'Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PinnedLiveStripSpecimen>

export const LiveMidSet: Story = {
  args: {
    reps: [0.61, 0.58, 0.52],
    targetReps: 8,
    exerciseName: 'Cable Row',
    setLabel: 'Set 4/5',
    resting: false,
    restLabel: '',
  },
}
export const RestingBetweenSets: Story = {
  args: {
    reps: [],
    targetReps: 8,
    exerciseName: 'Cable Row',
    setLabel: 'Set 4/5',
    resting: true,
    restLabel: '1:42',
  },
}
