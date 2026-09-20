/**
 * The chart's PR star and the PR badge's icon are one glyph (titan-0201 round 4, human:
 * "Can we have the PR star used on the chart match the one we use as an icon?"). Both
 * draw STAR_ICON_PATH, so this fails the moment one of them draws something else.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { GoalTrajectoryMini } from './GoalTrajectoryMini'
import { PrBadge } from './PrBadge'
import { ICON_VIEWBOX, STAR_ICON_BOX, STAR_ICON_PATH } from '../../icons'
import { starMark } from './GoalTrajectoryPlot'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const GOAL = S.onTrack.goal!

function badgeStarPath(): string {
  render(<PrBadge type="weight" compact animate={false} />)
  const path = screen.getByTestId('pr-badge-star').querySelector('path')
  return path?.getAttribute('d') ?? ''
}

describe('the PR star', () => {
  it("is the icon's own path on the chart", () => {
    render(<GoalTrajectoryChart {...GOAL} width={360} height={220} status="on_track" />)
    expect(screen.getByTestId('goal-trajectory-chart-pr-star').getAttribute('d')).toBe(
      badgeStarPath()
    )
  })

  it("is the icon's own path on the mini chart", () => {
    render(<GoalTrajectoryMini {...GOAL} width={200} height={64} status="on_track" />)
    expect(screen.getByTestId('goal-trajectory-mini-pr-star').getAttribute('d')).toBe(
      badgeStarPath()
    )
  })

  it('draws no hand-rolled polygon any more', () => {
    const { container } = render(
      <GoalTrajectoryChart {...GOAL} width={360} height={220} status="on_track" />
    )
    expect(container.querySelector('polygon')).toBeNull()
  })

  it('renders at the icon size it is given, centred on the point', () => {
    const size = 20
    const { d, transform } = starMark(100, 50, size)
    expect(d).toBe(STAR_ICON_PATH)
    const scale = Number(/scale\(([-\d.]+)\)/.exec(transform)?.[1])
    expect(scale).toBeCloseTo(size / ICON_VIEWBOX, 6)
    const [, tx, ty] = /^translate\(([-\d.]+) ([-\d.]+)\)/.exec(transform) ?? []
    expect([Number(tx), Number(ty)]).toEqual([100, 50])
    expect(transform).toContain(
      `translate(${String(-(STAR_ICON_BOX.x + STAR_ICON_BOX.width / 2))} ${String(-(STAR_ICON_BOX.y + STAR_ICON_BOX.height / 2))})`
    )
  })

  it.each([
    ['wall', 1920, 340, 20],
    ['phone', 360, 220, 14],
  ])('draws the %s chart star at the badge size the card uses there (%i)', (_n, w, h, size) => {
    render(<GoalTrajectoryChart {...GOAL} width={w} height={h} status="on_track" />)
    const star = screen.getByTestId('goal-trajectory-chart-pr-star')
    const scale = Number(/scale\(([-\d.]+)\)/.exec(star.getAttribute('transform') ?? '')?.[1])
    expect(scale * ICON_VIEWBOX).toBeCloseTo(size, 5)
  })

  it("fills the star with the badge's own colour token", () => {
    // The badge resolves the token to its CSS variable; the chart's palette to its value.
    render(<PrBadge type="weight" compact animate={false} />)
    expect(screen.getByTestId('pr-badge-star').querySelector('svg')?.getAttribute('fill')).toBe(
      'var(--color-brand-primary)'
    )
    render(<GoalTrajectoryChart {...GOAL} width={360} height={220} status="on_track" />)
    expect(screen.getByTestId('goal-trajectory-chart-pr-star').getAttribute('fill')).toBe(
      getSemanticColors('dark')['brand-primary']
    )
  })
})
