// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'
import {
  ExerciseHeading,
  StatusPill,
  LiveAuraFrame,
  VelocityStrip,
  Metric,
  MetricGroup,
  TempoBar,
  FatigueMeter,
  Alert,
  AlertTitle,
  AlertDescription,
} from '../../components'
import { type DashboardModel, meanVelocity, verdictFromLoss } from './fixtures'

/**
 * Lab specimen — the LIVE (mid-set) stage of the North Star wall dashboard.
 *
 * Composes production primitives around the fixture read-model. The stage root is
 * wrapped in a {@link LiveAuraFrame} whose category tracks the velocity-loss verdict.
 * NOT a published component — lab-scoped composition only.
 */
export function LiveView({ model }: { model: DashboardModel }) {
  const { live, session } = model
  const verdict = verdictFromLoss(live.velocityLossPct)
  const meanCon = meanVelocity(live.repVelocities)

  return (
    // head verdict → full-surface aura flood (threshold amber for the mid-zone fixture).
    <LiveAuraFrame category={verdict} style={{ flex: 1, margin: 20 }}>
      <View style={{ flex: 1, padding: 28, gap: 24 }}>
        {/* head: exercise identity + load line, with the read-once verdict pill. */}
        <View className="flex-row items-start justify-between">
          <ExerciseHeading
            name={session.exerciseName}
            sets={session.plannedSets}
            reps={8}
            load={session.weightLbs}
            unit={session.unit}
            tempo={session.tempo}
            indicator="velocity-loss"
          />
          <StatusPill status={verdict} />
        </View>

        <View className="flex-row" style={{ flex: 1, gap: 28 }}>
          {/* left: the velocity hero. STUB: VelocityStrip — pending hero variant (Tier-C, Gate-1). */}
          <View style={{ flex: 3 }}>
            <Text
              className="text-text-tertiary"
              style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}
            >
              CONCENTRIC VELOCITY · THIS SET
            </Text>
            {/* STUB: VelocityStrip — pending hero variant (Tier-C, Gate-1) */}
            <VelocityStrip
              velocities={live.repVelocities}
              liveRepIndex={live.repVelocities.length - 1}
              height={240}
              scale="fixed"
            />
          </View>

          {/* right: the live metrics stack. */}
          <View style={{ flex: 2, gap: 20 }}>
            {/* primary numeral = MEAN concentric (not peak). */}
            <Metric
              value={meanCon.toFixed(2)}
              unit="m/s"
              label="MEAN CONCENTRIC"
              size="lg"
              trend="down"
            />

            {/* MetricGroup ×3 — the live telemetry rows. */}
            <MetricGroup>
              <Metric
                size="sm"
                value={live.lastRep.peakVelocity.toFixed(2)}
                unit="m/s"
                label="Peak vel"
              />
              <Metric size="sm" value={live.velocity.toFixed(2)} unit="m/s" label="Now" />
              <Metric size="sm" value={live.lastRep.rom.toFixed(2)} unit="m" label="ROM" />
            </MetricGroup>
            <MetricGroup>
              <Metric size="sm" value={String(live.force)} unit="N" label="Force" />
              <Metric size="sm" value={String(live.peakForce)} unit="N" label="Peak force" />
              <Metric size="sm" value={String(live.repVelocities.length)} label="Reps" />
            </MetricGroup>
            <MetricGroup>
              <Metric size="sm" value={`${live.velocityLossPct}%`} label="Vel loss" trend="down" />
              <Metric size="sm" value={String(session.weightLbs)} unit="lbs" label="Load" />
              <Metric size="sm" value={String(session.completedSets.length + 1)} label="Set" />
            </MetricGroup>

            {/* STUB: TempoBar — pending size='wall' (Tier-C, Gate-1) */}
            <View>
              <Text
                className="text-text-tertiary"
                style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}
              >
                TEMPO
              </Text>
              <TempoBar
                activePhase="concentric"
                phaseElapsedMs={700}
                completed={{ eccentric: 3100, hold: 900 }}
                target={{ eccentric: 3, hold: 1, concentric: 1 }}
              />
            </View>

            {/* FatigueMeter — base density (default track). */}
            <FatigueMeter value={live.velocityLossPct} />

            {/* STUB: Alert — pending CueFlag (Tier-C, Gate-1) */}
            <Alert status="warning" variant="subtle">
              <AlertTitle>Approaching threshold</AlertTitle>
              <AlertDescription>
                {`${live.velocityLossPct}% velocity loss — one or two reps left in the productive band.`}
              </AlertDescription>
            </Alert>
          </View>
        </View>
      </View>
    </LiveAuraFrame>
  )
}
