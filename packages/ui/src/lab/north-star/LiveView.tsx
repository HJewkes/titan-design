// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactElement } from 'react'
import { View, Text, type LayoutChangeEvent } from 'react-native'
import {
  LiveAuraFrame,
  VelocityStrip,
  DualVelocityStrip,
  TempoDisplay,
  SetsRepsLoad,
  SetStrip,
  type SetStripSet,
  ActivityIcon,
  AlertTriangleIcon,
  CircleSlashIcon,
  type IconProps,
} from '../../components'
import { Tooltip } from '../../components/ui/tooltip/Tooltip'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { alpha } from '../../utils/colors'
import { insetWell } from './surfaces'
import { type DashboardModel, verdictFromLoss } from './fixtures'

const t = getSemanticColors('dark')

/** One row height for the tempo + alert cards, so they line up regardless of tempo font size. */
const CONTROL_HEIGHT = 34
/** The tempo card ground — the inset-well token, so the recessed tempo reads on-system. */
const TEMPO_GROUND = t['surface-input']

/** Clamped linear interpolation of `v` between `vLo..vHi` as `w` runs `wLo..wHi`. */
function clampLerp(w: number, wLo: number, wHi: number, vLo: number, vHi: number): number {
  if (w <= wLo) return vLo
  if (w >= wHi) return vHi
  return vLo + ((w - wLo) / (wHi - wLo)) * (vHi - vLo)
}

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
// A CONTEXTUAL glyph keyed on proximity to the velocity-loss threshold (replaces the flat
// colour dot): a healthy pulse well under, a warning triangle at the threshold band, a
// slashed circle once past it.
const STATUS_ICON: Record<Verdict, (props: IconProps) => ReactElement> = {
  productive: ActivityIcon,
  threshold: AlertTriangleIcon,
  stop: CircleSlashIcon,
}

/** How much of the alert survives at the current width. */
export type AlertMode = 'full' | 'compact' | 'icon'

/** The alert as a canted POST-IT note: a tinted matte fill + rim + contact shadow +
 *  a deliberate tilt, shared by the card and the icon pill. */
function alertSurface(tone: string) {
  return {
    borderWidth: 1,
    borderColor: alpha(tone, 0.5),
    backgroundColor: alpha(tone, 0.2),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 14px rgba(0,0,0,0.45)',
    transform: [{ rotate: '-1.5deg' }],
  }
}

/**
 * The single status element — a tinted alert card carrying the exertion message. It sheds
 * detail as space tightens: `full` shows the contextual icon + verdict + inline message
 * (capped at `availWidth` so it ellipsises + keeps a hover tip rather than running off-page);
 * `compact` drops the message to the tip; `icon` collapses to just the contextual glyph,
 * verdict + message on hover.
 */
function AlertCue({
  status,
  message,
  mode,
  availWidth,
}: {
  status: Verdict
  message: string
  mode: AlertMode
  /** Pixels the alert may occupy (row width − tempo − gap); caps the card so the message clips. */
  availWidth?: number
}) {
  const tone = STATUS_COLOR[status]
  const Icon = STATUS_ICON[status]
  const meaningful = status === 'threshold' || status === 'stop'

  // Tightest: icon-only pill. Verdict + message live in the hover tip.
  if (mode === 'icon') {
    const pill = (
      <View
        style={{
          width: CONTROL_HEIGHT,
          height: CONTROL_HEIGHT,
          borderRadius: 9,
          alignItems: 'center',
          justifyContent: 'center',
          ...alertSurface(tone),
        }}
      >
        <Icon size={17} color={tone} />
      </View>
    )
    return meaningful ? (
      <Tooltip label={`${VERDICT_LABEL[status]} · ${message}`} placement="bottom">
        {pill}
      </Tooltip>
    ) : (
      pill
    )
  }

  const card = (
    <View
      className="flex-row items-center"
      style={{
        gap: 8,
        height: CONTROL_HEIGHT,
        // Concrete px cap (not %) so the single-line message ellipsises through the wrapper chain.
        maxWidth: availWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        ...alertSurface(tone),
      }}
    >
      <Icon size={15} color={tone} />
      <Text style={{ color: tone, fontSize: 13, fontWeight: '700', flexShrink: 0 }}>
        {VERDICT_LABEL[status]}
      </Text>
      {mode === 'full' && meaningful && (
        // Bounded + single-line: ellipsises instead of pushing off the page (full text on hover).
        <Text
          numberOfLines={1}
          style={{ color: tone, fontSize: 13, fontWeight: '600', flexShrink: 1, minWidth: 0 }}
        >
          · {message}
        </Text>
      )}
    </View>
  )
  // Keep the full message a hover away whenever it isn't fully spelled out (compact) or may be
  // clipped (full → ellipsis).
  return meaningful ? (
    <Tooltip label={message} placement="bottom">
      {card}
    </Tooltip>
  ) : (
    card
  )
}

