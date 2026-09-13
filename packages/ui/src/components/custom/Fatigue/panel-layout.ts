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
 * card-width ratio and its cap, and the stacked height share ARE chosen; each is a single
 * named constant and each is called out in the PR body.
 */
import { primitiveBreakpoints } from '../../../theme/tokens/primitives'

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

/**
 * CHOSEN. Stacked, the CARD takes the larger share of the one body height. Its sections
 * have hard floors — the verdict hero, the three lights, the ROM chart and the ghost spark —
 * while the velocity hero is a bar plot that scales continuously, so squeezing the hero
 * degrades gracefully and squeezing the card overflows it.
 */
export const CARD_HEIGHT_SHARE_STACKED = 0.55

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

/**
 * MEASURED, not chosen: everything in the card that is not the ghost-spark plot — the 18px
 * padding top and bottom, the verdict hero, the three lights, the two 16px minimum spacers
 * and the ROM chart. Taken from the rendered card in Storybook (`scrollHeight` 384 at the
 * {@link CARD_MIN_CHART_HEIGHT} floor), so a change to those sections needs re-measuring.
 */
export const CARD_CHROME_HEIGHT = 216

/**
 * The shortest a stacked card can be drawn without its content spilling past the rounded
 * edge. Before this floor existed, an `xs` panel at `bodyHeight` 560 gave the card 301px
 * against a 384px content height and the ghost spark rendered outside the card.
 */
export const CARD_MIN_HEIGHT_STACKED = CARD_CHROME_HEIGHT + CARD_MIN_CHART_HEIGHT

/** Padding and column gap per tier. `md` and up hold today's values exactly. */
const TIER_SPACING: Record<PanelTier, { padding: number; gap: number }> = {
  xs: { padding: 16, gap: 12 },
  sm: { padding: 20, gap: 14 },
  md: { padding: 24, gap: 18 },
  lg: { padding: 24, gap: 18 },
  xl: { padding: 24, gap: 18 },
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
  return { tier, stacked, padding, gap, cardWidth }
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
 * take the full height; stacked they share it by {@link CARD_HEIGHT_SHARE_STACKED} with the
 * gap taken out first, and neither drops below its floor. Either way both numbers come from
 * this one call, so changing `bodyHeight` moves both or neither.
 */
export function panelBodySplit(bodyHeight: number, layout: PanelLayout): PanelBodySplit {
  if (!layout.stacked) {
    return {
      heroHeight: Math.max(0, bodyHeight - HERO_EYEBROW_ALLOWANCE),
      cardHeight: Math.max(0, bodyHeight),
    }
  }
  const usable = Math.max(0, bodyHeight - layout.gap)
  const cardHeight = Math.max(
    CARD_MIN_HEIGHT_STACKED,
    Math.round(usable * CARD_HEIGHT_SHARE_STACKED)
  )
  return {
    heroHeight: Math.max(HERO_MIN_PLOT_HEIGHT, usable - cardHeight - HERO_EYEBROW_ALLOWANCE),
    cardHeight,
  }
}
