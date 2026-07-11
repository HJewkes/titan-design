// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/RepHistoryTable.tsx
// Rating:   High · titan equiv: none (no compact inline-phase rep table)
// Why:      Rep-by-rep breakdown with eccentric/pause/concentric tempo string
//           and inline phase colors, latest row tinted. titan has no rep table.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface RepRow {
  repNumber: number
  eccDuration: number
  topPause: number
  conDuration: number
  bottomPause: number
  velocity: number
  force: number
}

/** Static faithful re-render of the mobile RepHistoryTable (precomputed durations, no live data). */
function RepHistoryTableSpecimen({ reps }: { reps: RepRow[] }) {
  if (reps.length === 0) return null

  return (
    <View style={{ width: 320 }}>
      <View
        style={{
          marginBottom: 8,
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: t['border-subtle'],
          paddingBottom: 12,
        }}
      >
        <Text style={{ width: 24, fontSize: 12, fontWeight: '500', color: t['text-disabled'] }}>
          #
        </Text>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: t['text-disabled'] }}>
          Tempo
        </Text>
        <Text
          style={{
            width: 56,
            textAlign: 'right',
            fontSize: 12,
            fontWeight: '500',
            color: t['text-disabled'],
          }}
        >
          Vel
        </Text>
        <Text
          style={{
            width: 56,
            textAlign: 'right',
            fontSize: 12,
            fontWeight: '500',
            color: t['text-disabled'],
          }}
        >
          Force
        </Text>
      </View>

      {reps.map((rep, index) => {
        const isLatest = index === reps.length - 1
        const tempo = `${rep.eccDuration.toFixed(1)}-${rep.topPause.toFixed(1)}-${rep.conDuration.toFixed(1)}-${rep.bottomPause.toFixed(1)}`
        return (
          <View
            key={rep.repNumber}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: index < reps.length - 1 ? 1 : 0,
                borderBottomColor: alpha(t['border-subtle'], 0.5),
              },
              isLatest
                ? {
                    backgroundColor: alpha(t['brand-primary-dark'], 0.08),
                    marginHorizontal: -12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderBottomWidth: 0,
                  }
                : null,
            ]}
          >
            <Text
              style={{
                width: 24,
                fontWeight: '700',
                color: isLatest ? t['brand-primary'] : t['text-secondary'],
              }}
            >
              {rep.repNumber}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 13, color: t['text-primary'] }}>
                {tempo}
              </Text>
              <View style={{ marginTop: 4, flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 11, color: t['status-info'] }}>
                  E:{rep.eccDuration.toFixed(1)}
                </Text>
                {rep.topPause > 0.1 && (
                  <Text style={{ fontSize: 11, color: t['status-warning'] }}>
                    P:{rep.topPause.toFixed(1)}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: t['status-success'] }}>
                  C:{rep.conDuration.toFixed(1)}
                </Text>
              </View>
            </View>
            <Text
              style={{
                width: 56,
                textAlign: 'right',
                fontWeight: '700',
                color: isLatest ? t['brand-primary'] : t['text-primary'],
              }}
            >
              {rep.velocity.toFixed(2)}
            </Text>
            <Text style={{ width: 56, textAlign: 'right', color: t['text-secondary'] }}>
              {rep.force.toFixed(0)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const meta: Meta<typeof RepHistoryTableSpecimen> = {
  title: 'Lab/Candidates/Live/RepHistoryTable',
  component: RepHistoryTableSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Compact rep-by-rep breakdown — ' +
          'monospace tempo string with inline eccentric/pause/concentric phase colors, and the ' +
          'latest rep tinted. titan has no equivalent compact rep table. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RepHistoryTableSpecimen>

export const SetInProgress: Story = {
  args: {
    reps: [
      {
        repNumber: 1,
        eccDuration: 1.2,
        topPause: 0.0,
        conDuration: 0.8,
        bottomPause: 0.0,
        velocity: 0.78,
        force: 412,
      },
      {
        repNumber: 2,
        eccDuration: 1.3,
        topPause: 0.0,
        conDuration: 0.9,
        bottomPause: 0.0,
        velocity: 0.71,
        force: 405,
      },
      {
        repNumber: 3,
        eccDuration: 1.4,
        topPause: 0.2,
        conDuration: 1.0,
        bottomPause: 0.0,
        velocity: 0.63,
        force: 398,
      },
      {
        repNumber: 4,
        eccDuration: 1.5,
        topPause: 0.3,
        conDuration: 1.1,
        bottomPause: 0.0,
        velocity: 0.55,
        force: 390,
      },
      {
        repNumber: 5,
        eccDuration: 1.6,
        topPause: 0.4,
        conDuration: 1.3,
        bottomPause: 0.0,
        velocity: 0.44,
        force: 381,
      },
    ],
  },
}

export const FullSetWithPauses: Story = {
  args: {
    reps: [
      {
        repNumber: 1,
        eccDuration: 1.1,
        topPause: 0.5,
        conDuration: 0.7,
        bottomPause: 0.2,
        velocity: 0.92,
        force: 520,
      },
      {
        repNumber: 2,
        eccDuration: 1.1,
        topPause: 0.6,
        conDuration: 0.7,
        bottomPause: 0.2,
        velocity: 0.88,
        force: 515,
      },
      {
        repNumber: 3,
        eccDuration: 1.2,
        topPause: 0.5,
        conDuration: 0.8,
        bottomPause: 0.1,
        velocity: 0.85,
        force: 508,
      },
      {
        repNumber: 4,
        eccDuration: 1.2,
        topPause: 0.7,
        conDuration: 0.8,
        bottomPause: 0.1,
        velocity: 0.79,
        force: 500,
      },
      {
        repNumber: 5,
        eccDuration: 1.3,
        topPause: 0.6,
        conDuration: 0.9,
        bottomPause: 0.0,
        velocity: 0.74,
        force: 492,
      },
      {
        repNumber: 6,
        eccDuration: 1.4,
        topPause: 0.8,
        conDuration: 1.0,
        bottomPause: 0.0,
        velocity: 0.66,
        force: 485,
      },
    ],
  },
}

export const EarlySet: Story = {
  args: {
    reps: [
      {
        repNumber: 1,
        eccDuration: 0.9,
        topPause: 0.0,
        conDuration: 0.6,
        bottomPause: 0.0,
        velocity: 1.05,
        force: 210,
      },
      {
        repNumber: 2,
        eccDuration: 1.0,
        topPause: 0.0,
        conDuration: 0.6,
        bottomPause: 0.0,
        velocity: 1.01,
        force: 208,
      },
    ],
  },
}
