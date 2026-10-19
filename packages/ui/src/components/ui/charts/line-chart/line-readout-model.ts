// The words LineChart puts on ticks and on the active point (TD-34 S4). Pure.
import { toNumber } from './line-chart-model'
import type { LineChartProps, LineSeries, ProjectedPoint } from './types'

const tickNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const valueNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const tickDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const pointDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export interface ChartLabels {
  xTick: (value: number) => string
  yTick: (value: number) => string
  x: (value: number) => string
  y: (value: number) => string
}

type LabelProps = Pick<LineChartProps, 'xScale' | 'formatX' | 'formatY'>

/** Tick and readout wording: the consumer's formatters, or compact ticks and full readout values. */
export function chartLabels({ xScale, formatX, formatY }: LabelProps): ChartLabels {
  const linear = xScale === 'linear'
  const custom = formatX && ((value: number) => formatX(linear ? value : new Date(value)))
  const value = (y: number) => valueNumber.format(y)
  const tick = (x: number) => (linear ? tickNumber.format(x) : tickDate.format(x))
  return {
    xTick: custom ?? tick,
    x: custom ?? (linear ? value : (x: number) => pointDate.format(x)),
    yTick: formatY ?? ((y: number) => tickNumber.format(y)),
    y: formatY ?? value,
  }
}

/** What the readout says about the active point. */
export interface PointReadout {
  series: string
  x: string
  value: string
}

/** The active point in words: series, x, then the value with its unit or why there is none. */
export function readPoint(
  active: ProjectedPoint,
  series: readonly LineSeries[],
  labels: ChartLabels,
  unit?: string
): PointReadout {
  const { x, y, missing } = active.point
  const noValue = missing ? `no value: ${missing}` : 'no value'
  return {
    series: series.find((s) => s.id === active.seriesId)?.label ?? active.seriesId,
    x: labels.x(toNumber(x)),
    value: y === null ? noValue : [labels.y(y), unit].filter(Boolean).join(' '),
  }
}

/** The name announced for the active point. */
export const pointName = (readout: PointReadout): string =>
  `${readout.series}, ${readout.x}, ${readout.value}`
