// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'
import {
  StatusPill,
  LiveAuraFrame,
  VelocityStrip,
  TempoBar,
  TempoDisplay,
  SetsRepsLoad,
  FatigueMeter,
  Alert,
} from '../../components'
import { type DashboardModel, verdictFromLoss } from './fixtures'

/** Font size for the head's large prescription read-out (SetsRepsLoad + tempo). */
const PRESCRIPTION_SIZE = 32

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
  const dual = side != null
  const heroHeight = dual ? 180 : 240

  return (
    // head verdict → full-surface aura flood (threshold amber for the mid-zone fixture).
    <LiveAuraFrame category={verdict} style={{ flex: 1, margin: dual ? 12 : 20 }}>
      <View style={{ flex: 1, padding: dual ? 20 : 28, gap: dual ? 16 : 24 }}>
        {/* head: exercise identity + a LARGE prescription read-out (sets × reps @ load · tempo). */}
        <View className="flex-row items-start justify-between">
          <View style={{ gap: 8, flexShrink: 1 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              {side && <SideBadge side={side} />}
              <Text
                className="text-text-primary"
                style={{
                  fontSize: 26,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: '700',
                }}
              >
                {session.exerciseName}
              </Text>
            </View>
            {/* the prescription, in the SetsRepsLoad / TempoDisplay language (faded ×/@/dashes),
                scaled up to be the head's hero read-out. */}
            <View className="flex-row items-baseline" style={{ gap: 24, flexWrap: 'wrap' }}>
              <SetsRepsLoad
                sets={session.plannedSets}
                reps={8}
                load={session.weightLbs}
                unit={session.unit}
                fontSize={PRESCRIPTION_SIZE}
              />
              <TempoDisplay
                tempo={session.tempo}
                fontSize={PRESCRIPTION_SIZE}
                showLabel={false}
                showInfo={false}
              />
            </View>
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
            {/* `peak` scale so the bars fill the plot (fixed scale left ~half the chart empty). */}
            <VelocityStrip
              variant="hero"
              velocities={live.repVelocities}
              liveRepIndex={live.repVelocities.length - 1}
              targetReps={8}
              height={heroHeight}
              scale="peak"
            />
          </View>

          {/* right: in-set feedback — wall tempo, fatigue, and the live cue. */}
          <View style={{ flex: 2, gap: dual ? 14 : 20 }}>

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
                showPacingMark={false}
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
