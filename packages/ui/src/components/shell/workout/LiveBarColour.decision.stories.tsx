import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Typography } from '../../custom/Typography'
import { LiveAuraFrame } from '../../custom/Workout/LiveAuraFrame'
import {
  VelocityStrip,
  calculateVelocityLoss,
  type VelocityLossThresholds,
  type VelocityZoneBandProp,
} from '../../custom/Workout/VelocityStrip'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import type { LiveStripBarColor, LiveStripRep, LiveStripZone } from './liveStripModel'

/** workout-analytics' default compound bands, the ones the strip's zone ids come from. */
const ZONE_BANDS: VelocityZoneBandProp[] = [
  { id: 'grinding', label: 'Grinding', min: 0, max: 0.35 },
  { id: 'maximalStrength', label: 'Max Strength', min: 0.35, max: 0.5 },
  { id: 'strengthSpeed', label: 'Strength-Speed', min: 0.5, max: 0.75 },
  { id: 'power', label: 'Power', min: 0.75, max: 1.0 },
  { id: 'speed', label: 'Speed', min: 1.0, max: null },
]

const zoneOf = (velocity: number): LiveStripZone =>
  ZONE_BANDS.find((b) => b.max === null || velocity < b.max)!.id as LiveStripZone

interface IntentSet {
  intent: string
  exerciseName: string
  loadLabel: string
  /** The loss (%) at which this intent's set is at "stop". */
  stopPct: number
  targetReps: number
  velocities: number[]
}

const SETS: IntentSet[] = [
  {
    intent: 'Strength',
    exerciseName: 'Cable Chest Press',
    loadLabel: '140 lb',
    stopPct: 20,
    targetReps: 8,
    velocities: [0.52, 0.51, 0.49, 0.46, 0.43, 0.4],
  },
  {
    intent: 'Power',
    exerciseName: 'Cable Push Press',
    loadLabel: '90 lb',
    stopPct: 10,
    targetReps: 6,
    velocities: [0.95, 0.94, 0.91, 0.88, 0.84],
  },
  {
    intent: 'Hypertrophy',
    exerciseName: 'Cable Row',
    loadLabel: '110 lb',
    stopPct: 30,
    targetReps: 10,
    velocities: [0.62, 0.61, 0.58, 0.55, 0.51, 0.47, 0.44, 0.42],
  },
]

type Treatment = 'today' | 'stripFollowsHero' | 'intent' | 'heroFollowsStrip' | 'auraSteps'

interface Colouring {
  barColor: LiveStripBarColor
  thresholds?: VelocityLossThresholds
}

interface TreatmentSpec {
  rule: string
  strip: (stopPct: number) => Colouring
  hero: (stopPct: number) => Colouring
}

const LOSS_10_20_30: Colouring = { barColor: 'loss' }
const ZONES: Colouring = { barColor: 'zone' }

const intentThirds = (stop: number): Colouring => ({
  barColor: 'loss',
  thresholds: [stop / 3, (stop * 2) / 3, stop],
})

// Two steps land on the stop, so orange never shows: green, yellow from half the stop, red at it.
const auraSteps = (stop: number): Colouring => ({
  barColor: 'loss',
  thresholds: [stop / 2, stop, stop],
})

const TREATMENTS: Record<Treatment, TreatmentSpec> = {
  today: {
    rule: 'v0 today. Strip: absolute zone per rep (0.35 / 0.5 / 0.75 / 1.0 m/s). Hero: loss from the set best, 10 / 20 / 30 %.',
    strip: () => ZONES,
    hero: () => LOSS_10_20_30,
  },
  stripFollowsHero: {
    rule: 'v1 strip follows the hero. Both: loss from the set best, fixed 10 / 20 / 30 %.',
    strip: () => LOSS_10_20_30,
    hero: () => LOSS_10_20_30,
  },
  intent: {
    rule: 'v2 both follow the intent threshold. Both: loss from the set best; green under a third of the stop, yellow under two thirds, orange under the stop, red from it.',
    strip: intentThirds,
    hero: intentThirds,
  },
  heroFollowsStrip: {
    rule: 'v3 hero follows the strip. Both: absolute zone per rep (0.35 / 0.5 / 0.75 / 1.0 m/s).',
    strip: () => ZONES,
    hero: () => ZONES,
  },
  auraSteps: {
    rule: "v4 (implementer's idea) three steps, like the aura. Both: loss from the set best; green under half the stop, yellow to the stop, red from it. No orange.",
    strip: auraSteps,
    hero: auraSteps,
  },
}

