import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DualGhostSpark } from './DualGhostSpark'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { buildMockModel, TARGET_TEMPO_SECONDS } from './fatigue-mock'
import { GRIND_THRESHOLD } from './fatigue-tokens'
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
          'rather than as two independently normalized charts. Each wing is tinted INDEPENDENTLY by its ' +
          'own current rep — silver while the rep stays controlled, warming through shades of red once ' +
          'that side crosses the grind threshold — so one arm can go red while the other stays silver.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DualGhostSpark>

/**
 * The HEALTHY baseline both stories start from: an early, controlled, on-tempo stretch of
 * the mock set (through rep 3), whose current rep sits well under `GRIND_THRESHOLD` and so
 * tints SILVER. The deep end of the mock set is already grinding, so starting there would
 * paint every story red regardless of what the story is trying to say.
 */
const HEALTHY = buildMockModel(2).velocityCurves

/**
 * A device that is GRINDING: its concentric collapses AND its grind signature crosses
 * `GRIND_THRESHOLD` — the signal `ghostLineColor` reads to warm the line silver → red.
 * Magnitude and tint move together because on the wall they have ONE cause: the rep is
 * failing. Degradation ramps across the set so the ghost fan shows the side fading, and
 * the current rep carries the full `grind`.
 *
 * @param grind the current rep's grindSignature. Below {@link GRIND_THRESHOLD} (0.35) the
 *   line stays silver; 1 is a full collapse and the deepest red.
 */
function grinding(curves: RepVelocityCurve[], grind: number): RepVelocityCurve[] {
  const last = Math.max(1, curves.length - 1)
  return curves.map((c, i) => {
    const g = grind * (i / last)
    return {
      ...c,
      // Only the concentric slows — a grind is a failure to move the load, not a slow lower.
      samples: c.samples.map((s) => ({
        ...s,
        velocityMps: s.phase === 'concentric' ? s.velocityMps * (1 - 0.6 * g) : s.velocityMps,
      })),
      grindSignature: Math.max(c.grindSignature, g),
      tempoDeviation: Math.max(c.tempoDeviation ?? 0, g),
    }
  })
}

/** A weaker but still CONTROLLED device: the same reps at a fraction of the velocity —
 *  a strength imbalance, not a collapse, so the tint signals stay untouched and silver. */
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

/** Both devices moving the same load the same way, both still in control — the blooms
 *  mirror each other and BOTH wings read silver. This is the healthy baseline. */
export const Symmetric: Story = {
  render: () =>
    page(
      panel(
        'SYMMETRIC · MATCHED DEVICES · BOTH SILVER',
        <DualGhostSpark
          left={HEALTHY}
          right={HEALTHY}
          width={360}
          height={232}
          targetTempoSeconds={TARGET_TEMPO_SECONDS}
        />
      )
    ),
}

/** The money shot: the LEFT arm holds its rep and stays SILVER while the RIGHT arm's
 *  concentric collapses — it crosses the grind threshold, so its wing warms into RED and,
 *  because both wings share ONE magnitude scale, shrinks at the same time. */
export const AsymmetricLeftRight: Story = {
  render: () =>
    page(
      panel(
        'ASYMMETRIC · LEFT SILVER · RIGHT GRINDING RED',
        <DualGhostSpark
          targetTempoSeconds={TARGET_TEMPO_SECONDS}
          left={HEALTHY}
          right={grinding(HEALTHY, 0.85)}
          width={360}
          height={232}
          leftLabel="LEFT ARM"
          rightLabel="RIGHT ARM"
        />
      )
    ),
}

/** A strength imbalance with control intact: the right device only reaches ~55% of the
 *  left's velocity, so its bloom is visibly smaller — but nothing is FAILING, so both
 *  wings stay silver. The contrast with {@link AsymmetricLeftRight} is the point: bloom
 *  size reads output, tint reads control, and they are independent readouts. */
export const AsymmetricControlled: Story = {
  render: () =>
    page(
      panel(
        'ASYMMETRIC · RIGHT AT ~55% VELOCITY · BOTH STILL SILVER',
        <DualGhostSpark
          targetTempoSeconds={TARGET_TEMPO_SECONDS}
          left={HEALTHY}
          right={weaken(HEALTHY, 0.55)}
          width={360}
          height={232}
          leftLabel="LEFT ARM"
          rightLabel="RIGHT ARM"
        />
      )
    ),
}

/** One side lagging: the right device is still mid-rep, so its line stops short of the
 *  left's and the band goes idle where the two devices no longer share a phase. Both sides
 *  are CONTROLLED, so both read silver — the only difference here is temporal. */
export const OneSideLagging: Story = {
  render: () =>
    page(
      panel(
        'LAGGING · RIGHT STILL MID-REP · BOTH CONTROLLED',
        <DualGhostSpark
          left={HEALTHY}
          right={lagging(HEALTHY, 0.6)}
          width={360}
          height={232}
          targetTempoSeconds={TARGET_TEMPO_SECONDS}
        />
      )
    ),
}

/** The tint ramp itself, one panel per step: the LEFT arm is held healthy as a silver
 *  reference while the RIGHT arm's grind signature is walked from controlled up to a full
 *  collapse. The first two steps sit BELOW `GRIND_THRESHOLD` and stay silver (dimming a
 *  touch as tempo drifts); every step at or above it is a shade of red. */
export const TintRange: Story = {
  render: () =>
    page(
      <>
        {[0, 0.2, GRIND_THRESHOLD, 0.55, 0.8, 1].map((grind) => (
          <View key={grind}>
            {panel(
              `RIGHT GRIND ${grind.toFixed(2)} · ${grind < GRIND_THRESHOLD ? 'CONTROLLED · SILVER' : 'GRINDING · RED'}`,
              <DualGhostSpark
                targetTempoSeconds={TARGET_TEMPO_SECONDS}
                left={HEALTHY}
                right={grinding(HEALTHY, grind)}
                width={360}
                height={232}
                leftLabel="LEFT · HEALTHY"
                rightLabel={`RIGHT · GRIND ${grind.toFixed(2)}`}
              />
            )}
          </View>
        ))}
      </>
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
          <DualGhostSpark
            left={HEALTHY}
            right={[]}
            width={360}
            height={232}
            targetTempoSeconds={TARGET_TEMPO_SECONDS}
          />
        )}
      </>
    ),
}
