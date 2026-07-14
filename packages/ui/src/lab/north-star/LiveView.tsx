// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, type LayoutChangeEvent } from 'react-native'
import {
  StatusPill,
  LiveAuraFrame,
  VelocityStrip,
  TempoDisplay,
  SetsRepsLoad,
} from '../../components'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { type DashboardModel, verdictFromLoss } from './fixtures'

const t = getSemanticColors('dark')

/** Font size for the head's large prescription read-out (SetsRepsLoad + tempo). */
const PRESCRIPTION_SIZE = 32
/** Below this stage width the head scales down and the status message collapses. */
const NARROW_STAGE = 760

// --- Voltra slot --------------------------------------------------------------

/** Which Voltra a live view is reading from — for dual mode and multi-device sessions. */
export type VoltraSlot = 'L' | 'R'

const SLOT_META: Record<VoltraSlot, { label: string; glyph: string }> = {
  L: { label: 'LEFT VOLTRA', glyph: '◧' },
  R: { label: 'RIGHT VOLTRA', glyph: '◨' },
}

/** The slot badge — names the voltra this view reads (dual layers, or one-of-many active). */
function SlotBadge({ slot, compact = false }: { slot: VoltraSlot; compact?: boolean }) {
  const { label, glyph } = SLOT_META[slot]
  return (
    <View
      className="flex-row items-center bg-surface-raised border-border"
      style={{
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: 3,
        flexShrink: 0,
      }}
    >
      <Text className="text-text-secondary" style={{ fontSize: 13 }}>
        {glyph}
      </Text>
      <Text
        className="text-text-secondary"
        style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1 }}
      >
        {compact ? slot : label}
      </Text>
    </View>
  )
}

// --- Consolidated status cue --------------------------------------------------

type Verdict = 'productive' | 'threshold' | 'stop'
const STATUS_COLOR: Record<Verdict, string> = {
  productive: t['status-success'],
  threshold: t['status-warning'],
  stop: t['status-error'],
}

/**
 * The single verdict element: the {@link StatusPill}, which EXPANDS to carry an inline
 * message when the verdict is meaningful (threshold/stop). The threshold alert lives in
 * ONE place — not duplicated as a separate cue below. The message collapses on a narrow
 * stage, leaving just the pill.
 */
function StatusCue({
  status,
  message,
  narrow,
}: {
  status: Verdict
  message: string
  narrow: boolean
}) {
  const expanded = (status === 'threshold' || status === 'stop') && !narrow
  return (
    <View className="flex-row items-center" style={{ gap: 12, flexShrink: 1, justifyContent: 'flex-end' }}>
      {expanded && (
        <Text
          numberOfLines={1}
          style={{ color: STATUS_COLOR[status], fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}
        >
          {message}
        </Text>
      )}
      <View style={{ flexShrink: 0 }}>
        <StatusPill status={status} />
      </View>
    </View>
  )
}

// --- Live tempo phase mapping -------------------------------------------------

/** Map the model's movement phase onto TempoDisplay's live-fill phase key. */
function mapLivePhase(
  phase: DashboardModel['live']['phase'],
): 'eccentric' | 'pauseBottom' | 'concentric' | null {
  switch (phase) {
    case 'concentric':
      return 'concentric'
    case 'eccentric':
      return 'eccentric'
    case 'hold':
      return 'pauseBottom'
    default:
      return null
  }
}

// --- Live stage ---------------------------------------------------------------

/**
 * Lab specimen — the LIVE (mid-set) stage of the North Star wall dashboard.
 *
 * The velocity hero IS the stage: the head carries identity, the prescription with a
 * LIVE tempo fill (the single tempo view — no duplicate active-tempo bar), and one
 * consolidated status cue; the velocity chart fills the body. NOT a published component.
 *
 * `side` renders this as one LAYER of a dual-mode (bilateral) exercise (denser, per-voltra
 * badge). `slot` names the active voltra in a single-view multi-device session.
 */
export function LiveView({
  model,
  side,
  slot,
}: {
  model: DashboardModel
  side?: 'left' | 'right'
  slot?: VoltraSlot
}) {
  const { live, session } = model
  const verdict = verdictFromLoss(live.velocityLossPct)
  const dual = side != null
  const badgeSlot: VoltraSlot | null = side ? (side === 'left' ? 'L' : 'R') : (slot ?? null)

  // Measure the stage (shell nav + rail eat ~360px) so the head can scale to the real width.
  const [stageW, setStageW] = useState(0)
  const onStageLayout = (e: LayoutChangeEvent) => setStageW(e.nativeEvent.layout.width)
  const narrow = stageW > 0 && stageW < NARROW_STAGE
  const prescriptionSize = narrow ? 24 : PRESCRIPTION_SIZE

  // The hero fills the body: measure the region and hand its height to the chart.
  const [heroH, setHeroH] = useState(0)
  const onHeroLayout = (e: LayoutChangeEvent) => setHeroH(e.nativeEvent.layout.height)
  const heroHeight = heroH > 0 ? heroH : dual ? 200 : 340

  const activePhase = mapLivePhase(live.phase)
  const message = `VL${live.velocityLossPct} · approaching threshold — 1–2 productive reps left`

  return (
    // head verdict → full-surface aura flood (threshold amber for the mid-zone fixture).
    <LiveAuraFrame category={verdict} style={{ flex: 1, margin: dual ? 12 : 20 }}>
      <View onLayout={onStageLayout} style={{ flex: 1, padding: dual ? 20 : 28, gap: dual ? 14 : 20 }}>
        {/* head: identity + one consolidated status cue, then the prescription with LIVE tempo. */}
        <View style={{ gap: 10 }}>
          <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 10, flex: 1, minWidth: 0 }}>
              {badgeSlot && <SlotBadge slot={badgeSlot} compact={narrow} />}
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
            <StatusCue status={verdict} message={message} narrow={narrow} />
          </View>
          {/* prescription in the SetsRepsLoad / TempoDisplay language (faded ×/@/dashes), scaled
              up — the tempo runs LIVE (active-phase fill), so it is the one and only tempo view. */}
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
              live={activePhase ? { activePhase, phaseElapsedMs: live.phaseElapsedMs } : undefined}
              showLabel={false}
              showInfo={false}
            />
          </View>
        </View>

        {/* body: the velocity hero, full width, filling the space freed by the dropped panels. */}
        <View style={{ flex: 1 }} onLayout={onHeroLayout}>
          <VelocityStrip
            variant="hero"
            velocities={live.repVelocities}
            liveRepIndex={live.repVelocities.length - 1}
            targetReps={8}
            height={heroHeight}
            scale="peak"
          />
        </View>
      </View>
    </LiveAuraFrame>
  )
}
