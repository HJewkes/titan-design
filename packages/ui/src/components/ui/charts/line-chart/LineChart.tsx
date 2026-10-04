// LineChart shell (TD-34 S4): binds the image, the one tab stop, hover, the readout and the loading
// and empty states around LinePlot. Geometry and the active point come from useLineChart.
import { useMemo } from 'react'
import { View } from 'react-native'

import { cn } from '../../../../utils/cn'
import { Skeleton } from '../../skeleton'
import { facetSeries } from './line-chart-model'
import { densityFor, plotFrame, type PlotFrame } from './line-layout-model'
import { chartLabels, pointName, readPoint } from './line-readout-model'
import { LineChartPlaceholder } from './LineChartPlaceholder'
import { LinePlot } from './LinePlot'
import { LineLegend } from './LinePlotLabels'
import { LinePoints } from './LinePoints'
import type { LineChartProps, LineSeries } from './types'
import { useLineChart, type LineChartState } from './useLineChart'

type Wording = Pick<LineChartProps, 'xScale' | 'formatX' | 'formatY' | 'unit'>

interface LineChartPictureProps extends Pick<
  LineChartProps,
  'width' | 'height' | 'metricLabel' | 'onPointPress'
> {
  chart: LineChartState
  frame: PlotFrame
  /** The series drawn, in colour order. */
  series: readonly LineSeries[]
  wording: Wording
  showLegend: boolean
  animate: boolean
}

/** The image and, beside it, the tab stop that reads its points. */
function LineChartPicture(props: LineChartPictureProps) {
  const { chart, frame, series, width, height, showLegend, onPointPress } = props
  const { xScale, formatX, formatY, unit } = props.wording
  const labels = useMemo(
    () => chartLabels({ xScale, formatX, formatY }),
    [xScale, formatX, formatY]
  )
  const facet = chart.facets[0]
  if (!facet) return null
  const active = chart.activePoint
  const readout = active ? readPoint(active, series, labels, unit) : null
  const pressActive = () => {
    const owner = series.find((s) => s.id === active?.seriesId)
    if (active && owner) onPointPress?.(active.point, owner)
  }
  return (
    <>
      <View role="img" aria-label={facet.summary} testID="line-chart-image">
        <LinePlot
          facet={facet}
          frame={frame}
          width={width}
          height={height}
          labels={labels}
          xLabelGap={densityFor(width).xLabelGap}
          showEndLabels={!showLegend}
          animate={props.animate}
          active={active}
          readout={readout}
        />
        {showLegend && <LineLegend series={series} left={frame.left} />}
      </View>
      <LinePoints
        chart={chart}
        frame={frame}
        label={`${props.metricLabel}: data points`}
        activeName={readout ? pointName(readout) : null}
        onPress={pressActive}
      />
    </>
  )
}

/**
 * A line chart of one to six series: data in, picture out. The picture is one image named by a
 * generated summary; the points are one tab stop beside it, stepped with the arrow keys.
 */
export function LineChart({
  series,
  width,
  height,
  size: _size,
  xScale,
  formatX,
  formatY,
  unit,
  includeZero,
  referenceLines,
  boundaries,
  metricLabel,
  summarize,
  activePointId,
  defaultActivePointId,
  onActivePointChange,
  onPointPress,
  showLegend = false,
  facetColumns: _facetColumns,
  animate = true,
  isLoading = false,
  emptyState,
  className,
  style,
  ...props
}: LineChartProps) {
  // One plot until facets land: beyond six series only the first facet is drawn.
  const visible = useMemo(() => facetSeries(series)[0] ?? [], [series])
  const hasGutterLabels = !showLegend || (referenceLines?.length ?? 0) > 0
  const frame = plotFrame({ width, height, hasGutterLabels, hasLegend: showLegend })
  const chart = useLineChart({
    series: visible,
    width: frame.plotWidth,
    height: frame.plotHeight,
    xScale,
    includeZero,
    referenceLines,
    boundaries,
    metricLabel,
    summarize,
    formatY,
    unit,
    activePointId,
    defaultActivePointId,
    onActivePointChange,
  })
  const facet = chart.facets[0]

  if (isLoading) {
    return (
      <Skeleton
        testID="line-chart-loading"
        variant="rounded"
        accessibilityLabel={`Loading ${metricLabel}`}
        className={className}
        style={[style, { width, height }]}
        {...props}
      />
    )
  }
  if (chart.isEmpty || !facet) {
    return (
      <LineChartPlaceholder
        width={width}
        height={height}
        metricLabel={metricLabel}
        emptyState={emptyState}
        className={className}
        style={style}
        {...props}
      />
    )
  }
  return (
    <View className={cn('relative', className)} style={[style, { width, height }]} {...props}>
      <LineChartPicture
        chart={chart}
        frame={frame}
        series={visible}
        width={width}
        height={height}
        wording={{ xScale, formatX, formatY, unit }}
        metricLabel={metricLabel}
        showLegend={showLegend}
        animate={animate}
        onPointPress={onPointPress}
      />
    </View>
  )
}
