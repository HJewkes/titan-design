// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * LiveFatigueCard — the vertical live fatigue card. One focal read (the RPE/verdict
 * hero + three why-lights, grouped at top) → the ROM progression → the ghost-spark
 * (tempo embedded), the last two spread through the leftover height. Consumes ONE
 * {@link LiveFatigueModel}.
 *
 * The card grounds on a {@link Surface} `raised` plane (the paper-accent hero surface)
 * — it never hardcodes a surface hex, so it inherits the surface-ramp / paper-accent
 * refresh when that ships.
 */
import { View } from 'react-native'
import { Surface } from '../../ui/surface/Surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
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
      level="raised"
      testID="live-fatigue-card"
      style={{
        width,
        height,
        borderRadius: 14,
        padding: PAD,
        borderWidth: 1,
        borderColor: t['border-default'],
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
      />

      <View style={{ flex: 1, minHeight: 16 }} />

      <GhostSpark curves={model.velocityCurves} width={chartW} height={chartH} />
    </Surface>
  )
}
