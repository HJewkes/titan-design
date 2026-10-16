import { describe, expect, it } from 'vitest'

import { byName } from './fixtures'
import { cleanSeries, facetSeries } from './line-chart-model'
import { summarizeFacets, summarizeLines } from './summary-model'
import type { LineSeries } from './types'

function summaryOf(name: string): string {
  const fixture = byName(name)
  return summarizeLines(fixture.series.map(cleanSeries), fixture)
}

describe('summarizeLines', () => {
  it('claims no trend from one point', () => {
    const summary = summaryOf('One point')
    expect(summary).toBe('Lines of code. Total: latest 60,490, one value, no trend.')
    expect(summary).not.toMatch(/\b(up|down|unchanged)\b/)
  })

  it('gives the change over the span from two points', () => {
    expect(summaryOf('Two points')).toBe(
      'Lines of code. Total: latest 60,490, up 6,829 from 53,661.'
    )
  })

  it('counts gaps', () => {
    expect(summaryOf('Gaps')).toContain('11 gaps')
    expect(summaryOf('Real history')).toContain(
      'Package B: latest 2,699, up 317 from 2,382, 10 gaps.'
    )
  })

  it('says the span is not comparable at an index change and trends only since it', () => {
    const summary = summaryOf('Index change')
    expect(summary).toContain('not comparable across 1 index change')
    expect(summary).toContain('up 31,888 from 28,602')
  })

  it('says one value when an index change leaves the latest span a single point', () => {
    const series: LineSeries = {
      id: 's',
      label: 'S',
      points: [
        { x: 1, y: 5, segmentKey: 'a' },
        { x: 2, y: 9, segmentKey: 'b' },
      ],
    }
    expect(summarizeLines([cleanSeries(series)], { metricLabel: 'M' })).toBe(
      'M. S: latest 9, one value, no trend, not comparable across 1 index change.'
    )
  })

  it('gives the empty sentence for no series and for no finite value', () => {
    expect(summaryOf('Empty')).toBe('Lines of code: no data.')
    const allNaN = byName('NaN').series.slice(1)
    expect(summarizeLines(allNaN.map(cleanSeries), { metricLabel: 'NaN' })).toBe('NaN: no data.')
  })

  it('reports skipped values and series without values', () => {
    const summary = summaryOf('NaN')
    expect(summary).toContain('One NaN: latest 7, up 3 from 4, 1 unreadable value skipped.')
    expect(summary).toContain('All NaN: no values, 3 unreadable values skipped.')
  })

  it('says unchanged for a flat span and honours unit and formatY', () => {
    const fixture = byName('Flat')
    const summary = summarizeLines(fixture.series.map(cleanSeries), {
      metricLabel: 'Complexity',
      unit: 'pts',
      formatY: (y) => y.toFixed(1),
    })
    expect(summary).toBe('Complexity (pts). Package A: latest 40.0, unchanged from 40.0.')
  })
})

describe('summarizeFacets', () => {
  it('gives one sentence per facet', () => {
    const cleaned = byName('Many series').series.map(cleanSeries)
    const sentences = summarizeFacets(facetSeries(cleaned), { metricLabel: 'Lines' })
    expect(sentences).toHaveLength(3)
    expect(sentences[1]).toMatch(/^Lines\. pkg-07: /)
  })
})
