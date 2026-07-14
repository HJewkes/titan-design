// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, type LayoutChangeEvent } from 'react-native'
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
/** Below this stage width the two-column body stacks and the head scales down. */
const NARROW_STAGE = 760

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

  // Measure the stage so the layout can respond to the ACTUAL content width (the
  // shell nav + rail eat ~360px, so viewport width is not the stage width). RNW has
  // no CSS media queries — onLayout is the idiomatic RN responsive signal.
  const [stageW, setStageW] = useState(0)
  const onStageLayout = (e: LayoutChangeEvent) => setStageW(e.nativeEvent.layout.width)
  const narrow = stageW > 0 && stageW < NARROW_STAGE
  const prescriptionSize = narrow ? 24 : PRESCRIPTION_SIZE

  return (
    // head verdict → full-surface aura flood (threshold amber for the mid-zone fixture).
    <LiveAuraFrame category={verdict} style={{ flex: 1, margin: dual ? 12 : 20 }}>
      <View onLayout={onStageLayout} style={{ flex: 1, padding: dual ? 20 : 28, gap: dual ? 16 : 24 }}>
        {/* head: identity + verdict pill on one row, then the LARGE prescription full-width below. */}
        <View style={{ gap: 8 }}>
          {/* name + pill share a row; the name column yields, the pill never shrinks. */}
          <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 10, flex: 1, minWidth: 0 }}>
              {side && <SideBadge side={side} />}
              <Text
                numberOfLines={1}
                className="text-text-primary"
                style={{
                  fontSize: narrow ? 20 : 26,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: '700',
                }}
              >
                {session.exerciseName}
              </Text>
            </View>
            <View style={{ flexShrink: 0 }}>
              <StatusPill status={verdict} />
            </View>
          </View>
          {/* the prescription, in the SetsRepsLoad / TempoDisplay language (faded ×/@/dashes),
              scaled up to be the head's hero read-out. */}
          <View className="flex-row items-baseline" style={{ gap: 24, flexWrap: 'wrap' }}>
            <SetsRepsLoad
              sets={session.plannedSets}
              reps={8}
              load={session.weightLbs}
              unit={session.unit}
              fontSize={prescriptionSize}
            />
            <TempoDisplay
              tempo={session.tempo}
              fontSize={prescriptionSize}
              showLabel={false}
              showInfo={false}
            />
          </View>
        </View>

        {/* Body: hero + in-set feedback. Two columns on a wide stage; below NARROW_STAGE
            it stacks so the tempo/fatigue/cue get the full width (they truncate when squeezed). */}
        <View
          style={{
            flex: narrow ? undefined : 1,
            flexDirection: narrow ? 'column' : 'row',
            gap: narrow ? (dual ? 16 : 20) : 28,
          }}
        >
          {/* the velocity hero (wall live-set treatment). */}
          <View style={{ flex: narrow ? undefined : 3 }}>
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

          {/* in-set feedback — wall tempo, fatigue, and the live cue. */}
          <View style={{ flex: narrow ? undefined : 2, gap: dual ? 14 : 20 }}>

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
