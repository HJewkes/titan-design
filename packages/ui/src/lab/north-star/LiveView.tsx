// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, type LayoutChangeEvent } from 'react-native'
import { LiveAuraFrame, VelocityStrip, TempoDisplay, SetsRepsLoad } from '../../components'
import { Tooltip } from '../../components/ui/tooltip/Tooltip'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { alpha } from '../../utils/colors'
import { neumorphicShadows } from '../../theme/shadows'
import { type DashboardModel, verdictFromLoss } from './fixtures'

const t = getSemanticColors('dark')

/** Below this content width the alert message collapses to a hover tip. */
const NARROW_CONTENT = 620
/** Raised-card elevation shared by the alert + tempo cards. */
const CARD_SHADOW = neumorphicShadows.charcoal.raised.medium

// --- Voltra slot --------------------------------------------------------------

/** Which Voltra a live view is reading from — for dual mode and multi-device sessions. */
export type VoltraSlot = 'L' | 'R'

const SLOT_META: Record<VoltraSlot, { label: string }> = {
  L: { label: 'LEFT VOLTRA' },
  R: { label: 'RIGHT VOLTRA' },
}

/** The voltra name set vertically down the far-left edge of a layer (dual / multi-device). */
function VerticalSlotLabel({ slot }: { slot: VoltraSlot }) {
  const { label } = SLOT_META[slot]
  return (
    <View
      className="border-border"
      style={{ width: 34, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1 }}
    >
      {/* Fixed width holds the full label before rotation (a bare rotate clips to the strip). */}
      <Text
        className="text-text-tertiary"
        style={{
          width: 150,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 3,
          transform: [{ rotate: '-90deg' }],
        }}
      >
        {label}
      </Text>
    </View>
  )
}

// --- Alert cue ----------------------------------------------------------------

type Verdict = 'productive' | 'threshold' | 'stop'
const STATUS_COLOR: Record<Verdict, string> = {
  productive: t['status-success'],
  threshold: t['status-warning'],
  stop: t['status-error'],
}
const VERDICT_LABEL: Record<Verdict, string> = {
  productive: 'Productive',
  threshold: 'Threshold',
  stop: 'Stop',
}

/**
 * The single status element — a tinted alert CARD that carries the exertion message
 * INSIDE it. On a narrow layer the message collapses (leaving just the verdict) and moves
 * to a hover tip so the detail is still one hover away.
 */
function AlertCue({ status, message, narrow }: { status: Verdict; message: string; narrow: boolean }) {
  const tone = STATUS_COLOR[status]
  const meaningful = status === 'threshold' || status === 'stop'
  const card = (
    <View
      className="flex-row items-center"
      style={{
        gap: 10,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: alpha(tone, 0.45),
        backgroundColor: alpha(tone, 0.14),
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        ...CARD_SHADOW,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} />
      <Text style={{ color: tone, fontSize: 13, fontWeight: '700' }}>{VERDICT_LABEL[status]}</Text>
      {meaningful && !narrow && (
        <Text numberOfLines={1} style={{ color: tone, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>
          · {message}
        </Text>
      )}
    </View>
  )
  // Collapsed (narrow): the detail is a hover away.
  if (narrow && meaningful) {
    return (
      <Tooltip label={message} placement="bottom">
        {card}
      </Tooltip>
    )
  }
  return card
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

// --- Page-level exercise header -----------------------------------------------

/**
 * The workout title + targets — the exercise being performed, independent of how many
 * voltras drive it, so it lives at the TOP OF THE PAGE (above the live stage) and stays
 * visible across single/dual. NOT a published component.
 */
export function ExerciseHeader({ session }: { session: DashboardModel['session'] }) {
  return (
    <View
      className="flex-row items-baseline border-border"
      style={{
        gap: 22,
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
      }}
    >
      <Text
        className="text-text-primary"
        style={{ fontSize: 30, fontFamily: '"Space Grotesk", sans-serif', fontWeight: '700' }}
      >
        {session.exerciseName}
      </Text>
      <SetsRepsLoad
        sets={session.plannedSets}
        reps={8}
        load={session.weightLbs}
        unit={session.unit}
        fontSize={28}
      />
    </View>
  )
}

// --- Live stage ---------------------------------------------------------------

/**
 * Lab specimen — the LIVE (mid-set) stage of one voltra. The exercise identity + targets
 * are the PAGE header ({@link ExerciseHeader}); this layer carries only per-voltra live
 * data: an optional vertical slot label (far left), the alert + live tempo in a row, and
 * the velocity hero. NOT a published component.
 *
 * `side` renders this as one LAYER of a dual-mode set; `slot` names the active voltra in a
 * single-view multi-device session. Either shows the vertical slot label.
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

  const [contentW, setContentW] = useState(0)
  const onContentLayout = (e: LayoutChangeEvent) => setContentW(e.nativeEvent.layout.width)
  const narrow = contentW > 0 && contentW < NARROW_CONTENT

  const [heroH, setHeroH] = useState(0)
  const onHeroLayout = (e: LayoutChangeEvent) => setHeroH(e.nativeEvent.layout.height)
  const heroHeight = heroH > 0 ? heroH : dual ? 200 : 320

  const activePhase = mapLivePhase(live.phase)
  const message = `VL${live.velocityLossPct} · approaching threshold — 1–2 productive reps left`

  return (
    // head verdict → full-surface aura flood (threshold amber for the mid-zone fixture).
    <LiveAuraFrame category={verdict} style={{ flex: 1, margin: dual ? 12 : 20 }}>
      <View className="flex-row" style={{ flex: 1 }}>
        {badgeSlot && <VerticalSlotLabel slot={badgeSlot} />}
        <View
          onLayout={onContentLayout}
          style={{ flex: 1, padding: dual ? 18 : 24, gap: dual ? 8 : 10 }}
        >
          {/* controls row: tempo pinned upper-left, alert pinned upper-right. */}
          <View className="flex-row items-center justify-between" style={{ gap: 16 }}>
            {/* tempo card — balanced with the alert (smaller than the old head lockup), raised. */}
            <View style={{ borderRadius: 9, ...CARD_SHADOW }}>
              <TempoDisplay
                tempo={session.tempo}
                fontSize={22}
                live={activePhase ? { activePhase, phaseElapsedMs: live.phaseElapsedMs } : undefined}
                showLabel={false}
                showInfo={false}
              />
            </View>
            <AlertCue status={verdict} message={message} narrow={narrow} />
          </View>

          {/* the velocity hero fills the rest. */}
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
      </View>
    </LiveAuraFrame>
  )
}
