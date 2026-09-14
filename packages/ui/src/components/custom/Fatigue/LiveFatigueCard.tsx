// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * LiveFatigueCard — the vertical live fatigue card. One focal read (the RPE/verdict
 * hero + three why-lights, grouped at top) → the ROM progression → the ghost-spark
 * (tempo embedded). Consumes ONE {@link LiveFatigueModel}.
 *
 * SPACING (VW-276). The three sections are parted by ONE content-driven gap from
 * {@link cardSectionGap}, capped at `CARD_SECTION_GAP_MAX`. They used to be `flex: 1`
 * spacers, which handed the gaps every pixel of leftover height — 188px each at the
 * wall's 820 — and the sections read as three unrelated cards. Leftover past the cap
 * now collects below the last section rather than inside the group.
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
 *
 * MODE (TD-03.59). The edge and the paper fill resolve for the mode the enclosing
 * `<Surface>` publishes, not for a module-scope dark pin. Outside any Surface the context
 * still defaults to dark, so the wall display is unchanged.
 */
import { View } from 'react-native'
import { Surface, useSurfaceMode } from '../../ui/surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { barPaper } from '../../../theme/materials'
import { cardChartHeight, cardSectionGap } from './panel-layout'
import { VerdictHero } from './VerdictHero'
import { FatigueLights } from './FatigueLights'
import { RomProgressionChart } from './RomProgressionChart'
import { GhostSpark, GHOST_GUTTER } from './GhostSpark'
import type { LiveFatigueModel } from './fatigue-model'

export interface LiveFatigueCardProps {
  /** The live fatigue read-model for the current set. */
  model: LiveFatigueModel
  /** Card width in px. Default 318. */
  width?: number
  /** Card height in px — when set, the sections spread through the leftover height. */
  height?: number
}

// Operator decision 2026-09-14 (AW-142 wave three): kept; measured geometry; AW-121.
// CARD_FIXED_CONTENT_HEIGHT and CARD_CHROME_HEIGHT count PAD twice; re-measure in AW-121.
const PAD = 18

export function LiveFatigueCard({ model, width = 318, height }: LiveFatigueCardProps) {
  const t = getSemanticColors(useSurfaceMode())
  const chartW = width - PAD * 2 - GHOST_GUTTER * 2
  const chartH = cardChartHeight(height)
  const sectionGap = cardSectionGap(height)
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
      <View className="gap-3">
        <VerdictHero rpe={model.rpe} verdict={model.verdict} />
        <FatigueLights dimensions={model.verdict?.dimensions ?? null} />
      </View>

      <View style={{ height: sectionGap }} />

      <RomProgressionChart
        points={model.romProgression}
        workingStandardM={model.romWorkingStandardM}
        shortThresholdM={model.romShortThresholdM}
        plannedReps={model.plannedReps}
      />

      <View style={{ height: sectionGap }} />

      <GhostSpark
        curves={model.velocityCurves}
        width={chartW}
        height={chartH}
        targetTempoSeconds={model.targetTempoSeconds}
      />
    </Surface>
  )
}
