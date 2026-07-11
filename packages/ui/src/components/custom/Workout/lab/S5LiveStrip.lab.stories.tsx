// LAB EXPLORATION — do not consume in app surfaces.
//
// Candidate design directions for shell unit S5 (pinned Live strip): the
// off-Live anchor that live-updates rep/mean while the operator is on another
// view, plus a "return to Live" affordance. Net-new — no mobile source (R2
// harness `strip.tsx` seeded the concept: real VelocityStrip `mini` + Metric);
// this specimen composes the S1–S3 shell visual language locally (charcoal
// surfaces, brand-orange accent, mono micro-labels). Static: velocity bars and
// the "LIVE" dot are drawn in a fixed still state, no live-tick/reanimated wiring.
//
// Spec:    coordination/design-explorations/DASHBOARD-DECOMPOSITION.md (S5 row)
// Rating:  Exploration · titan equiv: none (first pinned-anchor primitive)
// Why:     Two open questions: WHERE it pins (top band vs a floating bottom
//          capsule) and how much it shows (compact rep/mean vs expanded with
//          loss% + taller bars). Static specimen.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** Same 4-band velocity scale as VelocityStrip's default path, via titan tokens. */
function velocityColor(v: number): string {
  if (v >= 1.0) return t['status-live']
  if (v >= 0.75) return t['status-warning']
  if (v >= 0.5) return t['brand-primary']
  return t['status-error']
}

/** A VelocityStrip-`mini`-style bar row: per-rep bars, height ∝ velocity. */
function MiniVelocityBars({ velocities, height = 16 }: { velocities: number[]; height?: number }) {
  const max = Math.max(...velocities, 1)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height }}>
      {velocities.map((v, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: Math.max(3, (v / max) * height),
            borderRadius: 1,
            backgroundColor: velocityColor(v),
          }}
        />
      ))}
    </View>
  )
}

/** A `Metric`-style stat: value(+unit) over an uppercase micro-label. */
function MiniMetric({
  value,
  label,
  unit,
  size = 'sm',
}: {
  value: string
  label: string
  unit?: string
  size?: 'sm' | 'md'
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text
          style={{ fontSize: size === 'md' ? 18 : 14, fontWeight: '700', color: t['text-primary'] }}
        >
          {value}
        </Text>
        {unit ? <Text style={{ fontSize: 9, color: t['text-tertiary'] }}>{unit}</Text> : null}
      </View>
      <Text
        style={{
          fontSize: 8,
          fontWeight: '700',
          color: t['text-tertiary'],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

function LiveDot({ resting }: { resting?: boolean }) {
  const color = resting ? t['status-warning'] : t['status-live']
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.6 }}>
        {resting ? 'REST' : 'LIVE'}
      </Text>
    </View>
  )
}

/** Content placeholder rows behind the floating capsule, so it reads as "pinned over the view". */
function ContentBackdrop() {
  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 16, gap: 10 }}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ height: 48, borderRadius: 10, backgroundColor: t['surface-raised'] }}
        />
      ))}
    </View>
  )
}

