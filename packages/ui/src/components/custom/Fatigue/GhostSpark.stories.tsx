import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { GhostSpark } from './GhostSpark'
import { GhostBand } from './GhostBand'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, TARGET_TEMPO_SECONDS } from './fatigue-mock'
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
          'collapse), over a soft paper-inspired ground (no hard outline). Given `targetTempoSeconds` ' +
          'the band also PACES: each run fills across `elapsed / target` of its own width and its label ' +
          'takes the ahead / on-pace / over tone. Every story here passes the prescription the mock reps ' +
          'were generated against, so the fill you see is the real relationship, not a decoration.',
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
      {label('GHOST SPARK · paced against the prescribed tempo')}
      {box(
        <GhostSpark
          curves={cur.velocityCurves}
          width={360}
          height={190}
          targetTempoSeconds={TARGET_TEMPO_SECONDS}
        />
      )}
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
          {box(
            <GhostSpark
              curves={s.model.velocityCurves}
              width={360}
              height={170}
              targetTempoSeconds={s.model.targetTempoSeconds}
            />
          )}
        </View>
      ))}
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

/**
 * BEFORE the first rep. With a prescription there is still something true to draw: the shape
 * of the rep being asked for — its phases at their target durations, unfilled — so the axis
 * previews the work rather than reading as "no data".
 *
 * The right-hand case is the honest fallback: no tempo prescribed, nothing to preview.
 */
export const EmptyBeforeFirstRep: Story = {
  render: () => (
    <View
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
      }}
    >
      <View style={{ gap: 8 }}>
        {label('EMPTY · tempo prescribed — the rep to come')}
        {box(<GhostSpark curves={[]} width={360} height={190} targetTempoSeconds={[3, 1, 2, 1]} />)}
      </View>
      <View style={{ gap: 8 }}>
        {label('EMPTY · no prescription — nothing to preview')}
        {box(<GhostSpark curves={[]} width={360} height={190} />)}
      </View>
    </View>
  ),
}
