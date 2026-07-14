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
} from '../../components'
import { type DashboardModel, meanVelocity, verdictFromLoss } from './fixtures'

/** Which Voltra this layer renders, in a dual-mode (bilateral) exercise. */
export type LiveSide = 'left' | 'right'

const SIDE_META: Record<LiveSide, { label: string; glyph: string }> = {
  left: { label: 'LEFT VOLTRA', glyph: '◧' },
  right: { label: 'RIGHT VOLTRA', glyph: '◨' },
}

/** The per-voltra badge shown in a dual-mode layer's head. */
function SideBadge({ side }: { side: LiveSide }) {
  const { label, glyph } = SIDE_META[side]
  return (
    <View
      className="flex-row items-center bg-surface-raised border-border"
      style={{ gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}
    >
      <Text className="text-text-secondary" style={{ fontSize: 13 }}>
        {glyph}
      </Text>
      <Text
        className="text-text-secondary"
        style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1 }}
      >
        {label}
      </Text>
    </View>
  )
}

/**
 * Lab specimen — the LIVE (mid-set) stage of the North Star wall dashboard.
 *
 * Composes production primitives around the fixture read-model. The stage root is
 * wrapped in a {@link LiveAuraFrame} whose category tracks the velocity-loss verdict.
 * NOT a published component — lab-scoped composition only.
 *
 * `side` renders this as ONE LAYER of a dual-mode (bilateral) exercise — a per-voltra
 * badge in the head and a slightly denser hero. LivePage stacks two of these (one per
 * voltra) for dual-mode sets; a unified split-bar treatment is a later exploration.
 */
export function LiveView({ model, side }: { model: DashboardModel; side?: LiveSide }) {
  const { live, session } = model
  const verdict = verdictFromLoss(live.velocityLossPct)
  const meanCon = meanVelocity(live.repVelocities)
  const dual = side != null
  const heroHeight = dual ? 180 : 240

  return (
    // head verdict → full-surface aura flood (threshold amber for the mid-zone fixture).
    <LiveAuraFrame category={verdict} style={{ flex: 1, margin: dual ? 12 : 20 }}>
      <View style={{ flex: 1, padding: dual ? 20 : 28, gap: dual ? 16 : 24 }}>
        {/* head: exercise identity + load line, with the read-once verdict pill. */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            {side && <SideBadge side={side} />}
            <ExerciseHeading
              name={session.exerciseName}
              sets={session.plannedSets}
              reps={8}
              load={session.weightLbs}
              unit={session.unit}
              tempo={session.tempo}
              indicator="velocity-loss"
            />
          </View>
          <StatusPill status={verdict} />
        </View>

        <View className="flex-row" style={{ flex: 1, gap: 28 }}>
          {/* left: the velocity hero (wall live-set treatment). */}
          <View style={{ flex: 3 }}>
            <Text
              className="text-text-tertiary"
              style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}
            >
              CONCENTRIC VELOCITY · THIS SET
            </Text>
            <VelocityStrip
              variant="hero"
              velocities={live.repVelocities}
              liveRepIndex={live.repVelocities.length - 1}
              targetReps={8}
              height={heroHeight}
              scale="fixed"
            />
          </View>

          {/* right: the live metrics stack (tighter gaps in a dual-mode layer). */}
          <View style={{ flex: 2, gap: dual ? 14 : 20 }}>
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

            {/* TEMPO — wall density (full phase words, active delta countdown). */}
            <View>
              <Text
                className="text-text-tertiary"
                style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}
              >
                TEMPO
              </Text>
              <TempoBar
                size="wall"
                activeDisplay="delta"
                activePhase="concentric"
                phaseElapsedMs={700}
                completed={{ eccentric: 3100, hold: 900 }}
                target={{ eccentric: 3, hold: 1, concentric: 1 }}
              />
            </View>

            {/* FatigueMeter — wall density (bigger track, needle, tick labels). */}
            <FatigueMeter size="wall" value={live.velocityLossPct} />

            {/* Live coaching cue — compact, batteries-included colored one-liner. */}
            <Alert
              status="warning"
              variant="subtle"
              size="compact"
              message={`VL${live.velocityLossPct} · approaching threshold — 1–2 productive reps left`}
            />
          </View>
        </View>
      </View>
    </LiveAuraFrame>
  )
}
