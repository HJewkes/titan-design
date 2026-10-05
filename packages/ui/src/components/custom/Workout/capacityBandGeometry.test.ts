import { describe, expect, it } from 'vitest'
import {
  PADDING_LEFT,
  PADDING_TOP,
  buildColumns,
  buildEdges,
  capacityBandLayout,
  capacityBandScale,
  capacityBandSummary,
  collectValues,
  interpEdge,
  parseTime,
  toPixels,
  workoutDotLabel,
  type BandPoint,
  type PixelPoint,
  type LoadDot,
} from './capacityBandGeometry'

const identityScale = {
  toX: (date: string) => Number(date.slice(-2)),
  toY: (value: number) => value,
}

const bandOf = (length: number): BandPoint[] =>
  Array.from({ length }, (_, i) => ({
    date: `2026-06-${String(i + 1).padStart(2, '0')}`,
    bandLow: 40,
    bandHigh: 60,
  }))

describe('parseTime', () => {
  it('reads a yyyy-mm-dd date as UTC midnight', () => {
    expect(parseTime('2026-06-01')).toBe(Date.UTC(2026, 5, 1))
  })

  it('falls back to Date.parse for other formats', () => {
    expect(parseTime('Mon, 01 Jun 2026 12:00:00 GMT')).toBe(Date.UTC(2026, 5, 1, 12))
  })

  it('gives 0 for an unparseable string', () => {
    expect(parseTime('not a date')).toBe(0)
  })
})

describe('toPixels', () => {
  it('projects each point and sorts the result left to right', () => {
    const points = [
      { date: '2026-06-09', bandLow: 1, bandHigh: 2 },
      { date: '2026-06-03', bandLow: 3, bandHigh: 4 },
    ]
    expect(toPixels(points, identityScale.toX, identityScale.toY)).toEqual([
      { x: 3, yHigh: 4, yLow: 3 },
      { x: 9, yHigh: 2, yLow: 1 },
    ])
  })
})

describe('interpEdge', () => {
  const pixels: PixelPoint[] = [
    { x: 0, yHigh: 0, yLow: 10 },
    { x: 10, yHigh: 20, yLow: 30 },
  ]

  it('interpolates linearly between two points', () => {
    expect(interpEdge(pixels, 5, 'yHigh')).toBe(10)
    expect(interpEdge(pixels, 5, 'yLow')).toBe(20)
  })

  it('returns the last point past the end', () => {
    expect(interpEdge(pixels, 20, 'yHigh')).toBe(20)
  })

  it('takes the left point where two points share an x', () => {
    const stacked = [
      { x: 4, yHigh: 1, yLow: 2 },
      { x: 4, yHigh: 9, yLow: 9 },
    ]
    expect(interpEdge(stacked, 4, 'yHigh')).toBe(1)
  })
})

describe('buildColumns', () => {
  it('gives no columns for fewer than two points', () => {
    expect(buildColumns([], 4)).toEqual([])
    expect(buildColumns([{ x: 0, yHigh: 0, yLow: 10 }], 4)).toEqual([])
  })

  it('steps from the first x up to, not including, the last x', () => {
    const columns = buildColumns(
      [
        { x: 0, yHigh: 0, yLow: 10 },
        { x: 8, yHigh: 0, yLow: 10 },
      ],
      4
    )
    expect(columns).toEqual([
      { x: 0, top: 0, height: 10 },
      { x: 4, top: 0, height: 10 },
    ])
  })

  it('clamps a crossed band to zero height', () => {
    const [column] = buildColumns(
      [
        { x: 0, yHigh: 10, yLow: 0 },
        { x: 4, yHigh: 10, yLow: 0 },
      ],
      4
    )
    expect(column.height).toBe(0)
  })
})

describe('buildEdges', () => {
  it('gives one segment per gap with its length and angle in degrees', () => {
    const segments = buildEdges(
      [
        { x: 0, yHigh: 0, yLow: 0 },
        { x: 3, yHigh: 4, yLow: 0 },
      ],
      'yHigh'
    )
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({ left: 0, top: 0, length: 5 })
    expect(segments[0].angle).toBeCloseTo(53.13, 2)
  })

  it('gives no segments for a single point', () => {
    expect(buildEdges([{ x: 0, yHigh: 0, yLow: 0 }], 'yLow')).toEqual([])
  })
})