function IntentFrame({ set, spec }: { set: IntentSet; spec: TreatmentSpec }) {
  const loss = calculateVelocityLoss(set.velocities)
  const isStop = loss >= set.stopPct
  const reps: LiveStripRep[] = set.velocities.map((velocity) => ({
    velocity,
    zone: zoneOf(velocity),
  }))
  const strip = spec.strip(set.stopPct)
  const hero = spec.hero(set.stopPct)
  return (
    <View className="gap-stack-md" testID={`intent-${set.intent.toLowerCase()}`}>
      <Typography variant="overline" color="secondary">
        {`${set.intent} · stop at ${set.stopPct}% loss · this set ${loss}% · ${isStop ? 'stop' : 'productive'}`}
      </Typography>
      <PinnedLiveStrip
        state="set"
        exerciseName={set.exerciseName}
        loadLabel={set.loadLabel}
        setNumber={2}
        setCount={3}
        reps={reps}
        targetReps={set.targetReps}
        isFatigued={isStop}
        barColor={strip.barColor}
        lossThresholds={strip.thresholds}
      />
      <LiveAuraFrame category={isStop ? 'stop' : 'productive'} pulse={false}>
        <View className="p-inset-md">
          <VelocityStrip
            variant="hero"
            velocities={set.velocities}
            targetReps={set.targetReps}
            liveRepIndex={set.velocities.length - 1}
            height={180}
            barColor={hero.barColor}
            lossThresholds={hero.thresholds}
            zones={hero.barColor === 'zone' ? ZONE_BANDS : undefined}
          />
        </View>
      </LiveAuraFrame>
    </View>
  )
}

interface DecisionArgs {
  treatment: Treatment
}

/**
 * VW-429 colour round 1: the pinned strip ABOVE the live hero bar row for the same set, three
 * intents per treatment. Every set ends at or past its intent's stop threshold, so the strip's edge
 * and the hero's aura are red; the question is what colour the bars should be.
 * Canvas width drives the strip layout (below 640px it stacks), so shoot at 1920 and 360. Dark only.
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Live Bar Colour',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    treatment: { control: 'select', options: Object.keys(TREATMENTS) },
  },
  render: ({ treatment }) => {
    const spec = TREATMENTS[treatment]
    return (
      <View className="gap-section-md bg-background-base p-gutter-sm" testID="live-bar-colour">
        <Typography variant="body1">{spec.rule}</Typography>
        {SETS.map((set) => (
          <IntentFrame key={set.intent} set={set} spec={spec} />
        ))}
      </View>
    )
  },
}
export default meta

type Story = StoryObj<DecisionArgs>

/** v0: hero by loss 10/20/30, strip by absolute zone. */
export const V0Today: Story = { args: { treatment: 'today' } }

/** v1: the strip adopts the hero's loss 10/20/30 colouring. */
export const V1StripFollowsHero: Story = { args: { treatment: 'stripFollowsHero' } }

/** v2: both colour by loss with bands scaled to the intent's stop threshold. */
export const V2IntentThreshold: Story = { args: { treatment: 'intent' } }

/** v3: both colour by absolute zone. */
export const V3HeroFollowsStrip: Story = { args: { treatment: 'heroFollowsStrip' } }

/** v4 (implementer's idea): three loss steps keyed to the stop, mirroring the aura's three categories. */
export const V4AuraSteps: Story = { args: { treatment: 'auraSteps' } }
