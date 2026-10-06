import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { byName } from './fixtures'
import { useLineChart, type UseLineChartOptions } from './useLineChart'

const twoPoints = byName('Two points')

function renderLineChart(overrides: Partial<UseLineChartOptions> = {}) {
  const initialProps: UseLineChartOptions = {
    series: twoPoints.series,
    width: 360,
    height: 180,
    metricLabel: twoPoints.metricLabel,
    ...overrides,
  }
  return renderHook((props: UseLineChartOptions) => useLineChart(props), { initialProps })
}

describe('useLineChart', () => {
  it('moves its own active point and reports it when uncontrolled', () => {
    const onActivePointChange = vi.fn()
    const { result } = renderLineChart({ defaultActivePointId: 'total@16', onActivePointChange })

    let handled = false
    act(() => {
      handled = result.current.handleKey('ArrowRight')
    })

    expect(handled).toBe(true)
    expect(result.current.activePointId).toBe('total@17')
    expect(result.current.activePoint?.point.y).toBe(60490)
    expect(onActivePointChange).toHaveBeenCalledWith('total@17')
  })

  it('calls onActivePointChange without moving when activePointId is controlled', () => {
    const onActivePointChange = vi.fn()
    const { result } = renderLineChart({ activePointId: 'total@16', onActivePointChange })

    act(() => {
      result.current.handleKey('ArrowRight')
    })

    expect(onActivePointChange).toHaveBeenCalledWith('total@17')
    expect(result.current.activePointId).toBe('total@16')
  })

  it('follows a controlled activePointId, and null clears it', () => {
    const { result, rerender } = renderLineChart({ activePointId: 'total@16' })
    rerender({ ...baseProps(), activePointId: 'total@17' })
    expect(result.current.activePointId).toBe('total@17')
    rerender({ ...baseProps(), activePointId: null })
    expect(result.current.activePoint).toBeNull()
  })

  it('ignores keys that do not navigate', () => {
    const { result } = renderLineChart()
    let handled = true
    act(() => {
      handled = result.current.handleKey('Tab')
    })
    expect(handled).toBe(false)
    expect(result.current.activePointId).toBeNull()
  })

  it('folds 18 series into three facets with a shared y domain and a sentence each', () => {
    const many = byName('Many series')
    const { result } = renderLineChart({ series: many.series })
    const { facets } = result.current
    expect(facets.map((f) => f.cleaned.length)).toEqual([6, 6, 6])
    expect(new Set(facets.map((f) => JSON.stringify(f.geometry.domains))).size).toBe(1)
    expect(facets.every((f) => f.summary.startsWith('Lines of code.'))).toBe(true)
  })

  it('lets Down cross from the last series of one facet into the next', () => {
    const many = byName('Many series')
    const { result } = renderLineChart({ series: many.series, defaultActivePointId: 'pkg-06@1' })
    act(() => {
      result.current.handleKey('ArrowDown')
    })
    expect(result.current.activePointId).toBe('pkg-07@1')
  })

  it('is empty with no finite value and uses a custom summarize', () => {
    const summarize = vi.fn(() => 'Custom.')
    const { result } = renderLineChart({ series: byName('NaN').series.slice(1), summarize })
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.facets[0]?.summary).toBe('Custom.')
    expect(renderLineChart().result.current.isEmpty).toBe(false)
  })
})

function baseProps(): UseLineChartOptions {
  return { series: twoPoints.series, width: 360, height: 180, metricLabel: twoPoints.metricLabel }
}
