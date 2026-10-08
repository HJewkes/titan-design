/**
 * The {@link LiveFatiguePanel}'s responsive layout, as one pure function (TD-03.58).
 *
 * The panel is container-responsive, not prop-sized (SIZE-D01): it measures its own width
 * in `onLayout` and feeds it here. Everything the two columns need — whether they stack,
 * the padding, the gap, the card's width, and the split of the ONE body height — comes out
 * of this one call, so the hero and the card cannot disagree about any of it.
 *
 * Pure, with no `react-native` import, so the breakpoint behaviour is unit-testable
 * without `onLayout` (which never fires under jsdom).
 *
 * SOURCED vs CHOSEN. The breakpoint edges are titan's own `primitiveBreakpoints` — not
 * invented here. The per-tier padding/gap/card numbers below the `md` edge, the `xl`
 * card-width ratio and its cap, the compact chart height and the fill share ARE chosen;
 * each is a single named constant and each is called out in the PR body.
 */
import { primitiveBreakpoints } from '../../../theme/tokens/primitives'
import { space } from '../../../theme/tokens/semantic'

/** titan's breakpoint scale, re-exported as the panel's tier edges. Sourced, not chosen. */
export const PANEL_BREAKPOINTS = primitiveBreakpoints

export type PanelTier = keyof typeof PANEL_BREAKPOINTS

/**
 * The `md` edge (1000) is where the two columns fit side by side: the card's own default
 * 318 plus the hero's usable minimum plus the padding and gap. Below it they stack.
 */
const ROW_TIER_MIN = PANEL_BREAKPOINTS.md

/**
 * The tier for a measured container width. An unmeasured container (0, before the first
 * `onLayout`) resolves to `md` — today's side-by-side geometry — so the first paint matches
 * what the panel has always rendered rather than flashing a stacked layout.
 */