// --- Live tempo phase mapping -------------------------------------------------

/** Map the model's movement phase onto TempoDisplay's live-fill phase key. */
function mapLivePhase(
  phase: DashboardModel['live']['phase']
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

/** Below this header width the targets line wraps under the name (at the set-heading ratio). */
const HEADER_WRAP = 480
/** At/above this header width the targets render at full size. */
const HEADER_WIDE = 760
/** Targets:name size ratio on the wrapped second line — matches ExerciseHeading (11 / 14). */
const SET_HEADING_RATIO = 11 / 14
const HEADER_NAME_SIZE = 30

/**
 * The workout title + targets — the exercise being performed, independent of how many
 * voltras drive it, so it lives at the TOP OF THE PAGE (above the live stage) and stays
 * visible across single/dual. The targets shrink with width and only wrap under the name
 * (at the set-heading size ratio) once too tight to shrink further. NOT a published component.
 */
export function ExerciseHeader({
  session,
  setStates,
}: {
  session: DashboardModel['session']
  /** The active exercise's per-set states — rendered as the collapsed SetStrip line
   *  under the name + targets (the same data the rail's active row draws). */
  setStates?: SetStripSet[]
}) {
  const [w, setW] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)
  const wrap = w > 0 && w < HEADER_WRAP
  const targetSize = wrap
    ? Math.round(HEADER_NAME_SIZE * SET_HEADING_RATIO) // set-heading ratio on the second line
    : Math.round(clampLerp(w || HEADER_WIDE, HEADER_WRAP, HEADER_WIDE, 22, 28))

  return (
    <View
      onLayout={onLayout}
      className="border-border"
      style={{
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: wrap ? 'column' : 'row',
          alignItems: wrap ? 'flex-start' : 'baseline',
          justifyContent: 'space-between',
          gap: wrap ? 4 : 22,
        }}
      >
        <Text
          className="text-text-primary"
          style={{
            fontSize: HEADER_NAME_SIZE,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
          }}
        >
          {session.exerciseName}
        </Text>
        {/* targets: pinned right when inline, tucked under the name (smaller) when wrapped. */}
        <SetsRepsLoad
          sets={session.plannedSets}
          reps={8}
          load={session.weightLbs}
          unit={session.unit}
          fontSize={targetSize}
        />
      </View>
      {/* the active exercise's collapsed per-set strip (done / active / todo) under the heading. */}
      {setStates != null && setStates.length > 0 && <SetStrip sets={setStates} height={10} />}
    </View>
  )
}

// --- Live stage ---------------------------------------------------------------