describe('collectValues', () => {
  it('gathers band bounds, loads and both projections', () => {
    const point = { date: '2026-06-01', bandLow: 1, bandHigh: 2 }
    const workout: LoadDot = { date: '2026-06-01', load: 3, status: 'within' }
    const projection = {
      withTraining: [{ ...point, bandLow: 4, bandHigh: 5 }],
      withRest: [{ ...point, bandLow: 6, bandHigh: 7 }],
    }
    expect(collectValues([point], [workout], projection)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe('capacityBandScale', () => {
  it('maps the first date to the left padding and the last to the plot edge', () => {
    const { toX } = capacityBandScale(bandOf(3), [], undefined, 100, 50)
    expect(toX('2026-06-01')).toBe(PADDING_LEFT)
    expect(toX('2026-06-03')).toBe(PADDING_LEFT + 100)
  })

  it('pads a flat value domain by 1 so the band sits mid-plot', () => {
    const flat = [{ date: '2026-06-01', bandLow: 50, bandHigh: 50 }]
    const { toX, toY } = capacityBandScale(flat, [], undefined, 100, 40)
    expect(toY(50)).toBe(PADDING_TOP + 20)
    expect(toX('2026-06-01')).toBe(PADDING_LEFT)
  })

  it('pads the value domain by 10% of its span', () => {
    const { toY } = capacityBandScale(bandOf(2), [], undefined, 100, 120)
    expect(toY(62)).toBe(PADDING_TOP)
    expect(toY(38)).toBe(PADDING_TOP + 120)
  })
})

describe('capacityBandLayout', () => {
  it.each([
    [1, 1],
    [5, 1],
    [11, 3],
  ])('labels every stride-th date for %i points (stride %i)', (length, stride) => {
    expect(capacityBandLayout(bandOf(length), undefined, identityScale).labelStride).toBe(stride)
  })

  it('has no projection pixels without a projection', () => {
    const layout = capacityBandLayout(bandOf(3), undefined, identityScale)
    expect(layout).toMatchObject({ hasProjection: false, trainingPixels: [], restPixels: [] })
  })

  it('starts an empty projection at the last band point', () => {
    const layout = capacityBandLayout(bandOf(3), { withTraining: [], withRest: [] }, identityScale)
    expect(layout.hasProjection).toBe(true)
    expect(layout.trainingPixels).toEqual([{ x: 3, yHigh: 60, yLow: 40 }])
    expect(layout.restPixels).toEqual([{ x: 3, yHigh: 60, yLow: 40 }])
  })

  it('builds columns and both edges from the band', () => {
    const layout = capacityBandLayout(bandOf(3), undefined, identityScale)
    expect(layout.columns).toHaveLength(1)
    expect(layout.topEdge).toHaveLength(2)
    expect(layout.bottomEdge).toHaveLength(2)
  })
})

describe('capacityBandSummary', () => {
  it('says there are no recent sessions when there are no workouts', () => {
    expect(capacityBandSummary([])).toBe(
      'Training capacity band chart. Current capacity: no recent sessions. 0 workouts shown.'
    )
  })

  it('uses the singular for one workout', () => {
    expect(capacityBandSummary([{ date: '2026-06-01', load: 50, status: 'below' }])).toBe(
      'Training capacity band chart. Current capacity: below range. 1 workout shown.'
    )
  })

  it('reports the latest workout by date, whatever the input order', () => {
    const workouts: LoadDot[] = [
      { date: '2026-06-09', load: 90, status: 'above' },
      { date: '2026-06-01', load: 50, status: 'below' },
      { date: '2026-06-05', load: 60, status: 'within' },
    ]
    expect(capacityBandSummary(workouts)).toBe(
      'Training capacity band chart. Current capacity: above range. 3 workouts shown.'
    )
  })
})

describe('workoutDotLabel', () => {
  it('names the date, load and status of a workout', () => {
    expect(workoutDotLabel({ date: '2026-06-14', load: 48, status: 'below' })).toBe(
      'Workout on 6/14, load 48, below range'
    )
  })
})
