import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DualGhostSpark } from './DualGhostSpark'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { buildMockModel } from './fatigue-mock'
import type { RepVelocityCurve } from './fatigue-model'

const PANEL_BG = primitiveColors.charcoal[800]
const PAGE_BG = primitiveColors.charcoal[900]
const t = getSemanticColors('dark')

const meta: Meta<typeof DualGhostSpark> = {
  title: 'Workout/Fatigue/Dual Ghost Spark',
  component: DualGhostSpark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Dual-Voltra ghost sparkline: ONE shared phase-coloured band with two mirrored blooms — the ' +
          'LEFT device grows UP, the RIGHT device is the SAME bloom flipped `orientation="down"`. Both ' +
          'wings share one time scale and one magnitude scale, so an L/R imbalance reads as bloom size ' +
          'rather than as two independently normalized charts.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DualGhostSpark>

const CURVES = buildMockModel(5).velocityCurves

/** A weaker device: the same reps at a fraction of the velocity (the imbalance under test). */
function weaken(curves: RepVelocityCurve[], factor: number): RepVelocityCurve[] {
  return curves.map((c) => ({
    ...c,
    samples: c.samples.map((s) => ({ ...s, velocityMps: s.velocityMps * factor })),
  }))
}

/** A device still mid-rep: its current rep's stream is cut short. */
function lagging(curves: RepVelocityCurve[], fraction: number): RepVelocityCurve[] {
  const cur = curves[curves.length - 1]
  const keep = Math.max(2, Math.round(cur.samples.length * fraction))
  const samples = cur.samples.slice(0, keep)
  const endMs = samples[samples.length - 1].tMs
  return [
    ...curves.slice(0, -1),
    {
      ...cur,
      samples,
      phaseSegments: cur.phaseSegments
        .filter((s) => s.startMs < endMs)
        .map((s) => ({ ...s, endMs: Math.min(s.endMs, endMs) })),
    },
  ]
}

const label = (s: string) => (
  <Text
    style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', color: t['text-tertiary'] }}
  >
    {s}
  </Text>
)

const panel = (caption: string, child: React.ReactNode) => (
  <View style={{ gap: 8, alignItems: 'flex-start' }}>
    {label(caption)}
    <View style={{ width: 400, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
      {child}
    </View>
  </View>
)

const page = (children: React.ReactNode) => (
  <View
    style={{
      backgroundColor: PAGE_BG,
      padding: 28,
      gap: 24,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    }}
  >
    {children}
  </View>
)

/** Both devices moving the same load the same way — the blooms mirror each other. */
export const Symmetric: Story = {
  render: () =>
    page(
      panel(
        'SYMMETRIC · MATCHED DEVICES',
        <DualGhostSpark left={CURVES} right={CURVES} width={360} height={232} />
      )
    ),
}

/** A real imbalance: the right device runs ~55% of the left's velocity. Because both wings
 *  share ONE magnitude scale, the lower bloom is visibly smaller instead of re-normalizing. */
export const AsymmetricLeftRight: Story = {
  render: () =>
    page(
      panel(
        'ASYMMETRIC · RIGHT AT ~55% VELOCITY',
        <DualGhostSpark
          left={CURVES}
          right={weaken(CURVES, 0.55)}
          width={360}
          height={232}
          leftLabel="LEFT ARM"
          rightLabel="RIGHT ARM"
        />
      )
    ),
}

/** One side lagging: the right device is still mid-rep, so its line stops short of the
 *  left's and the band goes idle where the two devices no longer share a phase. */
export const OneSideLagging: Story = {
  render: () =>
    page(
      panel(
        'LAGGING · RIGHT STILL MID-REP',
        <DualGhostSpark left={CURVES} right={lagging(CURVES, 0.6)} width={360} height={232} />
      )
    ),
}

/** No data on either device — a reserved empty box, no axis furniture. */
export const Empty: Story = {
  render: () =>
    page(
      <>
        {panel(
          'EMPTY · NO REPS ON EITHER DEVICE',
          <DualGhostSpark left={[]} right={[]} width={360} height={232} />
        )}
        {panel(
          'SINGLE-SIDED · ONLY THE LEFT DEVICE BOUND',
          <DualGhostSpark left={CURVES} right={[]} width={360} height={232} />
        )}
      </>
    ),
}