/** Static faithful re-render of an S5 pinned-strip direction. */
function LiveStripSpecimen({
  stageWidth,
  pin,
  density,
  exerciseName,
  setLabel,
  reps,
  targetReps,
  meanVelocity,
  lossPct,
  resting,
  restLabel,
}: {
  stageWidth: number
  pin: 'top' | 'bottom-floating'
  density: 'compact' | 'expanded'
  exerciseName: string
  setLabel: string
  reps: number[]
  targetReps: number
  meanVelocity: number
  lossPct?: number
  resting?: boolean
  restLabel?: string
}) {
  const barHeight = density === 'expanded' ? 28 : 16
  const metricSize = density === 'expanded' ? 'md' : 'sm'

  const content = resting ? (
    <Text style={{ fontSize: 12, fontWeight: '600', color: t['status-warning'] }}>{restLabel}</Text>
  ) : (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: density === 'expanded' ? 18 : 12 }}
    >
      <MiniMetric value={`${reps.length}/${targetReps}`} label="Rep" size={metricSize} />
      <MiniMetric value={meanVelocity.toFixed(2)} unit="m/s" label="Mean con" size={metricSize} />
      {density === 'expanded' && lossPct != null ? (
        <MiniMetric value={`${lossPct}%`} label="Loss" size="md" />
      ) : null}
      <MiniVelocityBars velocities={reps} height={barHeight} />
    </View>
  )

  const returnButton = (
    <Pressable
      onPress={() => {}}
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: t['brand-primary'],
        paddingVertical: 6,
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: t['brand-primary'] }}>
        Return to Live ›
      </Text>
    </Pressable>
  )

  if (pin === 'bottom-floating') {
    return (
      <View
        style={{
          width: stageWidth,
          height: 260,
          position: 'relative',
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: t['surface-base'],
        }}
      >
        <ContentBackdrop />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              backgroundColor: t['surface-elevated'],
              borderWidth: 1,
              borderColor: t['border-prominent'],
              paddingVertical: 8,
              paddingHorizontal: 14,
              shadowColor: '#000',
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <LiveDot resting={resting} />
            {content}
            {returnButton}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        width: stageWidth,
        height: density === 'expanded' ? 56 : 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        backgroundColor: t['surface-elevated'],
        borderBottomWidth: 1,
        borderBottomColor: t['border-prominent'],
      }}
    >
      <LiveDot resting={resting} />
      <View style={{ flexShrink: 1 }}>
        <Text
          style={{ fontSize: 12, fontWeight: '600', color: t['text-primary'] }}
          numberOfLines={1}
        >
          {exerciseName}
        </Text>
        <Text style={{ fontSize: 10, color: t['text-tertiary'] }}>{setLabel}</Text>
      </View>
      <View style={{ flex: 1 }} />
      {content}
      {returnButton}
    </View>
  )
}

const meta: Meta<typeof LiveStripSpecimen> = {
  title: 'Lab/Explorations/S5-LiveStrip',
  component: LiveStripSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Lab exploration** — candidate directions for shell unit S5 (pinned Live strip): the ' +
          'off-Live anchor that live-updates rep/mean, composing a VelocityStrip-`mini`-style bar row ' +
          '+ Metric-style stats + a "return to Live" affordance. Three directions vary pin location ' +
          '(top band vs floating bottom capsule) and density (compact vs expanded). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LiveStripSpecimen>

/** Top-pinned, compact — mirrors the R2 harness strip: dot · name/set · rep/mean · mini bars · return. */
export const TopStripCompact: Story = {
  args: {
    stageWidth: 900,
    pin: 'top',
    density: 'compact',
    exerciseName: 'Cable Row',
    setLabel: 'Set 2 of 3 · 140 lb',
    reps: [1.12, 1.05, 0.98, 0.89, 0.81],
    targetReps: 8,
    meanVelocity: 0.97,
    resting: false,
  },
}

/** Top-pinned, expanded — taller bars + loss% for more density, and the resting sub-state. */
export const TopStripExpandedResting: Story = {
  args: {
    stageWidth: 900,
    pin: 'top',
    density: 'expanded',
    exerciseName: 'Cable Row',
    setLabel: 'Set 2 of 3 · 140 lb',
    reps: [1.12, 1.05, 0.98, 0.89, 0.81],
    targetReps: 8,
    meanVelocity: 0.97,
    lossPct: 28,
    resting: true,
    restLabel: '0:42 rest · next: Lat Pulldown',
  },
}

/** Floating bottom capsule — thumb-reachable on a touch surface, pinned over content. */
export const FloatingReturnCapsule: Story = {
  args: {
    stageWidth: 420,
    pin: 'bottom-floating',
    density: 'compact',
    exerciseName: 'Cable Row',
    setLabel: 'Set 2 of 3',
    reps: [1.12, 1.05, 0.98, 0.89],
    targetReps: 8,
    meanVelocity: 1.01,
    resting: false,
  },
}
