import { describe, it, expect } from 'vitest'
import { primitiveBreakpoints } from '../../../theme/tokens/primitives'
import {
  PANEL_BREAKPOINTS,
  CARD_WIDTH_BASE,
  CARD_WIDTH_MAX,
  CARD_WIDTH_XL_RATIO,
  CARD_COMPACT_HEIGHT,
  CARD_MIN_CHART_HEIGHT,
  CARD_MAX_CHART_HEIGHT,
  CARD_NATURAL_CHART_HEIGHT,
  CARD_FIXED_CONTENT_HEIGHT,
  CARD_SECTION_GAPS,
  CARD_SECTION_GAP_MIN,
  CARD_SECTION_GAP_MAX,
  HERO_EYEBROW_ALLOWANCE,
  HERO_MIN_PLOT_HEIGHT,
  COMPACT_CHART_HEIGHT,
  COMPACT_CHART_GAP,
  ROM_BAR_HEIGHT_BASE,
  ROM_FILL_SHARE,
  panelTier,
  panelLayout,
  panelBodySplit,
  cardChartHeight,
  cardSectionGap,
  cardSections,
  cardLayoutFor,
  TIER_GAP_XS,
  TIER_GAP_SM,
  TIER_GAP_MD,
  TIER_PADDING_SM,
} from './panel-layout'
import { space } from '../../../theme/tokens/semantic'
import { resolveAll } from '../../../test/spacing-resolver'

describe('panel breakpoints', () => {
  // The edges are titan's, not this component's. If someone re-points the panel at a
  // hand-picked set, this is where it shows up.
  it('are titan primitiveBreakpoints, not values invented here', () => {
    expect(PANEL_BREAKPOINTS).toBe(primitiveBreakpoints)
  })

  it.each([
    [320, 'xs'],
    [599, 'xs'],
    [600, 'sm'],
    [999, 'sm'],
    [1000, 'md'],
    [1199, 'md'],
    [1200, 'lg'],
    [1919, 'lg'],
    [1920, 'xl'],
    [2560, 'xl'],
  ])('puts %ipx in the %s tier', (width, tier) => {
    expect(panelTier(width)).toBe(tier)
  })

  it('treats an unmeasured container as md so the first paint is the row layout', () => {
    expect(panelTier(0)).toBe('md')
    expect(panelLayout(0).stacked).toBe(false)
    expect(panelLayout(0).cardWidth).toBe(CARD_WIDTH_BASE)
  })
})

describe('panelLayout', () => {
  it('stacks below the md edge and rows at or above it', () => {
    expect(panelLayout(PANEL_BREAKPOINTS.md - 1).stacked).toBe(true)
    expect(panelLayout(PANEL_BREAKPOINTS.md).stacked).toBe(false)
  })

  it('holds the shipped padding, gap and card width at md and lg', () => {
    for (const width of [1000, 1200, 1600, 1919]) {
      expect(panelLayout(width)).toMatchObject({
        stacked: false,
        padding: 24,
        gap: TIER_GAP_MD,
        cardWidth: CARD_WIDTH_BASE,
      })
    }
  })

  it('expands the card at wall width without moving the padding or the gap', () => {
    const wall = panelLayout(1920)
    expect(wall.cardWidth).toBe(Math.round(1920 * CARD_WIDTH_XL_RATIO))
    expect(wall.cardWidth).toBeGreaterThan(CARD_WIDTH_BASE)
    // The SPA's stage chrome is derived from these two; moving them would overflow it.
    expect(wall.padding).toBe(24)
    expect(wall.gap).toBe(TIER_GAP_MD)
  })

  it('caps the expansion so the card charts stay near the width they were drawn at', () => {
    expect(panelLayout(4000).cardWidth).toBe(CARD_WIDTH_MAX)
  })

  it('gives a stacked card the full content width', () => {
    const narrow = panelLayout(600)
    expect(narrow.stacked).toBe(true)
    expect(narrow.cardWidth).toBe(600 - narrow.padding * 2)
  })
})

