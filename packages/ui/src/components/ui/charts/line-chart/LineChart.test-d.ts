import { describe, expectTypeOf, it } from 'vitest'

import type { LineChartProps, LinePoint, LineSeries } from './types'

describe('LineChart types', () => {
  it('accepts a Date or a number for x and rejects a string', () => {
    const points: LinePoint[] = [
      { x: new Date(0), y: 1 },
      { x: 2, y: null, missing: 'not-measured' },
      // @ts-expect-error x is a Date or a number, never a string
      { x: '2026-09-08', y: 3 },
    ]
    expectTypeOf(points).toEqualTypeOf<LinePoint[]>()
    expectTypeOf<LinePoint['x']>().toEqualTypeOf<number | Date>()
  })

  it('types the controlled active point pair', () => {
    expectTypeOf<LineChartProps['activePointId']>().toEqualTypeOf<string | null | undefined>()
    expectTypeOf<NonNullable<LineChartProps['onActivePointChange']>>()
      .parameter(0)
      .toEqualTypeOf<string | null>()
    expectTypeOf<LineChartProps['defaultActivePointId']>().toEqualTypeOf<string | undefined>()
  })

  it('passes the series to onPointPress', () => {
    const onPointPress: NonNullable<LineChartProps['onPointPress']> = (point, series) => {
      expectTypeOf(point).toEqualTypeOf<LinePoint>()
      expectTypeOf(series).toEqualTypeOf<LineSeries>()
    }
    // @ts-expect-error onPointPress needs the series as well as the point
    const pointOnly: (point: LinePoint) => void = onPointPress
    expectTypeOf(pointOnly).toBeFunction()
  })
})
