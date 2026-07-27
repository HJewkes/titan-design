import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { GhostSpark } from './GhostSpark'
import { GhostBand, BAND_H, BAND_GAP } from './GhostBand'
import { GhostBloom, type Pt, type BloomTreatment } from './GhostBloom'
import { ghostLineColor, clamp01 } from './fatigue-tokens'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES } from './fatigue-mock'
import type { PhaseSegment } from './fatigue-model'

const PANEL_BG = primitiveColors.charcoal[800]
const PAGE_BG = primitiveColors.charcoal[900]
const t = getSemanticColors('dark')

const meta: Meta<typeof GhostSpark> = {
  title: 'Workout/Fatigue/Ghost Spark',
  component: GhostSpark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Per-rep velocity-time sparkline on the band model (coherent with the mirrored dual): a wide ' +
          'phase-coloured band at the bottom (ecc magenta / con cyan, ECC/CON labelled inside, always ' +
          'shown) with the velocity blooming UP from it — current rep solid over faded ghosts, a control-' +
          'aware silver/red line tint (silver when controlled, dimming with tempo drift; shades of red on ' +
          'collapse), over a soft paper-inspired ground (no hard outline).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof GhostSpark>

const box = (child: React.ReactNode) => (
  <View style={{ width: 400, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
    {child}
  </View>
)
const cur = FATIGUE_STATES[3].model // the full 8-rep set

const label = (s: string) => (
  <Text
    style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', color: t['text-tertiary'] }}
  >
    {s}
  </Text>
)

/** The default spark — band + bloom, ECC/CON labels always visible. */
export const Default: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 8, alignItems: 'flex-start' }}>
      {label('GHOST SPARK')}
      {box(<GhostSpark curves={cur.velocityCurves} width={360} height={190} />)}
    </View>
  ),
}

/** The line tint across the set — early controlled reps stay silver, late reps go through shades of red. */
export const ControlAwareTint: Story = {
  render: () => (
    <View
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      {FATIGUE_STATES.map((s) => (
        <View key={s.name} style={{ gap: 8 }}>
          {label(s.name)}
          {box(<GhostSpark curves={s.model.velocityCurves} width={360} height={170} />)}
        </View>
      ))}
    </View>
  ),
}

// --- Line ground treatment comparison ------------------------------------------------
// The paper-inspired line treatments, fed the same current rep, for the operator to pick.
// Each renders GhostBloom directly (same geometry GhostSpark uses) at one treatment.
function TreatmentDemo({ treatment }: { treatment: BloomTreatment }) {
  const w = 360
  const h = 190
  const padL = 12
  const padR = 8
  const padTop = 10
  const padBot = 6
  const curves = cur.velocityCurves
  const c = curves[curves.length - 1]
  const allSamples = curves.flatMap((cc) => cc.samples)
  const vmax = Math.max(0.01, ...allSamples.map((s) => s.velocityMps)) * 1.06
  const axisMaxT =
    Math.max(1, ...curves.map((cc) => cc.samples[cc.samples.length - 1]?.tMs ?? 0)) * 1.04
  const bandTop = h - padBot - BAND_H
  const baseline = bandTop - BAND_GAP
  const plotH = Math.max(1, baseline - padTop)
  const x = (ms: number) => padL + (ms / axisMaxT) * (w - padL - padR)
  const magOf = (v: number) => clamp01(v / vmax) * plotH
  const curPts: Pt[] = c.samples.map((s) => [x(s.tMs), magOf(s.velocityMps)])
  const ghostPts: Pt[][] = curves
    .slice(0, -1)
    .map((cc) => cc.samples.map((s): Pt => [x(s.tMs), magOf(s.velocityMps)]))
  const tint = ghostLineColor(c.tempoDeviation, c.grindSignature)
  return (
    <View style={{ width: w, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
      <svg width={w} height={h}>
        <GhostBloom
          current={curPts}
          ghosts={ghostPts}
          tint={tint}
          baseline={baseline}
          orientation="up"
          treatment={treatment}
        />
        <GhostBand segments={c.phaseSegments} x={x} top={bandTop} showLabels />
      </svg>
    </View>
  )
}

/** (a) Soft blurred GLOW in the line's own tint — a colored halo, no black. */
export const LineTreatmentGlow: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 8, alignItems: 'flex-start' }}>
      {label('A · GLOW (colored halo, no black)')}
      <TreatmentDemo treatment="glow" />
    </View>
  ),
}

/** (b) Rim-light: a thin lighter edge on the upper side + a soft contact shadow below. */
export const LineTreatmentRimlight: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 8, alignItems: 'flex-start' }}>
      {label('B · RIM-LIGHT (upper rim + soft contact shadow)')}
      <TreatmentDemo treatment="rimlight" />
    </View>
  ),
}

/** (c) Soft: a much softer/blurrier low-opacity shadow with no hard edge (the default). */
export const LineTreatmentSoft: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 8, alignItems: 'flex-start' }}>
      {label('C · SOFT (blurred low-opacity shadow, no hard edge)')}
      <TreatmentDemo treatment="soft" />
    </View>
  ),
}

/**
 * A rep with REAL holds (the sample-derived mock collapses its pauses to zero width, so
 * the hold tone never shows there). Segments are handed in with SEAMS between the runs —
 * the shape the model actually produces — to prove the band closes them: one contiguous
 * strip, boundaries on the phase transitions, the hold reading as band material.
 *
 * The two prescribed pauses are `hold` (deliberate, under load); the trailing run is
 * `idle` — undirected dead time after the rep. Both sit in the grey family, separated by
 * VALUE and by the fact that a hold paces and idle never does.
 */
const PAUSED_SEGMENTS: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 2100 },
  { phase: 'hold', startMs: 2190, endMs: 2900 },
  { phase: 'concentric', startMs: 2990, endMs: 4050 },
  { phase: 'hold', startMs: 4140, endMs: 4600 },
  { phase: 'idle', startMs: 4690, endMs: 5200 },
]

/** Prescribed tempo for the paced variants — [ecc, pauseBottom, con, pauseTop] seconds. */
const PAUSED_TARGET: [number, number, number, number] = [2.1, 0.7, 1.05, 0.45]

export const PausedRepBand: Story = {
  render: () => {
    const w = 360
    const h = 60
    const bandTop = 22
    const x = (ms: number) => 12 + (ms / 5400) * (w - 20)
    const Band = (props: { targetTempoSeconds?: [number, number, number, number] }) => (
      <View style={{ width: w, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
        <svg width={w} height={h}>
          <GhostBand segments={PAUSED_SEGMENTS} x={x} top={bandTop} showLabels {...props} />
        </svg>
      </View>
    )
    return (
      <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 16, alignItems: 'flex-start' }}>
        {label('FLAT · no tempo prescribed — nothing to pace against')}
        <Band />
        {label('PACED · every phase ON TARGET — fills to the brim, labels green')}
        <Band targetTempoSeconds={PAUSED_TARGET} />
        {label('PACED · target DOUBLED — every phase now reads early, half-filled, amber')}
        <Band targetTempoSeconds={[4.2, 1.4, 2.1, 0.9]} />
        {label('PACED · target HALVED — every phase overruns, capped full, labels red')}
        <Band targetTempoSeconds={[1.05, 0.35, 0.52, 0.22]} />
      </View>
    )
  },
}
