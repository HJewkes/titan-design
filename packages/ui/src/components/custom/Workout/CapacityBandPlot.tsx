import { View, Text, Animated } from 'react-native'
import {
  COLUMN_STEP,
  buildColumns,
  buildEdges,
  type CapacityBandColors,
  type CapacityBandLayout,
  type PixelPoint,
} from './capacityBandGeometry'

interface BandColumnsProps {
  columns: ReturnType<typeof buildColumns>
  color: string
  testID: string
}

function BandColumns({ columns, color, testID }: BandColumnsProps) {
  return (
    <>
      {columns.map((col, i) => (
        <View
          key={`${testID}-${i}`}
          style={{
            position: 'absolute',
            left: col.x,
            top: col.top,
            width: COLUMN_STEP + 0.5,
            height: col.height,
            backgroundColor: color,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID={testID}
        />
      ))}
    </>
  )
}

interface BandEdgesProps {
  segments: ReturnType<typeof buildEdges>
  color: string
  dashed: boolean
  testID: string
}

function BandEdges({ segments, color, dashed, testID }: BandEdgesProps) {
  return (
    <>
      {segments.map((seg, i) => (
        <View
          key={`${testID}-${i}`}
          style={{
            position: 'absolute',
            left: seg.left,
            top: seg.top,
            width: seg.length,
            height: dashed ? 0 : 1.5,
            borderTopWidth: dashed ? 1 : 0,
            borderTopColor: dashed ? color : undefined,
            borderStyle: dashed ? 'dashed' : 'solid',
            backgroundColor: dashed ? undefined : color,
            opacity: dashed ? 0.7 : 1,
            transformOrigin: '0 0',
            transform: [{ rotate: `${seg.angle}deg` }],
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID={testID}
        />
      ))}
    </>
  )
}

interface ProjectionProps {
  trainingPixels: PixelPoint[]
  restPixels: PixelPoint[]
  colors: CapacityBandColors
}

function ProjectionLabels({ trainingPixels, restPixels, colors }: ProjectionProps) {
  return (
    <>
      <Text
        style={{
          position: 'absolute',
          left: trainingPixels[trainingPixels.length - 1]?.x + 2,
          top: trainingPixels[trainingPixels.length - 1]?.yHigh - 12,
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
          color: colors.success,
        }}
        testID="capacity-band-chart-projection-training-label"
      >
        Training
      </Text>
      <Text
        style={{
          position: 'absolute',
          left: restPixels[restPixels.length - 1]?.x + 2,
          top: restPixels[restPixels.length - 1]?.yLow + 2,
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
          color: colors.info,
        }}
        testID="capacity-band-chart-projection-rest-label"
      >
        Rest
      </Text>
    </>
  )
}

function ProjectionLayer({ trainingPixels, restPixels, colors }: ProjectionProps) {
  return (
    <View testID="capacity-band-chart-projection">
      <BandColumns
        columns={buildColumns(trainingPixels, COLUMN_STEP)}
        color={colors.projectionFill}
        testID="capacity-band-chart-projection-fill"
      />
      <BandColumns
        columns={buildColumns(restPixels, COLUMN_STEP)}
        color={colors.projectionFill}
        testID="capacity-band-chart-projection-fill"
      />
      <BandEdges
        segments={buildEdges(trainingPixels, 'yHigh')}
        color={colors.success}
        dashed
        testID="capacity-band-chart-projection-training"
      />
      <BandEdges
        segments={buildEdges(trainingPixels, 'yLow')}
        color={colors.success}
        dashed
        testID="capacity-band-chart-projection-training"
      />
      <BandEdges
        segments={buildEdges(restPixels, 'yHigh')}
        color={colors.info}
        dashed
        testID="capacity-band-chart-projection-rest"
      />
      <BandEdges
        segments={buildEdges(restPixels, 'yLow')}
        color={colors.info}
        dashed
        testID="capacity-band-chart-projection-rest"
      />
      <ProjectionLabels trainingPixels={trainingPixels} restPixels={restPixels} colors={colors} />
    </View>
  )
}

interface CapacityBandPlotProps {
  layout: CapacityBandLayout
  colors: CapacityBandColors
  revealWidth: Animated.AnimatedInterpolation<number>
  width: number
  height: number
}

/** The band and projection, drawn left to right through an animated clip. */
export function CapacityBandPlot({
  layout,
  colors,
  revealWidth,
  width,
  height,
}: CapacityBandPlotProps) {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height,
        width: revealWidth,
        overflow: 'hidden',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="capacity-band-chart-reveal"
    >
      <View style={{ width, height, position: 'relative' }}>
        {layout.hasProjection && (
          <ProjectionLayer
            trainingPixels={layout.trainingPixels}
            restPixels={layout.restPixels}
            colors={colors}
          />
        )}

        <View testID="capacity-band-chart-band">
          <BandColumns
            columns={layout.columns}
            color={colors.bandFill}
            testID="capacity-band-chart-band-cell"
          />
        </View>
        <BandEdges
          segments={layout.topEdge}
          color={colors.bandEdge}
          dashed={false}
          testID="capacity-band-chart-edge-top"
        />
        <BandEdges
          segments={layout.bottomEdge}
          color={colors.bandEdge}
          dashed={false}
          testID="capacity-band-chart-edge-bottom"
        />
      </View>
    </Animated.View>
  )
}