describe('panelBodySplit — one height source', () => {
  // TD-03.60: the hero and the card must not be able to disagree about the body height.
  it('moves BOTH the hero and the card when bodyHeight changes, in the row tiers', () => {
    for (const width of [1000, 1440, 1920]) {
      const layout = panelLayout(width)
      const small = panelBodySplit(800, layout)
      const large = panelBodySplit(1200, layout)
      expect(large.heroHeight).toBeGreaterThan(small.heroHeight)
      expect(large.cardHeight).toBeGreaterThan(small.cardHeight)
    }
  })

  it('gives the row layout the full height to both, less the hero eyebrow', () => {
    const split = panelBodySplit(508, panelLayout(1440))
    expect(split.cardHeight).toBe(508)
    expect(split.heroHeight).toBe(508 - HERO_EYEBROW_ALLOWANCE)
  })

  it('spends the whole stacked height on the two blocks and the gap, nothing lost', () => {
    const layout = panelLayout(700)
    const split = panelBodySplit(900, layout)
    expect(split.heroHeight + HERO_EYEBROW_ALLOWANCE + split.cardHeight + layout.gap).toBe(900)
  })

  // TD-326: the owner's read of the wrapped tiers was that the card was "far too large and
  // heavy compared to the velocity strip (which should be the main item)". Stacked, the card
  // is the fixed compact band and every extra pixel of body goes to the hero.
  it('gives the stacked hero everything above the fixed compact card', () => {
    for (const width of [480, 900]) {
      const layout = panelLayout(width)
      const small = panelBodySplit(560, layout)
      const large = panelBodySplit(900, layout)
      expect(small.cardHeight).toBe(CARD_COMPACT_HEIGHT)
      expect(large.cardHeight).toBe(CARD_COMPACT_HEIGHT)
      expect(large.heroHeight - small.heroHeight).toBe(900 - 560)
    }
  })

  // The Widths story pins the wrapped frames at 640, where the hero is the taller block.
  it('makes the hero the taller block at the wrapped story height', () => {
    for (const width of [599, 601, 999]) {
      const split = panelBodySplit(640, panelLayout(width))
      expect(split.heroHeight).toBeGreaterThan(split.cardHeight)
    }
  })

  it('keeps the stacked hero plot readable rather than flattening it to nothing', () => {
    const split = panelBodySplit(300, panelLayout(480))
    expect(split.heroHeight).toBe(HERO_MIN_PLOT_HEIGHT)
  })

  it('never returns a negative height for a body too short to hold the chrome', () => {
    const split = panelBodySplit(10, panelLayout(700))
    expect(split.heroHeight).toBeGreaterThanOrEqual(0)
    expect(split.cardHeight).toBeGreaterThanOrEqual(0)
  })
})

describe('cardSectionGap — the capped section gap (VW-276)', () => {
  it('gives an unpinned card the floor, the same spacing it carried as a minHeight', () => {
    expect(cardSectionGap(undefined)).toBe(CARD_SECTION_GAP_MIN)
  })

  it('holds the floor on a card with no slack to spend', () => {
    expect(cardSectionGap(CARD_FIXED_CONTENT_HEIGHT + CARD_MIN_CHART_HEIGHT)).toBe(
      CARD_SECTION_GAP_MIN
    )
    expect(cardSectionGap(0)).toBe(CARD_SECTION_GAP_MIN)
  })

  it('grows with the card between the floor and the cap', () => {
    const gaps = [384, 420, 460, 500, 560, 640, 820].map(cardSectionGap)
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThanOrEqual(gaps[i - 1])
    expect(gaps[0]).toBe(CARD_SECTION_GAP_MIN)
    expect(gaps.at(-1)).toBe(CARD_SECTION_GAP_MAX)
  })

  // THE REGRESSION. At the wall's bodyHeight 820 the `flex: 1` spacers split all the
  // leftover height between them — 188px EACH — and the three sections read as three
  // unrelated cards. Drop the cap and this is the number the gap goes back to.
  it('caps the wall-height gap instead of handing it the whole slack', () => {
    const uncapped = Math.floor(
      (820 - CARD_FIXED_CONTENT_HEIGHT - cardChartHeight(820)) / CARD_SECTION_GAPS
    )
    expect(uncapped).toBeGreaterThan(180)
    expect(cardSectionGap(820)).toBe(CARD_SECTION_GAP_MAX)
    expect(cardSectionGap(820)).toBeLessThan(uncapped)
  })

  it('never parts the sections further than the cap, however tall the card gets', () => {
    for (const height of [820, 1080, 1440, 2160]) {
      expect(cardSectionGap(height)).toBe(CARD_SECTION_GAP_MAX)
    }
  })
})

describe('cardLayoutFor — the card arrangement per tier (TD-326)', () => {
  it.each([
    [599, 'compact'],
    [999, 'compact'],
    [1000, 'column'],
    [1919, 'column'],
    [1920, 'fill'],
  ] as const)('arranges the card at %ipx as %s', (width, layout) => {
    expect(panelLayout(width).cardLayout).toBe(layout)
  })

  it('keeps an unmeasured container on the shipped column', () => {
    expect(panelLayout(0).cardLayout).toBe('column')
    expect(cardLayoutFor('md', false)).toBe('column')
  })
})

