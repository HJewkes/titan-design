import { useCallback, useMemo } from 'react'

import { useControllableState } from '../../../../hooks/useControllableState'
import {
  cleanSeries,
  facetSeries,
  LINE_NAVIGATION_KEYS,
  lineDomains,
  nextPoint,
  projectSeries,
} from './line-chart-model'
import { summarizeLines } from './summary-model'
import type { CleanSeries, LineChartProps, LineGeometry, ProjectedPoint } from './types'

export type UseLineChartOptions = Pick<
  LineChartProps,
  | 'series'
  | 'xScale'
  | 'includeZero'
  | 'referenceLines'
  | 'boundaries'
  | 'metricLabel'
  | 'summarize'
  | 'formatY'
  | 'unit'
  | 'activePointId'
  | 'defaultActivePointId'
  | 'onActivePointChange'
> & {
  /** Plot width of one facet in px, inside the axes. */
  width: number
  /** Plot height of one facet in px, inside the axes. */
  height: number
}

export interface LineChartFacet {
  cleaned: CleanSeries[]
  geometry: LineGeometry
  summary: string
}

export interface LineChartState {
  /** One facet up to six series; facets of at most six beyond that, sharing both domains. */
  facets: LineChartFacet[]
  /** No series, or no finite value in any: the chart shows its empty state. */
  isEmpty: boolean
  activePointId: string | null
  activePoint: ProjectedPoint | null
  setActivePointId: (id: string | null) => void
  /** Applies a navigation key; `true` when the key was one, so the caller prevents default. */
  handleKey: (key: string) => boolean
}

function useFacets(options: UseLineChartOptions): LineChartFacet[] {
  const { series, width, height, xScale, includeZero, referenceLines, boundaries } = options
  const { metricLabel, summarize, formatY, unit } = options
  const cleaned = useMemo(() => series.map(cleanSeries), [series])
  return useMemo(() => {
    const plot = { width, height, xScale, includeZero, referenceLines, boundaries }
    const domains = lineDomains(cleaned, plot)
    return facetSeries(cleaned).map((facet) => ({
      cleaned: facet,
      geometry: projectSeries(facet, { ...plot, domains }),
      summary: summarize
        ? summarize(facet.map((clean) => clean.series))
        : summarizeLines(facet, { metricLabel, formatY, unit }),
    }))
  }, [
    cleaned,
    width,
    height,
    xScale,
    includeZero,
    referenceLines,
    boundaries,
    metricLabel,
    summarize,
    formatY,
    unit,
  ])
}

/** Memoised LineChart geometry and summaries, plus the active point (A6 controlled triple). */
export function useLineChart(options: UseLineChartOptions): LineChartState {
  const facets = useFacets(options)
  const [requestedId, setActivePointId] = useControllableState<string | null>({
    value: options.activePointId,
    defaultValue: options.defaultActivePointId ?? null,
    onChange: options.onActivePointChange,
  })
  const projected = useMemo(() => facets.flatMap((facet) => facet.geometry.series), [facets])
  const activePoint = useMemo(
    () => projected.flatMap((s) => s.points).find((p) => p.id === requestedId) ?? null,
    [projected, requestedId]
  )
  const activePointId = activePoint?.id ?? null

  const handleKey = useCallback(
    (key: string): boolean => {
      if (!LINE_NAVIGATION_KEYS.includes(key)) return false
      setActivePointId(nextPoint(projected, activePointId, key))
      return true
    },
    [projected, activePointId, setActivePointId]
  )

  const isEmpty = facets.every((facet) => facet.cleaned.every((c) => c.segments.length === 0))
  return { facets, isEmpty, activePointId, activePoint, setActivePointId, handleKey }
}
