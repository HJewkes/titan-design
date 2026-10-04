import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { expectBoundedMount } from '../../../../test/scale'
import { categoricalPalette } from '../../../../theme/tokens/primitives'
import { byName, lineFixtures } from './fixtures'
import { cleanSeries, projectSeries } from './line-chart-model'
import { LineChart } from './LineChart'
import type { LineChartProps, LineSeries } from './types'

expect.extend(toHaveNoViolations)

const WIDTH = 640
const HEIGHT = 320
/** The `tight` density row and edge pad a 640 px chart lays out with. */
const Y_GUTTER = 44
const EDGE_PAD = 16

function fixtureProps(name: string): LineChartProps {
  const { series, xScale, metricLabel, unit, includeZero, referenceLines, boundaries } =
    byName(name)
  return {
    series,
    xScale,
    metricLabel,
    unit,
    includeZero,
    referenceLines,
    boundaries,
    width: WIDTH,
    height: HEIGHT,
    animate: false,
  }
}

const renderFixture = (name: string, extra: Partial<LineChartProps> = {}) =>
  render(<LineChart {...fixtureProps(name)} {...extra} />)

const points = (id: string, values: (number | null)[]) =>
  values.map((y, x) => ({
    id: `${id}@${String(x)}`,
    x,
    y,
    ...(y === null ? { missing: 'not-measured' } : {}),
  }))

const TWO_SERIES: LineSeries[] = [
  { id: 'alpha', label: 'Alpha', points: points('alpha', [10, 12, null, 18]) },
  { id: 'beta', label: 'Beta', points: points('beta', [4, 6, 5, 9]) },
]

const renderTwoSeries = (extra: Partial<LineChartProps> = {}) =>
  render(
    <LineChart
      series={TWO_SERIES}
      xScale="linear"
      metricLabel="Requests"
      unit="rps"
      width={WIDTH}
      height={HEIGHT}
      animate={false}
      {...extra}
    />
  )

const target = () => screen.getByTestId('line-chart-points')

const press = (key: string) => fireEvent.keyDown(target(), { key })

/** The accessible name of the node `aria-activedescendant` points at, or null with none active. */
function announced(): string | null {
  const id = target().getAttribute('aria-activedescendant')
  return id ? (document.getElementById(id)?.getAttribute('aria-label') ?? null) : null
}

const all = (container: HTMLElement, testId: string) =>
  Array.from(container.querySelectorAll(`[data-testid="${testId}"]`))

function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  )
}

