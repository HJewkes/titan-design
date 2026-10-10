// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * LiveFatigueCard — the vertical live fatigue card. One focal read (the RPE/verdict
 * hero + three why-lights, grouped at top) → the ROM progression → the ghost-spark
 * (tempo embedded). Consumes ONE {@link LiveFatigueModel}.
 *
 * LAYOUT (TD-326). `layout` picks the arrangement the panel's tier asks for
 * ({@link CardLayout}): the shipped `column`; `fill`, the column with the leftover height
 * spent on the two charts so the wall card has no void under the spark; and `compact`,
 * the wrapped tiers' band — verdict and lights on one row, the two charts side by side
 * at one small height — so the card sits under the velocity hero without outweighing it.
 *
 * SPACING (VW-276). The three sections are parted by ONE content-driven gap from
 * {@link cardSections}, capped at `CARD_SECTION_GAP_MAX`. They used to be `flex: 1`
 * spacers, which handed the gaps every pixel of leftover height — 188px each at the
 * wall's 820 — and the sections read as three unrelated cards. Leftover past the cap
 * now collects below the last section (`column`) or goes to the charts (`fill`).
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
import {
  CARD_WIDTH_BASE,
  COMPACT_CHART_GAP,
  cardSections,
  type CardLayout,
  type CardSections,
} from './panel-layout'
import { VerdictHero } from './VerdictHero'
import { FatigueLights } from './FatigueLights'
import { RomProgressionChart } from './RomProgressionChart'
import { GhostSpark, GHOST_GUTTER } from './GhostSpark'
import type { LiveFatigueModel } from './fatigue-model'

export interface LiveFatigueCardProps {
  /** The live fatigue read-model for the current set. */
  model: LiveFatigueModel
  /** Card width in px. Default `CARD_WIDTH_BASE`. */
  width?: number
  /** Card height in px — when set, the sections spread through the leftover height. */
  height?: number
  /** How the sections are arranged — the panel passes its tier's. Default `column`. */
  layout?: CardLayout
}

// Operator decision 2026-09-14 (AW-142 wave three): kept; measured geometry; AW-121.
// CARD_FIXED_CONTENT_HEIGHT and CARD_COMPACT_HEIGHT count PAD twice; re-measure in AW-121.
const PAD = 18

interface SectionProps {
  model: LiveFatigueModel
  sections: CardSections
  /** The width inside the card's padding, px. */
  contentWidth: number
}

/** The ROM progression plot at the section's height. */
function RomSection({ model, height }: { model: LiveFatigueModel; height: number }) {
  return (
    <RomProgressionChart
      points={model.romProgression}
      workingStandardM={model.romWorkingStandardM}
      shortThresholdM={model.romShortThresholdM}
      plannedReps={model.plannedReps}
      barHeight={height}
    />
  )
}

/** `column` and `fill`: the verdict group, the ROM chart and the spark top to bottom. */
function ColumnSections({ model, sections, contentWidth }: SectionProps) {
  return (
    <>
      {/* top group — verdict hero + the three why-lights, tight together. */}
      <View className="gap-3">
        <VerdictHero rpe={model.rpe} verdict={model.verdict} />
        <FatigueLights dimensions={model.verdict?.dimensions ?? null} />
      </View>
      <View style={{ height: sections.gap }} />
      <RomSection model={model} height={sections.romHeight} />
      <View style={{ height: sections.gap }} />
      <GhostSpark
        curves={model.velocityCurves}
        width={contentWidth - GHOST_GUTTER * 2}
        height={sections.sparkHeight}
        targetTempoSeconds={model.targetTempoSeconds}
      />
    </>
  )
}

/** `compact`: the verdict and the lights on one row, the two charts side by side under it. */
function CompactSections({ model, sections, contentWidth }: SectionProps) {
  const halfWidth = Math.floor((contentWidth - COMPACT_CHART_GAP) / 2)
  return (
    <>
      {/* The lights sit beside the verdict word; on a card too narrow for both they wrap under
          it, parted by the top group's own `gap-3`. */}
      <View
        testID="live-fatigue-card-head"
        className="flex-row flex-wrap items-end justify-between gap-x-inline-lg gap-y-3"
      >
        <VerdictHero rpe={model.rpe} verdict={model.verdict} />
        <FatigueLights dimensions={model.verdict?.dimensions ?? null} />
      </View>
      <View style={{ height: sections.gap }} />
      <View
        testID="live-fatigue-card-charts"
        style={{ flexDirection: 'row', gap: COMPACT_CHART_GAP }}
      >
        <View style={{ flex: 1 }}>
          <RomSection model={model} height={sections.romHeight} />
        </View>
        <View style={{ flex: 1 }}>
          <GhostSpark
            curves={model.velocityCurves}
            width={halfWidth - GHOST_GUTTER * 2}
            height={sections.sparkHeight}
            targetTempoSeconds={model.targetTempoSeconds}
          />
        </View>
      </View>
    </>
  )
}

export function LiveFatigueCard({
  model,
  width = CARD_WIDTH_BASE,
  height,
  layout = 'column',
}: LiveFatigueCardProps) {
  const t = getSemanticColors(useSurfaceMode())
  const sections = cardSections(layout, height)
  const compact = layout === 'compact'
  const Sections = compact ? CompactSections : ColumnSections
  return (
    <Surface
      level="base"
      testID="live-fatigue-card"
      style={{
        width,
        // A compact band narrower than its verdict row wraps the lights under the word and
        // grows, rather than clipping the charts at the pinned height.
        ...(compact ? { minHeight: height } : { height }),
        borderRadius: 14,
        padding: PAD,
        borderWidth: 1,
        borderColor: t['hairline-default'],
        ...barPaper(t['surface-base']),
      }}
    >
      <Sections model={model} sections={sections} contentWidth={width - PAD * 2} />
    </Surface>
  )
}
