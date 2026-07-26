// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * LiveFatigueCard — the vertical live fatigue card. One focal read (the RPE/verdict
 * hero + three why-lights, grouped at top) → the ROM progression → the ghost-spark
 * (tempo embedded), the last two spread through the leftover height. Consumes ONE
 * {@link LiveFatigueModel}.
 *
 * SURFACE (TD-07.08). The card grounds on the `base` plane — ONE step above the
 * `background` shell the live stage paints, per the surface north-star's pairing matrix
 * (a card is parent+1; `raised`/`overlay` skip levels and read hot against the near-black
 * frame). Separation is carried by the alpha `hairline-default` edge, not by lightness —
 * the north-star's primary cue, self-normalising on any plane.
 *
 * PAPER. The live card is one of the designated hero surfaces, so it takes the paper
 * accent DELIBERATELY: the shared {@link barPaper} treatment (brightness-scaled matte
 * grain + crisp top rim-light + soft contact shadow) — the same material the ROM /
 * velocity bars are made of, now carrying the sheet they sit on. Token-sourced fill, no
 * hardcoded surface hex.
 */
import { View } from 'react-native'
import { Surface } from '../../ui/surface/Surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { barPaper } from '../../../theme/bar-paper'
import { VerdictHero } from './VerdictHero'
import { FatigueLights } from './FatigueLights'
import { RomProgressionChart } from './RomProgressionChart'
import { GhostSpark } from './GhostSpark'
import type { LiveFatigueModel } from './fatigue-model'

const t = getSemanticColors('dark')

export interface LiveFatigueCardProps {
  /** The live fatigue read-model for the current set. */
  model: LiveFatigueModel
  /** Card width in px. Default 318. */
  width?: number
  /** Card height in px — when set, the sections spread through the leftover height. */
  height?: number
}

const PAD = 18
const GHOST_GUTTER = 4 // GhostSpark carries this L/R padding internally

export function LiveFatigueCard({ model, width = 318, height }: LiveFatigueCardProps) {
  const chartW = width - PAD * 2 - GHOST_GUTTER * 2
  const chartH = height != null ? Math.round(Math.min(240, Math.max(168, height * 0.4))) : 172
  return (
    <Surface
      level="base"
      testID="live-fatigue-card"
      style={{
        width,
        height,
        borderRadius: 14,
        padding: PAD,
        borderWidth: 1,
        borderColor: t['hairline-default'],
        ...barPaper(t['surface-base']),
      }}
    >
      {/* top group — verdict hero + the three why-lights, tight together. */}
      <View style={{ gap: 12 }}>
        <VerdictHero rpe={model.rpe} verdict={model.verdict} />
        <FatigueLights dimensions={model.verdict?.dimensions ?? null} />
      </View>

      <View style={{ flex: 1, minHeight: 16 }} />

      <RomProgressionChart
        points={model.romProgression}
        workingStandardM={model.romWorkingStandardM}
        shortThresholdM={model.romShortThresholdM}
        plannedReps={model.plannedReps}
      />

      <View style={{ flex: 1, minHeight: 16 }} />

      <GhostSpark curves={model.velocityCurves} width={chartW} height={chartH} />
    </Surface>
  )
}