/** Below this content width the alert drops its inline message to a hover tip. */
const ALERT_COMPACT = 620
/** Below this content width the alert collapses to just its contextual icon. */
const ALERT_ICON = 430
/** Tempo digit size at rest — matched to sit within {@link CONTROL_HEIGHT}. */
const TEMPO_BASE_FONT = 18
/** Content width at which the tempo has shrunk as far as it goes (near the panel min). */
const TEMPO_SHRINK_FLOOR = 300

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
  const [rowW, setRowW] = useState(0)
  const onRowLayout = (e: LayoutChangeEvent) => setRowW(e.nativeEvent.layout.width)
  const [tempoW, setTempoW] = useState(0)
  const onTempoLayout = (e: LayoutChangeEvent) => setTempoW(e.nativeEvent.layout.width)
  // The alert sheds detail first (message → verdict → icon); the tempo holds its full size
  // until the alert can't shrink any further, then it takes over shrinking.
  const alertMode: AlertMode =
    contentW === 0 || contentW >= ALERT_COMPACT
      ? 'full'
      : contentW >= ALERT_ICON
        ? 'compact'
        : 'icon'
  const tempoFont =
    contentW === 0 || contentW >= ALERT_ICON
      ? TEMPO_BASE_FONT
      : Math.round(clampLerp(contentW, TEMPO_SHRINK_FLOOR, ALERT_ICON, 14, TEMPO_BASE_FONT))
  // Tempo is optional: a set may have no prescribed tempo — then the card is hidden entirely
  // and the alert takes the whole row.
  const hasTempo = session.tempo != null
  // Width the alert may take — measured off the ROW (inside the panel padding) so a long
  // message ellipsises at the side margin rather than running to the panel edge. With no tempo
  // card the alert gets the full row; otherwise it's the row minus the (measured) tempo + gap.
  const CONTROLS_GAP = 16
  const alertAvail =
    rowW > 0
      ? hasTempo
        ? tempoW > 0
          ? Math.max(0, rowW - tempoW - CONTROLS_GAP)
          : undefined
        : rowW
      : undefined

  const [heroH, setHeroH] = useState(0)
  const onHeroLayout = (e: LayoutChangeEvent) => setHeroH(e.nativeEvent.layout.height)
  const heroHeight = heroH > 0 ? heroH : dual ? 200 : 320

  const activePhase = mapLivePhase(live.phase)
  const message = `VL${live.velocityLossPct} · approaching threshold — 1–2 productive reps left`

  return (
    // head verdict → full-surface aura flood; fills its section edge-to-edge — squared off
    // (no radius/border), since it's the section background, not a card within it.
    <LiveAuraFrame category={verdict} style={{ flex: 1, borderRadius: 0, borderWidth: 0 }}>
      <View className="flex-row" style={{ flex: 1 }}>
        {badgeSlot && <VerticalSlotLabel slot={badgeSlot} />}
        <View
          onLayout={onContentLayout}
          style={{ flex: 1, padding: dual ? 18 : 24, gap: dual ? 8 : 10 }}
        >
          {/* controls row: tempo upper-left (when prescribed), alert upper-right. With no tempo
              the alert simply pins right (flex-end); otherwise they split (space-between). */}
          <View
            onLayout={onRowLayout}
            className="flex-row items-center"
            style={{ gap: CONTROLS_GAP, justifyContent: hasTempo ? 'space-between' : 'flex-end' }}
          >
            {/* tempo card — locked to the alert's height (this view only); the inner TempoDisplay
                shrinks its font but stays centred on the shared charcoal ground so it reads seamless. */}
            {session.tempo != null && (
              <View
                onLayout={onTempoLayout}
                style={{
                  height: CONTROL_HEIGHT,
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  borderRadius: 9,
                  overflow: 'hidden',
                  ...insetWell(TEMPO_GROUND),
                }}
              >
                <TempoDisplay
                  tempo={session.tempo}
                  fontSize={tempoFont}
                  live={
                    activePhase ? { activePhase, phaseElapsedMs: live.phaseElapsedMs } : undefined
                  }
                  showLabel={false}
                  showInfo={false}
                />
              </View>
            )}
            <AlertCue status={verdict} message={message} mode={alertMode} availWidth={alertAvail} />
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

/** Reserved right-hand column (px) holding the two vertical tempo strips, clear of the chart. */
const DUAL_TEMPO_GUTTER = 88

/**
 * The DUAL (bilateral) live stage — ONE diverging velocity chart for both voltras
 * (LEFT grows up, RIGHT grows down from a shared centre axis) instead of two stacked
 * single heroes with independent baselines. The exercise identity + targets stay in the
 * page {@link ExerciseHeader}. The L/R fatigue signal is carried entirely by the SPLIT aura
 * (top = LEFT color, bottom = RIGHT) — no separate alert cue. Two vertical tempo strips sit
 * in the empty space past the bars, one per side, each driven by its side's live phase.
 * NOT a published component.
 */
export function DualLiveView({ left, right }: { left: DashboardModel; right: DashboardModel }) {
  const { session } = left
  // Split aura: TOP half colored by the LEFT side's verdict, BOTTOM half by the RIGHT's —
  // matching the diverging chart (L up / R down), one radial glow from the panel centre.
  const leftVerdict = verdictFromLoss(left.live.velocityLossPct)
  const rightVerdict = verdictFromLoss(right.live.velocityLossPct)
  // Per-side live tempo phase — the top strip fills on LEFT's phase, the bottom on RIGHT's.
  const leftPhase = mapLivePhase(left.live.phase)
  const rightPhase = mapLivePhase(right.live.phase)

  const [heroH, setHeroH] = useState(0)
  const onHeroLayout = (e: LayoutChangeEvent) => setHeroH(e.nativeEvent.layout.height)
  const heroHeight = heroH > 0 ? heroH : 320

  const tempoStrip = (phase: ReturnType<typeof mapLivePhase>, phaseElapsedMs: number) =>
    session.tempo != null ? (
      <TempoDisplay
        tempo={session.tempo}
        orientation="vertical"
        fontSize={22}
        showLabel={false}
        showInfo={false}
        live={phase ? { activePhase: phase, phaseElapsedMs } : undefined}
      />
    ) : null

  return (
    <LiveAuraFrame
      category={leftVerdict}
      split={{ top: leftVerdict, bottom: rightVerdict }}
      style={{ flex: 1, borderRadius: 0, borderWidth: 0 }}
    >
      {/* [ diverging chart (flex) ][ fixed tempo gutter ] — the chart lays out within its
          REDUCED width so its bars / stubs / reference lines / centre axis end BEFORE the
          tempo strips (no overlap). Symmetric row padding keeps the chart vertically centred,
          so its centre axis (chart height / 2) lands on the aura's 50% split line — and the
          gutter's top/bottom halves meet on that same line, aligning the L/R tempo strips. */}
      <View style={{ flex: 1, flexDirection: 'row', padding: 24, gap: 10 }}>
        <View style={{ flex: 1, position: 'relative' }} onLayout={onHeroLayout}>
          <DualVelocityStrip
            variant="hero"
            left={{ velocities: left.live.repVelocities }}
            right={{ velocities: right.live.repVelocities }}
            liveRepIndex={left.live.repVelocities.length - 1}
            targetReps={8}
            height={heroHeight}
            scale="peak"
          />
        </View>
        {session.tempo != null && (
          <View style={{ width: DUAL_TEMPO_GUTTER }} pointerEvents="none">
            {/* TOP half — LEFT voltra tempo (aligned to the up wing). */}
            <View style={{ height: '50%', justifyContent: 'center', alignItems: 'center' }}>
              {tempoStrip(leftPhase, left.live.phaseElapsedMs)}
            </View>
            {/* BOTTOM half — RIGHT voltra tempo (aligned to the down wing). */}
            <View style={{ height: '50%', justifyContent: 'center', alignItems: 'center' }}>
              {tempoStrip(rightPhase, right.live.phaseElapsedMs)}
            </View>
          </View>
        )}
      </View>
    </LiveAuraFrame>
  )
}