beforeEach(() => {
  // Frames never run, so an entrance that starts stays on its first frame.
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  stubReducedMotion(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LineChart keyboard', () => {
  it('has exactly one tab stop', () => {
    const { container } = renderFixture('Real history')
    const stops = container.querySelectorAll('[tabindex="0"]')
    expect(stops).toHaveLength(1)
    expect(stops[0]).toBe(target())
    expect(container.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(1)
  })

  it('names nothing until a key enters the points', () => {
    renderTwoSeries()
    expect(announced()).toBeNull()
    expect(screen.queryByTestId('line-chart-active-point')).toBeNull()
  })

  it('moves the active point and its announced name with each key', () => {
    renderTwoSeries()
    press('ArrowRight')
    expect(announced()).toBe('Alpha, 0, 10 rps')
    press('ArrowRight')
    expect(announced()).toBe('Alpha, 1, 12 rps')
    press('ArrowDown')
    expect(announced()).toBe('Beta, 1, 6 rps')
    press('End')
    expect(announced()).toBe('Beta, 3, 9 rps')
    press('ArrowRight')
    expect(announced()).toBe('Beta, 3, 9 rps')
    press('ArrowUp')
    expect(announced()).toBe('Alpha, 3, 18 rps')
    press('Home')
    expect(announced()).toBe('Alpha, 0, 10 rps')
    press('ArrowLeft')
    expect(announced()).toBe('Alpha, 0, 10 rps')
  })

  it('reaches a gap and reads why it has no value', () => {
    renderTwoSeries({ defaultActivePointId: 'alpha@1' })
    press('ArrowRight')
    expect(announced()).toBe('Alpha, 2, no value: not-measured')
    expect(screen.queryByTestId('line-chart-active-marker')).toBeNull()
  })

  it('clears the active point on Escape', () => {
    renderTwoSeries({ defaultActivePointId: 'beta@2' })
    expect(announced()).toBe('Beta, 2, 5 rps')
    press('Escape')
    expect(target().hasAttribute('aria-activedescendant')).toBe(false)
    expect(screen.queryByTestId('line-chart-readout')).toBeNull()
  })

  it('shows the readout and the marker for the active point', () => {
    renderTwoSeries({ defaultActivePointId: 'beta@2' })
    expect(screen.getByTestId('line-chart-readout').textContent).toContain('Beta · 2')
    expect(screen.getByTestId('line-chart-readout').textContent).toContain('5 rps')
    expect(screen.getByTestId('line-chart-active-marker')).toBeTruthy()
  })

  it.each(['Enter', ' '])('presses the active point once on "%s"', (key) => {
    const onPointPress = vi.fn()
    renderTwoSeries({ onPointPress, defaultActivePointId: 'beta@1' })
    press(key)
    expect(onPointPress).toHaveBeenCalledTimes(1)
    expect(onPointPress).toHaveBeenCalledWith(TWO_SERIES[1]?.points[1], TWO_SERIES[1])
  })

  it('presses nothing with no active point', () => {
    const onPointPress = vi.fn()
    renderTwoSeries({ onPointPress })
    press('Enter')
    expect(onPointPress).not.toHaveBeenCalled()
  })

  it('lets Tab leave: the key is not handled and the active point stays', () => {
    renderTwoSeries({ defaultActivePointId: 'alpha@1' })
    const notPrevented = press('Tab')
    expect(notPrevented).toBe(true)
    expect(announced()).toBe('Alpha, 1, 12 rps')
    expect(press('ArrowRight')).toBe(false)
  })

  it('follows a controlled active point and reports the key without moving', () => {
    const onActivePointChange = vi.fn()
    renderTwoSeries({ activePointId: 'alpha@0', onActivePointChange })
    press('ArrowRight')
    expect(onActivePointChange).toHaveBeenCalledWith('alpha@1')
    expect(announced()).toBe('Alpha, 0, 10 rps')
  })

  it('activates the nearest point under the pointer and clears it on leave', () => {
    renderTwoSeries()
    // jsdom has no PointerEvent, so a MouseEvent carries the coordinates.
    fireEvent(target(), new MouseEvent('pointermove', { bubbles: true, clientX: 0, clientY: 0 }))
    expect(announced()).toBe('Alpha, 0, 10 rps')
    fireEvent.pointerLeave(target())
    expect(announced()).toBeNull()
  })

  it('keeps the active point when the pointer leaves a focused chart', () => {
    renderTwoSeries({ defaultActivePointId: 'beta@2' })
    act(() => target().focus())
    fireEvent.pointerLeave(target())
    expect(announced()).toBe('Beta, 2, 5 rps')
  })
})

describe('LineChart states', () => {
  it('shows the placeholder, with no axes and no tab stop, for the Empty fixture', () => {
    const { container } = renderFixture('Empty')
    expect(screen.getByTestId('line-chart-empty').textContent).toContain('No data')
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
  })

  it('shows the placeholder when every value is NaN', () => {
    const allNaN = byName('NaN').series.filter((s) => s.id === 'b')
    const { container } = renderFixture('NaN', { series: allNaN })
    expect(screen.getByTestId('line-chart-empty')).toBeTruthy()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders a consumer emptyState in place of the default message', () => {
    renderFixture('Empty', { emptyState: <span>Nothing measured</span> })
    expect(screen.getByTestId('line-chart-empty').textContent).toBe('Nothing measured')
  })

  it('shows a named Skeleton of the chart size while loading', () => {
    const { container } = renderFixture('Default', { isLoading: true })
    const skeleton = screen.getByRole('progressbar', { name: 'Loading Lines of code' })
    expect(skeleton.style.width).toBe(`${String(WIDTH)}px`)
    expect(skeleton.style.height).toBe(`${String(HEIGHT)}px`)
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.queryByTestId('line-chart-points')).toBeNull()
  })

  it('draws one point as a dot and no path', () => {
    const { container } = renderFixture('One point')
    expect(all(container, 'line-chart-dot')).toHaveLength(1)
    expect(container.querySelectorAll('path')).toHaveLength(0)
  })

  it('names the image by the summary, with a long label in full', () => {
    renderFixture('Hostile')
    const name = screen.getByRole('img', { name: /^Hostile\./ }).getAttribute('aria-label')
    expect(name).toContain('A series label that runs on to forty chars')
  })
})

describe('LineChart rules and gutter', () => {
  const gridlineEnd = (container: HTMLElement) =>
    Number(all(container, 'line-chart-gridline')[0]?.getAttribute('x2'))

  it('draws no reference rule and reserves no label gutter without a reference line', () => {
    const { container } = renderFixture('Missing baseline', { showLegend: true })
    expect(all(container, 'line-chart-reference')).toHaveLength(0)
    expect(all(container, 'line-chart-reference-label')).toHaveLength(0)
    expect(gridlineEnd(container)).toBe(WIDTH - Y_GUTTER - EDGE_PAD)
  })

  it('draws the rule and its label in a reserved gutter when a reference line is given', () => {
    const { container } = renderFixture('Default', { showLegend: true })
    expect(all(container, 'line-chart-reference')).toHaveLength(1)
    expect(screen.getByTestId('line-chart-reference-label').textContent).toBe('Budget')
    expect(gridlineEnd(container)).toBeLessThan(WIDTH - Y_GUTTER - EDGE_PAD)
  })

  it('draws a labelled boundary rule at an index change and breaks the line there', () => {
    const { container } = renderFixture('Index change')
    expect(all(container, 'line-chart-boundary')).toHaveLength(1)
    expect(screen.getByTestId('line-chart-boundary-label').textContent).toBe('Index 0.15.0')
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })

  it('labels each series at its end, or in a legend when asked', () => {
    const { unmount } = renderFixture('Real history')
    const ends = screen.getAllByTestId('line-chart-end-label').map((node) => node.textContent)
    expect([...ends].sort()).toEqual(['Package A', 'Package B', 'Total'])
    expect(screen.queryByTestId('line-chart-legend')).toBeNull()
    unmount()
    renderFixture('Real history', { showLegend: true })
    expect(screen.queryAllByTestId('line-chart-end-label')).toHaveLength(0)
    expect(screen.getByTestId('line-chart-legend').textContent).toBe('TotalPackage APackage B')
  })

  it('has ticks on a normal domain, and paints a label for them', () => {
    const { series, xScale, referenceLines } = byName('Default')
    const geometry = projectSeries(series.map(cleanSeries), {
      width: 480,
      height: 280,
      xScale,
      referenceLines,
    })
    expect(geometry.xTicks.length).toBeGreaterThan(0)
    expect(geometry.yTicks.length).toBeGreaterThan(0)
    const { container } = renderFixture('Default')
    expect(all(container, 'line-chart-gridline').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('line-chart-x-label').length).toBeGreaterThan(0)
  })
})

describe('LineChart scale', () => {
  const veryLarge = (extra: Partial<LineChartProps> = {}) => (
    <LineChart {...fixtureProps('Very large')} width={360} {...extra} />
  )

  it('mounts one path for the one segment of 2,000 points at 360 px', () => {
    expectBoundedMount({ render: () => veryLarge(), selector: 'path', max: 1 })
  })

  it('mounts at most one point marker for 2,000 points', () => {
    expectBoundedMount({
      render: () => veryLarge({ defaultActivePointId: 'signal@1234' }),
      selector: 'circle',
      max: 1,
    })
  })
})

describe('LineChart colour', () => {
  const sixSeries = byName('Many series').series.slice(0, 6)

  it('strokes the series with categoricalPalette.default, in order', () => {
    const { container } = renderFixture('Many series', { series: sixSeries })
    const strokes = Array.from(container.querySelectorAll('path')).map((path) =>
      path.getAttribute('stroke')
    )
    expect(strokes).toEqual(categoricalPalette.default.slice(0, 6))
  })

  it('uses no superseded data-* colour class or value', () => {
    const { container } = renderFixture('Many series', { series: sixSeries, showLegend: true })
    expect(container.innerHTML).not.toMatch(/data-\d|color-data/)
  })
})

describe('LineChart entrance', () => {
  const dashOffsets = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('path')).map((path) => path.style.strokeDashoffset)

  it('starts the draw from its first frame when animated', () => {
    const { container } = renderFixture('Default', { animate: true })
    expect(dashOffsets(container)).toEqual(['1'])
  })

  it('renders the final frame with animate={false}', () => {
    const { container } = renderFixture('Default', { animate: false })
    expect(dashOffsets(container)).toEqual([''])
  })

  it('renders the final frame under reduced motion', () => {
    stubReducedMotion(true)
    const { container } = renderFixture('Default', { animate: true })
    expect(dashOffsets(container)).toEqual([''])
  })
})

describe('LineChart accessibility', () => {
  it.each(lineFixtures.map((fixture) => fixture.name))(
    'has no violations on the %s fixture',
    async (name) => {
      const { container } = renderFixture(name)
      expect(await axe(container)).toHaveNoViolations()
    }
  )

  it.each<[string, Partial<LineChartProps>]>([
    ['loading', { isLoading: true }],
    ['legend', { showLegend: true }],
    ['active point', { defaultActivePointId: 'package-a@3' }],
    ['animated', { animate: true }],
  ])('has no violations in the %s state', async (_state, extra) => {
    const { container } = renderFixture('Real history', extra)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no violations on a gap that is the active point', async () => {
    const { container } = renderTwoSeries({ defaultActivePointId: 'alpha@2' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
