// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import BodyHighlighter, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { Surface } from '../../ui/surface'
import { Pill, type PillTone } from '../../ui/pill'
import { Typography } from '../Typography'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroupChip, type VolumeStatus as ChipStatus } from './MuscleGroupChip'
import {
  MuscleGroup,
  MUSCLE_TO_SVG_SLUGS,
  isMoreSevere,
  type VolumeStatus as LandmarkZone,
} from './muscleTaxonomy'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { greyRamp, primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** The proposed single 5-value status. Taxonomy A's members, kept verbatim. */
type UnifiedStatus = 'untrained' | 'behind' | 'ontrack' | 'target' | 'over'

const UNIFIED_ORDER: UnifiedStatus[] = ['untrained', 'behind', 'ontrack', 'target', 'over']

const UNIFIED_LABEL: Record<UnifiedStatus, string> = {
  untrained: 'Untrained',
  behind: 'Behind Plan',
  ontrack: 'On Track',
  target: 'Target Met',
  over: 'Over MRV',
}

const UNIFIED_ZONE: Record<UnifiedStatus, string> = {
  untrained: '0 sets logged',
  behind: 'below MEV',
  ontrack: 'MEV - MAV',
  target: 'MAV - MRV',
  over: 'above MRV',
}

/** The wiring the codebase is missing: landmark zone (B) -> UI status (A). */
const ZONE_TO_UNIFIED: Record<LandmarkZone, UnifiedStatus> = {
  under: 'behind',
  maintenance: 'ontrack',
  productive: 'target',
  over: 'over',
}

const HEAT = WORKOUT_TOKENS.heatmap

/** Today's figure fill, `muscleTaxonomy.ts:213` via `WORKOUT_TOKENS.heatmap`. */
const TODAY_FIGURE: Record<UnifiedStatus, { token: string; value: string }> = {
  untrained: { token: 'heatmap.none (literal)', value: HEAT.none },
  behind: { token: 'divergingScale[0] blue-500', value: HEAT.under },
  ontrack: { token: 'divergingScale[1] cyan-300', value: HEAT.maintenance },
  target: { token: 'divergingScale[2] green-200', value: HEAT.productive },
  over: { token: 'divergingScale[4] red-600', value: HEAT.over },
}

/** Today's chip dot, `MuscleGroupChip.tsx:15` via `Pill`'s `dotToneStyles`. */
const TODAY_CHIP: Record<UnifiedStatus, { tone: PillTone; token: ColorToken }> = {
  untrained: { tone: 'neutral', token: 'text-tertiary' },
  behind: { tone: 'brand-secondary', token: 'brand-secondary' },
  ontrack: { tone: 'success', token: 'status-success' },
  target: { tone: 'brand', token: 'brand-primary' },
  over: { tone: 'error', token: 'status-error' },
}

/** The proposal. Existing semantic tokens only — no new hex, no new token. */
const PROPOSED: Record<UnifiedStatus, { tone: PillTone; token: ColorToken }> = {
  untrained: { tone: 'neutral', token: 'text-tertiary' },
  behind: { tone: 'info', token: 'status-info' },
  ontrack: { tone: 'success', token: 'status-success' },
  target: { tone: 'brand', token: 'brand-primary' },
  over: { tone: 'error', token: 'status-error' },
}

/**
 * The zone with no unified counterpart. `getHeatmapColor` swaps `productive` for
 * this whenever intensity >= 0.85, so "nearly at MRV" is a sixth rendered colour
 * that the five-value status vocabulary cannot name.
 */
const ORPHAN_ZONE = { token: 'divergingScale[3] amber-300', value: HEAT.approaching }

const FRONT: BodyMapData[] = [
  { muscleGroup: MuscleGroup.CHEST, intensity: 0.6, volumeStatus: 'productive', weeklySets: 12 },
  {
    muscleGroup: MuscleGroup.FRONT_DELTS,
    intensity: 0.5,
    volumeStatus: 'maintenance',
    weeklySets: 5,
  },
  { muscleGroup: MuscleGroup.BICEPS, intensity: 0.3, volumeStatus: 'under', weeklySets: 3 },
  { muscleGroup: MuscleGroup.ABS, intensity: 0.9, volumeStatus: 'productive', weeklySets: 15 },
  { muscleGroup: MuscleGroup.QUADS, intensity: 1, volumeStatus: 'over', weeklySets: 22 },
]

const BACK: BodyMapData[] = [
  { muscleGroup: MuscleGroup.LATS, intensity: 0.6, volumeStatus: 'productive', weeklySets: 11 },
  {
    muscleGroup: MuscleGroup.UPPER_BACK,
    intensity: 0.45,
    volumeStatus: 'maintenance',
    weeklySets: 8,
  },
  { muscleGroup: MuscleGroup.TRICEPS, intensity: 0.25, volumeStatus: 'under', weeklySets: 3 },
  { muscleGroup: MuscleGroup.GLUTES, intensity: 0.9, volumeStatus: 'productive', weeklySets: 14 },
  { muscleGroup: MuscleGroup.HAMSTRINGS, intensity: 1, volumeStatus: 'over', weeklySets: 18 },
]

// react-native-body-highlighter ships as a CommonJS default export; same interop
// BodyMap.tsx:29 uses, so the clone consumes the identical SVG.
const Body = ((BodyHighlighter as unknown as { default?: typeof BodyHighlighter }).default ??
  BodyHighlighter) as typeof BodyHighlighter

const BODY_SCALE = 0.8
const OUTLINE_FILL = alpha(primitiveColors.white, 0.08)
const OUTLINE_BORDER = alpha(primitiveColors.white, 0.12)
const CHECKER_STEP = 16

/** Build the per-slug fill list with the PROPOSED palette (BodyMap.tsx:75 shape). */
function proposedSlugParts(data: BodyMapData[], mode: ThemeMode): ExtendedBodyPart[] {
  const t = getSemanticColors(mode)
  const bySlug = new Map<string, LandmarkZone>()
  for (const d of data) {
    for (const slug of MUSCLE_TO_SVG_SLUGS[d.muscleGroup] ?? []) {
      const existing = bySlug.get(slug)
      if (!existing || isMoreSevere(d.volumeStatus, existing)) bySlug.set(slug, d.volumeStatus)
    }
  }
  return Array.from(bySlug.entries()).map(([slug, zone]) => ({
    slug: slug as Slug,
    color: t[PROPOSED[ZONE_TO_UNIFIED[zone]].token],
  }))
}

/**
 * Story-local figure clone. `BodyMap` resolves its fills internally through
 * `getHeatmapColor` and takes no colour override, so the proposed row renders
 * the same `react-native-body-highlighter` SVG with the same scale, default fill
 * and border, differing only in the per-slug colour.
 */
function ProposedFigure({
  data,
  view,
  mode,
}: {
  data: BodyMapData[]
  view: 'front' | 'back'
  mode: ThemeMode
}) {
  return (
    <View style={{ width: 200 * BODY_SCALE, gap: 4 }} testID={`proposed-figure-${view}`}>
      <Typography variant="caption" color="tertiary" align="center">
        {view}
      </Typography>
      <Body
        side={view}
        data={proposedSlugParts(data, mode)}
        scale={BODY_SCALE}
        gender="male"
        defaultFill={OUTLINE_FILL}
        border={OUTLINE_BORDER}
      />
    </View>
  )
}

/** A deliberately hostile backdrop, so a fill is judged against tonal range. */
function Checkerboard({ rows, columns, mode }: { rows: number; columns: number; mode: ThemeMode }) {
  const [light, dark] =
    mode === 'light' ? [greyRamp[100], greyRamp[400]] : [greyRamp[700], greyRamp[950]]
  return (
    <View
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: columns }, (_, column) => (
            <View
              key={column}
              style={{
                width: CHECKER_STEP,
                height: CHECKER_STEP,
                backgroundColor: (row + column) % 2 === 0 ? light : dark,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

/**
 * A specimen panel. The patterned backdrop is scoped to the specimen area, so
 * the paint is judged against tonal range while the prose keeps a plane it
 * reads on.
 */
function Panel({
  title,
  note,
  backdrop,
  mode,
  children,
}: {
  title: string
  note: string
  backdrop: DecisionArgs['backdrop']
  mode: ThemeMode
  children: React.ReactNode
}) {
  return (
    <Surface raise={1} className="p-3" style={{ gap: 8, minWidth: 220 }}>
      <Typography variant="microLabel" color="secondary">
        {title}
      </Typography>
      <Typography variant="caption" color="tertiary">
        {note}
      </Typography>
      <View style={{ padding: 10, borderRadius: 10, overflow: 'hidden' }}>
        {backdrop === 'pattern' ? <Checkerboard rows={70} columns={70} mode={mode} /> : null}
        {children}
      </View>
    </Surface>
  )
}

// Fixed, not min: a two-line token name would otherwise shift its column's
// swatches out of line with the column beside it.
const SWATCH_CELL_HEIGHT = 88
const LEGEND_COLUMN_WIDTH = 120

function Swatch({ color, caption, token }: { color: string; caption: string; token: string }) {
  return (
    <View style={{ gap: 3, width: LEGEND_COLUMN_WIDTH, height: SWATCH_CELL_HEIGHT }}>
      <View
        style={{ height: 28, borderRadius: 6, backgroundColor: color }}
        testID={`swatch-${caption}-${token}`}
      />
      <Typography variant="caption" color="tertiary">
        {caption}
      </Typography>
      <Typography variant="mono" color="secondary">
        {token}
      </Typography>
    </View>
  )
}

function LegendColumn({ status, mode }: { status: UnifiedStatus; mode: ThemeMode }) {
  const t = getSemanticColors(mode)
  return (
    <View style={{ gap: 8, width: LEGEND_COLUMN_WIDTH }}>
      <View style={{ minHeight: 46 }}>
        <Typography variant="boldLabel" color="primary">
          {UNIFIED_LABEL[status]}
        </Typography>
        <Typography variant="caption" color="tertiary">
          {UNIFIED_ZONE[status]}
        </Typography>
      </View>
      <Swatch
        color={TODAY_FIGURE[status].value}
        caption="figure today"
        token={TODAY_FIGURE[status].token}
      />
      <Swatch
        color={t[TODAY_CHIP[status].token]}
        caption="chip today"
        token={TODAY_CHIP[status].token}
      />
      <Swatch color={t[PROPOSED[status].token]} caption="proposed" token={PROPOSED[status].token} />
    </View>
  )
}

/** The landmark zone that the five-value status cannot name. */
function OrphanColumn() {
  return (
    <View style={{ gap: 8, width: LEGEND_COLUMN_WIDTH }}>
      <View style={{ minHeight: 46 }}>
        <Typography variant="boldLabel" color="warning">
          approaching
        </Typography>
        <Typography variant="caption" color="tertiary">
          upper MAV-MRV
        </Typography>
      </View>
      <Swatch color={ORPHAN_ZONE.value} caption="figure today" token={ORPHAN_ZONE.token} />
      <Swatch color="transparent" caption="no chip" token="—" />
      <Swatch color="transparent" caption="no counterpart" token="—" />
    </View>
  )
}

function TodayChips() {
  const chipStatus: ChipStatus[] = ['untrained', 'behind', 'ontrack', 'target', 'over']
  return (
    <View style={{ gap: 6 }}>
      {chipStatus.map((status) => (
        <MuscleGroupChip key={status} name={UNIFIED_LABEL[status]} volumeStatus={status} />
      ))}
    </View>
  )
}

/**
 * The proposed chips are the SAME `Pill` primitive `MuscleGroupChip` is a preset
 * over, with the proposed `dotTone`. Every proposed value is an existing
 * `PillTone`, so landing this needs one line changed in `MuscleGroupChip`'s
 * `dotTone` map rather than a new prop.
 */
function ProposedChips() {
  return (
    <View style={{ gap: 6 }}>
      {UNIFIED_ORDER.map((status) => (
        <Pill
          key={status}
          tone="neutral"
          dotTone={PROPOSED[status].tone}
          variant="subtle"
          size="md"
          leading="dot"
          className="gap-1.5"
          textClassName="font-sans font-medium text-text-secondary"
        >
          {UNIFIED_LABEL[status]}
        </Pill>
      ))}
    </View>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Typography variant="h6" color="primary">
        {label}
      </Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{children}</View>
    </View>
  )
}

interface DecisionArgs {
  backdrop: 'pattern' | 'surface'
}

function VolumeStatusPaletteDecision({ backdrop, mode }: DecisionArgs & { mode: ThemeMode }) {
  return (
    <View style={{ padding: 16 }}>
      <Surface
        level="base"
        theme={mode}
        className="p-4"
        style={{ gap: 20 }}
        testID="volume-status-palette"
      >
        <View style={{ gap: 4 }}>
          <Typography variant="h5" color="primary">
            Volume status: two palettes today, one proposed
          </Typography>
          <Typography variant="body2" color="secondary">
            Same muscle, two hues. The figure keys off `VolumeStatus` in muscleTaxonomy.ts:191; the
            chip keys off its own `VolumeStatus` in MuscleGroupChip.tsx:6. Row C is the comparison.
          </Typography>
        </View>

        <Row label="A — today">
          <Panel
            title="figure today"
            note="BodyMap, getHeatmapColor (muscleTaxonomy.ts:213)"
            backdrop={backdrop}
            mode={mode}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <BodyMap data={FRONT} view="front" mode="simple" />
              <BodyMap data={BACK} view="back" mode="simple" />
            </View>
          </Panel>
          <Panel
            title="chips today"
            note="MuscleGroupChip, dotTone map (MuscleGroupChip.tsx:15)"
            backdrop={backdrop}
            mode={mode}
          >
            <TodayChips />
          </Panel>
        </Row>

        <Row label="B — proposed (unified)">
          <Panel
            title="figure proposed"
            note="same SVG, story-local fills — BodyMap takes no colour override"
            backdrop={backdrop}
            mode={mode}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ProposedFigure data={FRONT} view="front" mode={mode} />
              <ProposedFigure data={BACK} view="back" mode={mode} />
            </View>
          </Panel>
          <Panel
            title="chips proposed"
            note="the same Pill primitive, proposed dotTone"
            backdrop={backdrop}
            mode={mode}
          >
            <ProposedChips />
          </Panel>
        </Row>

        <Row label="C — legend: today figure / today chip / proposed">
          <Panel
            title="one status, three palettes"
            note="`approaching` is the landmark zone the five-value status cannot name"
            // Never patterned: every legend swatch is an opaque fill, so a
            // backdrop adds nothing here and costs the token names their contrast.
            backdrop="surface"
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {UNIFIED_ORDER.map((status) => (
                <LegendColumn key={status} status={status} mode={mode} />
              ))}
              <OrphanColumn />
            </View>
          </Panel>
        </Row>
      </Surface>
    </View>
  )
}

/**
 * # Lab / Decisions — unified volume-status palette (VW-333 phase 1, TITAN-E-01)
 *
 * A decision surface, not a component. Nothing here changes a token, a component
 * API or a baseline; it renders today's two palettes beside a proposal so the
 * palette can be approved from pixels rather than a table.
 *
 * ## The defect
 *
 * Two unions, both named `VolumeStatus`, both reachable, overlapping only on
 * `'over'`. The same muscle renders one hue on the figure and a different hue on
 * the chip. `WorkoutCard.tsx:52` already carries a hand-written bridge between
 * them (`under -> behind`, `maintenance -> ontrack`, `productive -> target`),
 * which is the mapping this proposal makes canonical.
 *
 * ## Current mapping — figure (taxonomy B)
 *
 * `muscleTaxonomy.ts:191` declares `under | maintenance | productive | over`;
 * `getHeatmapColor` (`muscleTaxonomy.ts:213`) resolves it through
 * `WORKOUT_TOKENS.heatmap` (`theme/workout-tokens.ts:28`), which is the
 * `divergingScale` primitive (`theme/tokens/primitives.ts:321`).
 *
 * | status | token | hex |
 * | --- | --- | --- |
 * | (no data) | `heatmap.none` — a literal, not a token | `#E0E0E0` |
 * | `under` | `divergingScale[0]` = `blue-500` | `#2196F3` |
 * | `maintenance` | `divergingScale[1]` = `cyan-300` | `#22D3EE` |
 * | `productive` | `divergingScale[2]` = `green-200` | `#58F69E` |
 * | `productive` + intensity >= 0.85 | `divergingScale[3]` = `amber-300` | `#F9B415` |
 * | `over` | `divergingScale[4]` = `red-600` | `#D14343` |
 *
 * Same values back the `VolumeLandmarkBar` fill (`VolumeLandmarkBar.tsx:47`), so
 * the bar is already on the figure's side of the split.
 *
 * ## Current mapping — chip (taxonomy A)
 *
 * `MuscleGroupChip.tsx:6` declares `untrained | behind | ontrack | target | over`
 * and maps each to a `PillTone` (`MuscleGroupChip.tsx:15`); `Pill` resolves the
 * tone to a semantic token (`Pill.tsx:109`). These are className tokens, so they
 * flip with the theme — the hexes below are dark mode.
 *
 * | status | PillTone | token | hex (dark) |
 * | --- | --- | --- | --- |
 * | `untrained` | `neutral` | `text-tertiary` | `#888684` |
 * | `behind` | `brand-secondary` | `brand-secondary` = `cyan-600` | `#307B9B` |
 * | `ontrack` | `success` | `status-success` = `green-300` | `#2ED573` |
 * | `target` | `brand` | `brand-primary` = `orange-400` | `#FF7900` |
 * | `over` | `error` | `status-error` = `red-600` | `#D14343` |
 *
 * ## Proposal — one status, existing tokens only
 *
 * Keep taxonomy A's five members (they match the settled operator legend), and
 * key every surface off this table. All five are existing semantic fill tokens
 * and existing `PillTone`s.
 *
 * | status | landmark zone | token | hex |
 * | --- | --- | --- | --- |
 * | `untrained` | 0 sets logged | `text-tertiary` | `#888684` dark / `#A29F9D` light |
 * | `behind` | below MEV | `status-info` = `blue-500` | `#2196F3` |
 * | `ontrack` | MEV - MAV | `status-success` = `green-300` | `#2ED573` |
 * | `target` | MAV - MRV | `brand-primary` = `orange-400` | `#FF7900` |
 * | `over` | above MRV | `status-error` = `red-600` | `#D14343` |
 *
 * Worst-case deuteranopia/protanopia floor is ΔE 8.3 (`ontrack`/`target`), which
 * clears the repo's categorical floor of 8 (`primitives.test.ts:110`) and beats
 * both palettes it replaces: the figure sits at 7.5 and the chip at 7.4. No new
 * token is needed, so the OPTION clause in the brief does not apply.
 *
 * The chip moves by exactly one tone (`behind`: `brand-secondary` -> `status-info`).
 * Everything else is the figure adopting the chip's palette.
 *
 * ## Open questions for the approver
 *
 * 1. `target` is brand orange while `ontrack` is green. That is the settled
 *    operator legend, but orange between green and red reads as caution to some
 *    viewers. Swapping to green-is-target costs 1.1 ΔE and drops under the
 *    CVD floor (7.2), so the recommendation is to keep the legend order.
 * 2. `approaching` (`productive` at intensity >= 0.85) has no home in a
 *    five-value status. Fold it into `target` and lose the near-MRV warning, or
 *    keep it as a non-hue channel (glow radius, dashed edge)?
 * 3. On the figure, `untrained` currently means "absent from `data`" and paints
 *    the outline fill. Keep that, or paint it `text-tertiary` like the chip dot?
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Volume Status Palette',
  tags: ['autodocs', 'status:lab'],
  argTypes: {
    backdrop: {
      control: 'inline-radio',
      options: ['pattern', 'surface'],
      description:
        'What the panels sit on. `pattern` is the honest case — a fill and its glow over a flat plane always look fine.',
    },
  },
  args: { backdrop: 'pattern' },
}

export default meta
type Story = StoryObj<DecisionArgs>

export const Compare: Story = {
  render: (args, context) => (
    <VolumeStatusPaletteDecision
      {...args}
      mode={context?.globals?.theme === 'light' ? 'light' : 'dark'}
    />
  ),
}