export function panelTier(width: number): PanelTier {
  if (width <= 0) return 'md'
  if (width >= PANEL_BREAKPOINTS.xl) return 'xl'
  if (width >= PANEL_BREAKPOINTS.lg) return 'lg'
  if (width >= PANEL_BREAKPOINTS.md) return 'md'
  if (width >= PANEL_BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

/** titan's long-standing card column width, and the floor every wider tier clamps to. */
export const CARD_WIDTH_BASE = 318

/**
 * CHOSEN. At wall width a 318px card is ~17% of the content row against ~34% at the `md`
 * edge, so it reads as a sliver beside the hero. 0.22 pulls it back toward the `md`
 * proportion without letting the hero lose its lead.
 */
export const CARD_WIDTH_XL_RATIO = 0.22

/**
 * CHOSEN. The cap. The card's internal charts (`RomProgressionChart`, `GhostSpark`) were
 * drawn around ~318 and go sparse rather than richer past roughly 1.5x that, so the
 * expansion stops at 460 (reached at 2091px) instead of tracking the container forever.
 */
export const CARD_WIDTH_MAX = 460

/** What the hero reserves above its plot for the `VELOCITY · this set` eyebrow, px. */
export const HERO_EYEBROW_ALLOWANCE = 26

// --- the card's own height arithmetic ------------------------------------------------
// It lives here rather than inside LiveFatigueCard so the panel can reason about the card's
// floor without importing a component (this module stays react-native-free and testable).

/** Floor for the ghost-spark plot inside the card, px. */
export const CARD_MIN_CHART_HEIGHT = 168
/** Ceiling for the ghost-spark plot inside the card, px. */
export const CARD_MAX_CHART_HEIGHT = 240
/** Share of a pinned card height the ghost-spark plot takes, before the clamp. */
export const CARD_CHART_HEIGHT_RATIO = 0.4
/** What an unpinned card gives the ghost-spark plot, px. */
export const CARD_NATURAL_CHART_HEIGHT = 172

/** The ghost-spark plot height for a card height, or the natural height when unpinned. */
export function cardChartHeight(cardHeight?: number): number {
  if (cardHeight == null) return CARD_NATURAL_CHART_HEIGHT
  const scaled = cardHeight * CARD_CHART_HEIGHT_RATIO
  return Math.round(Math.min(CARD_MAX_CHART_HEIGHT, Math.max(CARD_MIN_CHART_HEIGHT, scaled)))
}

/** How many gaps the card's three sections are separated by. */
export const CARD_SECTION_GAPS = 2

/**
 * MEASURED. Everything in the card that is neither a section gap nor the ghost-spark plot:
 * the 18px padding top and bottom, the verdict hero + three lights (122.5) and the ROM chart
 * (44). Read off the rendered card in Storybook at `height` 820, so a change to those
 * sections needs re-measuring — same contract as {@link CARD_COMPACT_HEIGHT}.
 */
export const CARD_FIXED_CONTENT_HEIGHT = 203

/**
 * SOURCED. `space.stack.lg` — the vertical rung between sibling blocks, which is what
 * these gaps are. The floor the two section gaps used to carry as `minHeight`, kept so a
 * short card is spaced exactly as it is today.
 */
export const CARD_SECTION_GAP_MIN = space.stack.lg

/**
 * CHOSEN (VW-276). The cap, and the point of this function.
 *
 * The gaps used to be `flex: 1`, so every pixel the card was given beyond its content went
 * into them: at the wall's `bodyHeight` 820 that is 188px EACH, and the three sections read
 * as three unrelated cards rather than one. A gap has to stay legible as a separator, not
 * become a void, so it stops at `primitiveSpacing[7]` — one step above the card's own 18px
 * edge inset and a little over 2x the 12px gap inside the top group, which is enough to part
 * the sections while keeping them one read. Past the cap the leftover height collects below
 * the last section, where ONE void at the edge of the card costs nothing, instead of being
 * split into two voids that break the chain mid-read.
 */
export const CARD_SECTION_GAP_MAX = 28

/**
 * The gap between the card's three sections for a card height — content-driven, not
 * slack-driven. The leftover after the plot and the fixed sections is split across the gaps
 * and then clamped, so the gap grows with the card only until {@link CARD_SECTION_GAP_MAX}.
 */
export function cardSectionGap(cardHeight?: number): number {
  if (cardHeight == null) return CARD_SECTION_GAP_MIN
  const slack = cardHeight - CARD_FIXED_CONTENT_HEIGHT - cardChartHeight(cardHeight)
  const perGap = Math.floor(slack / CARD_SECTION_GAPS)
  return Math.min(CARD_SECTION_GAP_MAX, Math.max(CARD_SECTION_GAP_MIN, perGap))
}

// --- the card's arrangement per tier (TD-326) ------------------------------------------

/**
 * How the card lays its sections out.
 *
 * - `column`: the verdict group, the ROM chart and the ghost spark top to bottom, the
 *   leftover past the capped gaps collecting below the last section (VW-276).
 * - `fill`: the column, with that leftover spent on the two charts instead — the wall
 *   card at `bodyHeight` 820 left a third of its height empty under the spark.
 * - `compact`: the wrapped tiers. The verdict and the lights share one row and the two
 *   charts sit side by side at one small height, so the card is a band under the velocity
 *   hero rather than the taller of the two.
 */
export type CardLayout = 'column' | 'fill' | 'compact'

/** The ROM progression plot's own default height, px — `RomProgressionChart`'s `barHeight`. */
export const ROM_BAR_HEIGHT_BASE = 44

/**
 * CHOSEN (TD-326). The share of a `fill` card's leftover height the ROM plot takes; the
 * ghost spark takes the rest. The spark is the richer read (one curve per rep, the tempo
 * band under it), so it grows faster, while 0.4 lifts the ROM bars from a 44px strip to a
 * plot that echoes the velocity hero beside the card.
 */
export const ROM_FILL_SHARE = 0.4

/**
 * CHOSEN (TD-326). The one height both side-by-side charts share in a `compact` card. The
 * spark's floor is {@link CARD_MIN_CHART_HEIGHT}; the owner's read of the wrapped tiers
 * was that the card was "far too large and heavy compared to the velocity strip", so the
 * compact charts sit well under that floor, at 0.7 of it (rounded to the 4px grid).
 */
export const COMPACT_CHART_HEIGHT = 120

/** SOURCED. The column gap between the two compact charts, `space.inline.lg`. */
export const COMPACT_CHART_GAP = space.inline.lg

/**
 * MEASURED (TD-326). A `compact` card's height: the 1px edge and the 18px padding top and
 * bottom, the verdict row (100: the verdict hero, which now carries the lights beside its
 * word), the one {@link CARD_SECTION_GAP_MIN} gap and the {@link COMPACT_CHART_HEIGHT} chart
 * row. Read off the rendered card in Storybook at 599, 601 and 999 wide (274); a change to
 * the verdict hero or to the chart height needs re-measuring, same contract as
 * {@link CARD_FIXED_CONTENT_HEIGHT}. The card takes it as a `minHeight`, so a band too
 * narrow for the lights beside the word grows instead of clipping its charts.
 */
export const CARD_COMPACT_HEIGHT = (1 + 18) * 2 + 100 + CARD_SECTION_GAP_MIN + COMPACT_CHART_HEIGHT

/** The height of each card section for a {@link CardLayout}, from {@link cardSections}. */
export interface CardSections {
  /** Height of the ROM progression bar plot, px. */
  romHeight: number
  /** Height of the ghost-spark plot, px. */
  sparkHeight: number
  /** Gap between the card's sections, px. */
  gap: number
}

/** A `fill` card's leftover below the last section, after the capped gaps and the base plots. */
function fillSlack(cardHeight: number, sparkHeight: number, gap: number): number {
  const spent = CARD_FIXED_CONTENT_HEIGHT + sparkHeight + gap * CARD_SECTION_GAPS
  return Math.max(0, cardHeight - spent)
}

/**
 * The height of each card section for a layout and a card height. `column` is the shipped
 * arithmetic; `fill` hands the leftover to the charts by {@link ROM_FILL_SHARE}; `compact`
 * ignores the card height, since the compact card is a fixed band.
 */
export function cardSections(layout: CardLayout, cardHeight?: number): CardSections {
  if (layout === 'compact') {
    return {
      romHeight: COMPACT_CHART_HEIGHT,
      sparkHeight: COMPACT_CHART_HEIGHT,
      gap: CARD_SECTION_GAP_MIN,
    }
  }
  const gap = cardSectionGap(cardHeight)
  const sparkHeight = cardChartHeight(cardHeight)
  if (layout === 'column' || cardHeight == null) {
    return { romHeight: ROM_BAR_HEIGHT_BASE, sparkHeight, gap }
  }
  const slack = fillSlack(cardHeight, sparkHeight, gap)
  const romExtra = Math.round(slack * ROM_FILL_SHARE)
  return {
    romHeight: ROM_BAR_HEIGHT_BASE + romExtra,
    sparkHeight: sparkHeight + slack - romExtra,
    gap,
  }
}

/** The card arrangement for a tier: a band when the panel wraps, filled at the wall. */
export function cardLayoutFor(tier: PanelTier, stacked: boolean): CardLayout {
  if (stacked) return 'compact'
  return tier === 'xl' ? 'fill' : 'column'
}

/**
 * Operator decision 2026-09-14 (AW-142 wave three): the on-ramp rungs, no measured
 * dependents. `TIER_GAP_SM` and `TIER_GAP_MD` both round to `stack-lg` (16), and
 * `TIER_PADDING_SM` rounds to `inset-lg` (16) — `stack` for the gaps and `inset` for the
 * padding, matching the family each already reasons in. The panel gap is a COLUMN gap at
 * `md` and up and a ROW gap below it, so no single situational key covers it honestly —
 * `inline` would name the stacked case wrong and `stack` the side-by-side case wrong;
 * `stack` was picked for consistency with {@link CARD_SECTION_GAP_MIN} above. `TIER_GAP_XS`
 * stays a literal — see the comment on it.
 *
 * Rounding `TIER_GAP_MD` (was 18) down to 16 does NOT touch the card: `LiveFatigueCard`'s
 * `PAD` stays 18 by a separate operator decision (its own comment), so
 * {@link CARD_FIXED_CONTENT_HEIGHT} and {@link CARD_COMPACT_HEIGHT}, both MEASURED off the
 * rendered card, are unaffected.
 */
// stack ramp is 4/8/16/24; 12 kept as the xs-tier gap pending AW-121's Fatigue re-measure
export const TIER_GAP_XS = 12
export const TIER_PADDING_SM = space.inset.lg
export const TIER_GAP_SM = space.stack.lg
export const TIER_GAP_MD = space.stack.lg

/** Padding and column gap per tier. `md` and up hold today's values exactly. */
const TIER_SPACING: Record<PanelTier, { padding: number; gap: number }> = {
  xs: { padding: space.inset.lg, gap: TIER_GAP_XS },
  sm: { padding: TIER_PADDING_SM, gap: TIER_GAP_SM },
  md: { padding: space.inset.xl, gap: TIER_GAP_MD },
  lg: { padding: space.inset.xl, gap: TIER_GAP_MD },
  xl: { padding: space.inset.xl, gap: TIER_GAP_MD },
}

export interface PanelLayout {
  tier: PanelTier
  /** Card below the hero rather than beside it. */
  stacked: boolean
  /** Uniform padding around the body row, px. */
  padding: number
  /** Gap between the hero and the card, px — column gap when row, row gap when stacked. */
  gap: number
  /**
   * Card width, px. Stacked, this is the full content width, so the card takes a real
   * number rather than needing a second `onLayout` of its own to size its charts.
   */
  cardWidth: number
  /** How the card arranges its sections at this tier. */
  cardLayout: CardLayout
}

/** The card column width for a row tier, before any explicit `cardWidth` override. */
function rowCardWidth(tier: PanelTier, width: number): number {
  if (tier !== 'xl') return CARD_WIDTH_BASE
  const fluid = Math.round(width * CARD_WIDTH_XL_RATIO)
  return Math.min(CARD_WIDTH_MAX, Math.max(CARD_WIDTH_BASE, fluid))
}

/** The whole layout for a measured container width. */
export function panelLayout(width: number): PanelLayout {
  const tier = panelTier(width)
  const { padding, gap } = TIER_SPACING[tier]
  const stacked = width > 0 && width < ROW_TIER_MIN
  const cardWidth = stacked
    ? Math.max(0, Math.round(width - padding * 2))
    : rowCardWidth(tier, width)
  return { tier, stacked, padding, gap, cardWidth, cardLayout: cardLayoutFor(tier, stacked) }
}

export interface PanelBodySplit {
  /** Height handed to the velocity hero's plot, px. */
  heroHeight: number
  /** Height handed to the fatigue card, px. */
  cardHeight: number
}

/**
 * CHOSEN. The shortest the velocity plot is still worth drawing. Below this the bars stop
 * being readable across a room, so the stacked panel grows past `bodyHeight` rather than
 * flattening the hero any further.
 */
export const HERO_MIN_PLOT_HEIGHT = 140

/**
 * The ONE body height split across the hero and the card (TD-03.60). Side by side both
 * take the full height. Stacked, the card is the fixed {@link CARD_COMPACT_HEIGHT} band and
 * the hero takes everything else above its floor (TD-326: the velocity strip is the main
 * item, so extra height goes to it, never to the card). Either way both numbers come from
 * this one call, so the two cannot disagree about the body.
 */
export function panelBodySplit(bodyHeight: number, layout: PanelLayout): PanelBodySplit {
  if (!layout.stacked) {
    return {
      heroHeight: Math.max(0, bodyHeight - HERO_EYEBROW_ALLOWANCE),
      cardHeight: Math.max(0, bodyHeight),
    }
  }
  const usable = Math.max(0, bodyHeight - layout.gap)
  const cardHeight = CARD_COMPACT_HEIGHT
  return {
    heroHeight: Math.max(HERO_MIN_PLOT_HEIGHT, usable - cardHeight - HERO_EYEBROW_ALLOWANCE),
    cardHeight,
  }
}