describe('cardSections — the section heights per arrangement (TD-326)', () => {
  it('holds the shipped column arithmetic at the chosen 1200 frame height', () => {
    expect(cardSections('column', 508)).toEqual({
      romHeight: ROM_BAR_HEIGHT_BASE,
      sparkHeight: cardChartHeight(508),
      gap: cardSectionGap(508),
    })
  })

  it('gives an unpinned card the natural sizes whatever the arrangement', () => {
    for (const layout of ['column', 'fill'] as const) {
      expect(cardSections(layout)).toEqual({
        romHeight: ROM_BAR_HEIGHT_BASE,
        sparkHeight: CARD_NATURAL_CHART_HEIGHT,
        gap: CARD_SECTION_GAP_MIN,
      })
    }
  })

  // THE REGRESSION. The wall card at 820 stopped its spark at the 240 ceiling and its gaps
  // at the 28 cap, so a third of the card sat empty under the last section.
  it('spends the wall card height on the charts instead of a void under the spark', () => {
    const column = cardSections('column', 820)
    const fill = cardSections('fill', 820)
    const spent = (s: typeof fill) =>
      CARD_FIXED_CONTENT_HEIGHT - ROM_BAR_HEIGHT_BASE + s.romHeight + s.sparkHeight + s.gap * 2
    expect(820 - spent(column)).toBeGreaterThan(300)
    expect(820 - spent(fill)).toBe(0)
    expect(fill.gap).toBe(CARD_SECTION_GAP_MAX)
  })

  it('splits the fill leftover between the ROM plot and the spark by ROM_FILL_SHARE', () => {
    const column = cardSections('column', 820)
    const fill = cardSections('fill', 820)
    const slack = fill.romHeight - column.romHeight + (fill.sparkHeight - column.sparkHeight)
    expect(fill.romHeight - column.romHeight).toBe(Math.round(slack * ROM_FILL_SHARE))
    expect(fill.sparkHeight).toBeGreaterThan(fill.romHeight)
  })

  it('gives both compact charts the one small height, whatever the card height', () => {
    for (const height of [undefined, 300, 820]) {
      expect(cardSections('compact', height)).toEqual({
        romHeight: COMPACT_CHART_HEIGHT,
        sparkHeight: COMPACT_CHART_HEIGHT,
        gap: CARD_SECTION_GAP_MIN,
      })
    }
    expect(COMPACT_CHART_HEIGHT).toBeLessThan(CARD_MIN_CHART_HEIGHT)
  })

  it('adds the compact band up from its measured parts', () => {
    expect(CARD_COMPACT_HEIGHT).toBe(274)
    expect(CARD_COMPACT_HEIGHT).toBe(
      (1 + 18) * 2 + 100 + CARD_SECTION_GAP_MIN + COMPACT_CHART_HEIGHT
    )
    expect(COMPACT_CHART_GAP).toBe(space.inline.lg)
  })
})

describe('cardChartHeight', () => {
  it('gives an unpinned card its natural plot height', () => {
    expect(cardChartHeight(undefined)).toBe(CARD_NATURAL_CHART_HEIGHT)
  })

  it('clamps a pinned card between the floor and the ceiling', () => {
    expect(cardChartHeight(100)).toBe(CARD_MIN_CHART_HEIGHT)
    expect(cardChartHeight(5000)).toBe(CARD_MAX_CHART_HEIGHT)
    expect(cardChartHeight(508)).toBe(Math.round(508 * 0.4))
  })
})

/**
 * The tier spacing, pinned (AW-142 wave three).
 *
 * The panel's own padding is an inset and now says so, reading the semantic key rather
 * than repeating 16 and 24. Operator decision 2026-09-14 put `TIER_GAP_SM`, `TIER_GAP_MD`
 * and `TIER_PADDING_SM` on the ramp too (`stack-lg` / `stack-lg` / `inset-lg`); only
 * `TIER_GAP_XS` is still a bare, unsourced literal — this asserts the on-ramp three
 * resolve to their tokens and the fourth holds its shipped pixel.
 */
describe('tier spacing resolves to the spacing tokens', () => {
  it.each([
    ['xs', 320, space.inset.lg],
    ['sm', 800, TIER_PADDING_SM],
    ['md', 1100, space.inset.xl],
    ['lg', 1400, space.inset.xl],
    ['xl', 2000, space.inset.xl],
  ] as const)('reads the %s padding off the inset ramp where a rung exists', (_t, w, padding) => {
    expect(panelLayout(w).padding).toBe(padding)
    expect(resolveAll(['p-inset-lg', 'p-inset-xl'])).toEqual(['16px', '24px'])
  })

  it('holds the four chosen numbers at their post-decision pixels', () => {
    expect([TIER_GAP_XS, TIER_GAP_SM, TIER_GAP_MD, TIER_PADDING_SM]).toEqual([12, 16, 16, 16])
  })

  it('sources the on-ramp gaps and padding from the spacing tokens', () => {
    expect(TIER_GAP_SM).toBe(space.stack.lg)
    expect(TIER_GAP_MD).toBe(space.stack.lg)
    expect(TIER_PADDING_SM).toBe(space.inset.lg)
    expect(resolveAll(['gap-stack-lg', 'p-inset-lg'])).toEqual(['16px', '16px'])
  })

  it('spaces the section gap floor by the stack ramp', () => {
    expect(CARD_SECTION_GAP_MIN).toBe(space.stack.lg)
    expect(resolveAll(['gap-stack-lg'])).toEqual(['16px'])
  })
})
